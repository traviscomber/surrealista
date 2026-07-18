import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { dry_run, batch_size = 50 } = await request.json()

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch KMZ files that need processing (no owner data yet)
    const { data: kmzFiles, error: queryError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata, owner")
      .eq("is_active", true)
      .is("owner", true) // Only those without owner data
      .limit(batch_size)

    if (queryError) throw queryError
    if (!kmzFiles) return NextResponse.json({ error: "No data" }, { status: 400 })

    // Queue results
    const results = kmzFiles.map((kmz) => ({
      kmz_id: kmz.id,
      file_name: kmz.file_name,
      status: "pending",
      confidence: 0,
      owners_found: 0,
      companies_found: 0,
      leads_found: 0,
      message: "Encolado para procesamiento en background",
    }))

    // Persist batch queue if not dry_run
    if (!dry_run) {
      // In production: would create entries in a processing_queue table
      // or trigger background jobs via cron/queue service

      // For now: mark as queued in metadata
      for (const kmz of kmzFiles) {
        await supabase
          .from("kmz_collection")
          .update({
            metadata: {
              ...(kmz.metadata || {}),
              queued_for_discovery: true,
              queued_at: new Date().toISOString(),
              discovery_status: "queued",
            },
          })
          .eq("id", kmz.id)
      }
    }

    const stats = {
      total: kmzFiles.length,
      processed: results.length,
      successful: results.filter((r) => r.status === "pending").length,
      errors: 0,
      average_confidence: 0,
    }

    return NextResponse.json({ results, stats })
  } catch (error) {
    console.error("[v0] Queue batch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
