import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { dry_run, search_query } = await request.json()

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch KMZ files
    let query = supabase
      .from("kmz_collection")
      .select("id, file_name, metadata, owner, rol_numbers")
      .eq("is_active", true)
      .is("owner", true)
      .limit(100)

    if (search_query) {
      query = query.ilike("file_name", `%${search_query}%`)
    }

    const { data: kmzFiles, error: queryError } = await query

    if (queryError) throw queryError
    if (!kmzFiles) return NextResponse.json({ error: "No data" }, { status: 400 })

    // Process each KMZ
    const results = await Promise.all(
      kmzFiles.map(async (kmz) => {
        try {
          // Extract owner hints from file name
          const ownerCandidates = extractOwnerFromFileName(kmz.file_name)

          const result = {
            kmz_id: kmz.id,
            file_name: kmz.file_name,
            status: ownerCandidates.length > 0 ? "success" : "pending",
            confidence: ownerCandidates.length > 0 ? 0.65 : 0,
            owners_found: ownerCandidates.length,
            companies_found: 0,
            leads_found: 0,
            message: ownerCandidates.length > 0 
              ? `Encontrados: ${ownerCandidates.join(", ")}` 
              : "No se encontraron coincidencias en el nombre",
          }

          // Persist if not dry_run
          if (!dry_run && result.status === "success") {
            const updates: any = {
              metadata: {
                ...(kmz.metadata || {}),
                public_owner_candidate: ownerCandidates[0] || null,
                owner_confidence: result.confidence,
                owner_research_leads: ownerCandidates,
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
      })
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
      { status: 500 }
    )
  }
}

// Extract owner candidates from file name patterns
function extractOwnerFromFileName(fileName: string): string[] {
  const candidates: string[] = []

  // Remove .kmz extension
  let name = fileName.replace(/\.kmz$/i, "")

  // Pattern: "Fundo/Campo/Parcela [Name]"
  const typeMatch = name.match(/(?:fundo|campo|parcela|propiedad|terreno)\s+(.+?)(?:\s*\(|\s*-|\s*\d|$)/i)
  if (typeMatch) {
    candidates.push(typeMatch[1].trim())
  }

  // Pattern: "[Name] - [Area]" or "[Name] ([Area])"
  const areaMatch = name.match(/^(.+?)\s*(?:-|\.)\s*\d+\s*(?:ha|hectare)/i)
  if (areaMatch) {
    candidates.push(areaMatch[1].trim())
  }

  // Just take first part before special chars
  if (candidates.length === 0) {
    const firstPart = name.split(/[-—_()[\]]/)[0].trim()
    if (firstPart.length > 3) {
      candidates.push(firstPart)
    }
  }

  return [...new Set(candidates)].slice(0, 3)
}
