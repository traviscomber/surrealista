import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enhancedExtractor } from "@/lib/kmz/enhanced-owner-extraction"

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 })
    }

    const { batch_size = 50, dry_run = false } = await request.json()

    // Get pending KMZ files without owner data
    // Use OR logic: either metadata is null OR public_owner_candidate field is missing/null
    const { data: allKmz, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata")
      .limit(batch_size + 500) // Get more to account for filtering

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    // Filter for ones without owner data
    const kmzFiles = (allKmz || [])
      .filter((kmz) => !kmz.metadata || !kmz.metadata.public_owner_candidate)
      .slice(0, batch_size)

    if (!kmzFiles || kmzFiles.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        results: [],
        message: "No pending KMZ files found",
      })
    }

    const results = []
    let updated = 0

    for (const kmz of kmzFiles) {
      try {
        // Extract owners from filename and metadata
        const candidates = enhancedExtractor.extract(kmz.file_name, kmz.metadata?.description)

        if (candidates.length > 0) {
          const topCandidate = candidates[0]
          const now = new Date().toISOString()

          if (!dry_run) {
            // Update Supabase with extracted owner
            const updated_metadata = {
              ...(kmz.metadata || {}),
              public_owner_candidate: {
                name: topCandidate.name,
                type: topCandidate.type === "company" ? "company" : "person",
                confidence: topCandidate.confidence,
                reason: `Extracted from KMZ ${topCandidate.source} using ${topCandidate.pattern}`,
                source: `kmz_${topCandidate.source}`,
                dateFound: now,
              },
              owner_confidence: topCandidate.confidence,
              owner_type: topCandidate.type,
              owner_research_leads: candidates.map((c) => ({
                name: c.name,
                type: c.type === "company" ? "company" : "person",
                confidence: c.confidence,
                reason: `Extracted from KMZ ${c.source} using ${c.pattern}`,
                source: `kmz_${c.source}`,
                dateFound: now,
              })),
              owner_candidates: candidates,
              updated_at: new Date().toISOString(),
            }

            const { error: updateError } = await supabase
              .from("kmz_collection")
              .update({
                owner: topCandidate.name,
                metadata: updated_metadata,
              })
              .eq("id", kmz.id)

            if (updateError) {
              console.error(`[v0] Update failed for ${kmz.name}:`, updateError.message)
            } else {
              updated++
            }
          } else {
            updated++ // Count as processed in dry-run
          }

          results.push({
            kmz_id: kmz.id,
            name: kmz.file_name,
            owner: topCandidate.name,
            confidence: topCandidate.confidence,
            type: topCandidate.type,
            candidates: candidates,
          })
        }
      } catch (err) {
        console.error(`[v0] Error processing ${kmz.file_name}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      processed: kmzFiles.length,
      updated: updated,
      dry_run: dry_run,
      results: results,
    })
  } catch (error) {
    console.error("[v0] Extract owners error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
