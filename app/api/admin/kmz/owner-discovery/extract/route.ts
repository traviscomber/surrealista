import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enhancedExtractor } from "@/lib/kmz/enhanced-owner-extraction"

type OwnerLead = {
  name: string
  type: "person" | "company"
  confidence: number
  reason: string
  source: string
  dateFound: string
}

function toOwnerLead(candidate: {
  name: string
  type: "person" | "company" | "property_name"
  confidence: number
  source: string
  pattern: string
}, dateFound: string): OwnerLead {
  return {
    name: candidate.name,
    type: candidate.type === "company" ? "company" : "person",
    confidence: candidate.confidence,
    reason: `Extracted from KMZ ${candidate.source} using ${candidate.pattern}`,
    source: `kmz_${candidate.source}`,
    dateFound,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dry_run, search_query } = await request.json()

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    let query = supabase
      .from("kmz_collection")
      .select("id, file_name, description, metadata, owner, rol_numbers")
      .eq("is_active", true)
      .is("owner", null)
      .limit(100)

    if (search_query) {
      query = query.ilike("file_name", `%${search_query}%`)
    }

    const { data: kmzFiles, error: queryError } = await query

    if (queryError) throw queryError
    if (!kmzFiles) return NextResponse.json({ error: "No data" }, { status: 400 })

    const results = await Promise.all(
      kmzFiles.map(async (kmz) => {
        try {
          const descriptionSources = [
            kmz.description,
            kmz.metadata?.name,
            kmz.metadata?.description,
            kmz.metadata?.author,
          ]
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .join(" | ")

          const extractedCandidates = enhancedExtractor
            .extract(kmz.file_name, descriptionSources)
            .filter((candidate) => candidate.type !== "property_name")

          const topCandidate = extractedCandidates[0] || null
          const now = new Date().toISOString()

          const result = {
            kmz_id: kmz.id,
            file_name: kmz.file_name,
            status: topCandidate ? "success" : "pending",
            confidence: topCandidate ? topCandidate.confidence : 0,
            owners_found: extractedCandidates.length,
            companies_found: extractedCandidates.filter((candidate) => candidate.type === "company").length,
            leads_found: extractedCandidates.length,
            message: topCandidate
              ? `Encontrados: ${extractedCandidates.map((candidate) => candidate.name).join(", ")}`
              : "No se encontraron coincidencias claras en el nombre o la descripcion",
          }

          if (!dry_run && topCandidate) {
            const updates = {
              owner: topCandidate.name,
              metadata: {
                ...(kmz.metadata || {}),
                public_owner_candidate: toOwnerLead(topCandidate, now),
                owner_confidence: topCandidate.confidence,
                owner_type: topCandidate.type,
                owner_research_leads: extractedCandidates.map((candidate) => toOwnerLead(candidate, now)),
                owner_candidates: extractedCandidates,
                updated_at: now,
              },
            }

            await supabase
              .from("kmz_collection")
              .update(updates)
              .eq("id", kmz.id)
          }

          return result
        } catch (error) {
          return {
            kmz_id: kmz.id,
            file_name: kmz.file_name,
            status: "error",
            confidence: 0,
            owners_found: 0,
            companies_found: 0,
            leads_found: 0,
            message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          }
        }
      }),
    )

    const stats = {
      total: kmzFiles.length,
      processed: results.length,
      successful: results.filter((r) => r.status === "success").length,
      errors: results.filter((r) => r.status === "error").length,
      average_confidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    }

    return NextResponse.json({ results, stats })
  } catch (error) {
    console.error("[v0] Owner extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
