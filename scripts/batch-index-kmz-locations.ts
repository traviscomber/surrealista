import { createClient } from "@/lib/supabase/server"
import { KMZLocationIndexer } from "@/lib/kmz/kmz-location-indexer"
import type { KMZPlacemark } from "@/lib/kmz/kmz-reader"

type KmzRow = {
  id: string
  file_name: string
  region: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeKmzRow(value: unknown): KmzRow | null {
  const row = asRecord(value)
  if (!row) return null

  const id = typeof row.id === "string" ? row.id : ""
  const fileName = typeof row.file_name === "string" ? row.file_name : ""
  if (!id || !fileName) return null

  return {
    id,
    file_name: fileName,
    region: typeof row.region === "string" && row.region.length > 0 ? row.region : null,
  }
}

function normalizeCoordinates(value: unknown): KMZPlacemark["coordinates"] {
  if (!Array.isArray(value)) return []

  return value.flatMap((coordinate) => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return []
    const lng = Number(coordinate[0])
    const lat = Number(coordinate[1])
    const altitude = coordinate.length > 2 ? Number(coordinate[2]) : undefined
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return []

    return [
      Number.isFinite(altitude)
        ? ([lng, lat, altitude] as [number, number, number])
        : ([lng, lat] as [number, number]),
    ]
  })
}

function normalizePlacemark(value: unknown): KMZPlacemark | null {
  const row = asRecord(value)
  if (!row) return null

  const name = typeof row.name === "string" ? row.name : ""
  const type = row.type
  const coordinates = normalizeCoordinates(row.coordinates)

  if (!name || coordinates.length === 0 || !["Point", "LineString", "Polygon"].includes(String(type))) {
    return null
  }

  return {
    name,
    description: typeof row.description === "string" ? row.description : undefined,
    coordinates,
    type: type as KMZPlacemark["type"],
    styleUrl: typeof row.style_url === "string" ? row.style_url : undefined,
    properties: asRecord(row.properties) || undefined,
  }
}

/**
 * Rebuild searchable location indexes for stored KMZ files that have not yet
 * been indexed. Source data comes from the canonical kmz_collection and
 * kmz_placemarks tables; the script does not redownload KMZ files.
 */
async function indexAllKMZFiles() {
  const requestId = `[${new Date().toISOString()}]`
  console.log(requestId, "[v0] Starting batch KMZ location indexing...")

  try {
    const supabase = await createClient()
    const indexer = new KMZLocationIndexer()

    const { data: rawKmzRows, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region")
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (fetchError) throw new Error(`Failed to fetch KMZ collection: ${fetchError.message}`)

    const kmzRows = (Array.isArray(rawKmzRows) ? rawKmzRows : [])
      .map(normalizeKmzRow)
      .filter((row): row is KmzRow => row !== null)

    if (kmzRows.length === 0) {
      return {
        success: true,
        message: "No active KMZ files found",
        totalProcessed: 0,
        totalIndexed: 0,
        totalFailed: 0,
        results: [],
      }
    }

    const { data: rawExistingLocations, error: existingError } = await supabase
      .from("kmz_location_index")
      .select("kmz_id")

    if (existingError) throw new Error(`Failed to fetch existing location indexes: ${existingError.message}`)

    const indexedKmzIds = new Set(
      (Array.isArray(rawExistingLocations) ? rawExistingLocations : []).flatMap((value) => {
        const row = asRecord(value)
        return typeof row?.kmz_id === "string" ? [row.kmz_id] : []
      }),
    )

    let totalIndexed = 0
    let totalFailed = 0
    const results: Array<Record<string, unknown>> = []

    for (const kmz of kmzRows) {
      if (indexedKmzIds.has(kmz.id)) {
        results.push({ kmzId: kmz.id, fileName: kmz.file_name, status: "skipped", reason: "Already indexed" })
        continue
      }

      try {
        const { data: rawPlacemarks, error: placemarkError } = await supabase
          .from("kmz_placemarks")
          .select("name, description, coordinates, type, style_url, properties")
          .eq("kmz_id", kmz.id)

        if (placemarkError) throw new Error(placemarkError.message)

        const placemarks = (Array.isArray(rawPlacemarks) ? rawPlacemarks : [])
          .map(normalizePlacemark)
          .filter((placemark): placemark is KMZPlacemark => placemark !== null)

        if (placemarks.length === 0) {
          results.push({
            kmzId: kmz.id,
            fileName: kmz.file_name,
            status: "skipped",
            reason: "No stored placemarks",
          })
          continue
        }

        const result = await indexer.indexKMZLocations(kmz.id, kmz.file_name, placemarks, kmz.region || undefined)
        if (!result.success) throw result.error || new Error("KMZ location indexing failed")

        totalIndexed += result.indexCount
        results.push({
          kmzId: kmz.id,
          fileName: kmz.file_name,
          status: "success",
          indexedLocations: result.indexCount,
        })
      } catch (fileError) {
        const message = fileError instanceof Error ? fileError.message : "Unknown error"
        console.error(requestId, "[v0] Error processing KMZ file:", kmz.file_name, message)
        results.push({ kmzId: kmz.id, fileName: kmz.file_name, status: "error", error: message })
        totalFailed++
      }
    }

    return {
      success: totalFailed === 0,
      message: "Batch KMZ indexing completed",
      totalProcessed: kmzRows.length,
      totalIndexed,
      totalFailed,
      results,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(requestId, "[v0] Batch indexing failed:", message)
    return { success: false, error: message }
  }
}

if (require.main === module) {
  indexAllKMZFiles()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Fatal error:", error)
      process.exit(1)
    })
}

export { indexAllKMZFiles }
