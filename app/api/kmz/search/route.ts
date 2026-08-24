import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function normalizeAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function sanitizeSearchTerm(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function uniqueById<T extends { id: string | number }>(rows: T[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = String(row.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    const rawQuery = request.nextUrl.searchParams.get("q") || ""
    const query = sanitizeSearchTerm(rawQuery.toLowerCase())

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Search term must be at least 2 characters" },
        { status: 400 },
      )
    }

    const normalized = sanitizeSearchTerm(normalizeAccents(query))
    const terms = Array.from(new Set([query, normalized].filter((term) => term.length >= 2)))
    const supabase = await createClient()

    const locationAttempts = await Promise.all(
      terms.map((term) => {
        const pattern = `%${term}%`
        return supabase
          .from("kmz_search_index")
          .select("id, name, latitude, longitude, region, city, address, kmz_id, created_at")
          .or(
            `name.ilike.${pattern},region.ilike.${pattern},city.ilike.${pattern},address.ilike.${pattern},searchable_text.ilike.${pattern}`,
          )
          .limit(500)
      }),
    )

    const collectionAttempts = await Promise.all(
      terms.map((term) => {
        const pattern = `%${term}%`
        return supabase
          .from("kmz_collection")
          .select("id, file_name, region, category, created_at, is_active")
          .eq("is_active", true)
          .or(`file_name.ilike.${pattern},region.ilike.${pattern},category.ilike.${pattern}`)
          .limit(100)
      }),
    )

    const warnings: string[] = []
    const locations = uniqueById(
      locationAttempts.flatMap((attempt) => {
        if (attempt.error) {
          warnings.push(`kmz_search_index: ${attempt.error.message}`)
          return []
        }
        return attempt.data || []
      }),
    ).slice(0, 500)

    const kmzCollectionResults = uniqueById(
      collectionAttempts.flatMap((attempt) => {
        if (attempt.error) {
          warnings.push(`kmz_collection: ${attempt.error.message}`)
          return []
        }
        return attempt.data || []
      }),
    ).slice(0, 100)

    if (!locations.length && !kmzCollectionResults.length && warnings.length === locationAttempts.length + collectionAttempts.length) {
      console.error(requestId, "[KMZ search] all canonical queries failed", warnings)
      return NextResponse.json({ error: "KMZ search unavailable" }, { status: 503 })
    }

    const kmzFileMap: Record<string, unknown> = {}
    const kmzIds = Array.from(new Set(locations.map((location: any) => location.kmz_id).filter(Boolean)))

    if (kmzIds.length) {
      const { data: kmzFiles, error: detailsError } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, region, category")
        .in("id", kmzIds)

      if (detailsError) {
        warnings.push(`kmz_collection details: ${detailsError.message}`)
      } else {
        for (const kmz of kmzFiles || []) {
          kmzFileMap[String(kmz.id)] = kmz
        }
      }
    }

    const response = {
      success: true,
      searchTerm: query,
      results: {
        locations: locations.map((location: any) => ({
          ...location,
          kmz_file: kmzFileMap[String(location.kmz_id)] || null,
          source: "kmz_search_index",
        })),
        kmzCollection: kmzCollectionResults,
        propertyDocuments: [],
      },
      summary: {
        locationsFound: locations.length,
        kmzCollectionFound: kmzCollectionResults.length,
        propertyDocsFound: 0,
        totalKmzFiles: kmzCollectionResults.length,
      },
      warnings,
    }

    console.log(requestId, "[KMZ search] completed", response.summary)
    return NextResponse.json(response)
  } catch (error) {
    console.error(requestId, "[KMZ search] failed", error)
    return NextResponse.json({ error: "Error searching KMZ locations" }, { status: 500 })
  }
}
