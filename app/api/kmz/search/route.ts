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

function extractOwnerEvidence(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const record = metadata as Record<string, unknown>

  const confirmedRaw = typeof record.confirmed_owner === "string" ? record.confirmed_owner.trim() : ""
  if (confirmedRaw) {
    if (confirmedRaw.startsWith("{")) {
      try {
        const parsed = JSON.parse(confirmedRaw) as Record<string, unknown>
        const owner = typeof parsed.owner === "string" ? parsed.owner.trim() : ""
        const source = typeof parsed.sourceType === "string" ? parsed.sourceType.trim() : ""
        const documentUrl = typeof parsed.documentUrl === "string" ? parsed.documentUrl.trim() : ""
        if (owner && (source || documentUrl)) return owner
      } catch {
        // Ignore malformed legacy evidence and keep searching.
      }
    } else {
      const source = typeof record.owner_source === "string" ? record.owner_source.trim() : ""
      const evidenceUrl = typeof record.web_owner_evidence_url === "string" ? record.web_owner_evidence_url.trim() : ""
      if (source || evidenceUrl) return confirmedRaw
    }
  }

  const webOwner = typeof record.web_owner === "string" ? record.web_owner.trim() : ""
  const evidenceUrl = typeof record.web_owner_evidence_url === "string" ? record.web_owner_evidence_url.trim() : ""
  return webOwner && evidenceUrl ? webOwner : null
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
      terms.map(async (term) => {
        const pattern = `%${term}%`
        const textAttempt = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, category, rol_numbers, owner, metadata, created_at, is_active")
          .eq("is_active", true)
          .or(`file_name.ilike.${pattern},metadata->>manual_display_name.ilike.${pattern},region.ilike.${pattern},category.ilike.${pattern},owner.ilike.${pattern}`)
          .limit(100)

        const ownerEvidenceAttempt = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, category, rol_numbers, owner, metadata, created_at, is_active")
          .eq("is_active", true)
          .or(`metadata->>confirmed_owner.ilike.${pattern},metadata->>web_owner.ilike.${pattern}`)
          .limit(50)

        if (!/^\d{1,8}-\d{1,8}$/.test(term)) return [textAttempt, ownerEvidenceAttempt]

        const rolAttempt = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, category, rol_numbers, owner, created_at, is_active")
          .eq("is_active", true)
          .contains("rol_numbers", [term])
          .limit(100)

        return [textAttempt, ownerEvidenceAttempt, rolAttempt]
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
      collectionAttempts.flatMap((attemptGroup) =>
        attemptGroup.flatMap((attempt) => {
          if (attempt.error) {
            warnings.push(`kmz_collection: ${attempt.error.message}`)
            return []
          }
          return (attempt.data || []).map((row: any) => {
            const ownerEvidence = extractOwnerEvidence(row.metadata)
            const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
              ? row.metadata as Record<string, unknown>
              : {}
            const displayName = typeof metadata.manual_display_name === "string" && metadata.manual_display_name.trim()
              ? metadata.manual_display_name.trim()
              : row.file_name
            const { metadata: _metadata, ...safeRow } = row
            return { ...safeRow, display_name: displayName, ownerEvidence }
          })
        }),
      ),
    ).slice(0, 100)

    const totalCollectionAttempts = collectionAttempts.reduce((sum, group) => sum + group.length, 0)

    if (!locations.length && !kmzCollectionResults.length && warnings.length === locationAttempts.length + totalCollectionAttempts) {
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
