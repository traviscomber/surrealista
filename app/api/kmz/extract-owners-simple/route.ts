import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enhancedExtractor } from "@/lib/kmz/enhanced-owner-extraction"

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    const { batch_size = 50, dry_run = false } = await request.json()

    // Get pending KMZ files without owner data
    const { data: kmzFiles, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, name, metadata")
      .is("metadata->public_owner_candidate", null)
      .limit(batch_size)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

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
        const candidates = enhancedExtractor.extract(kmz.name, kmz.metadata?.description)

        if (candidates.length > 0) {
          const topCandidate = candidates[0]

          if (!dry_run) {
            // Update Supabase with extracted owner
            const updated_metadata = {
              ...(kmz.metadata || {}),
              public_owner_candidate: topCandidate.name,
              owner_confidence: topCandidate.confidence,
              owner_research_leads: candidates.map((c) => ({
                name: c.name,
                type: c.type,
                confidence: c.confidence,
                source: c.source,
              })),
              updated_at: new Date().toISOString(),
            }

            const { error: updateError } = await supabase
              .from("kmz_collection")
              .update({ metadata: updated_metadata })
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
            name: kmz.name,
            owner: topCandidate.name,
            confidence: topCandidate.confidence,
            type: topCandidate.type,
            candidates: candidates,
          })
        }
      } catch (err) {
        console.error(`[v0] Error processing ${kmz.name}:`, err)
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
