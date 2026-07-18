import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

export type PipelineStatus = "pending" | "processing" | "completed" | "error"
export type QueueStatus = "pending" | "evidence-found" | "confirmed" | "skipped"

interface PipelineStats {
  totalKmz: number
  processingStatus: Record<QueueStatus, number>
  averageConfidence: number
  withEvidence: number
  confirmed: number
  skipped: number
  lastUpdated: string
}

/**
 * GET /api/kmz/owner-discovery/status
 * 
 * Returns pipeline statistics and current status
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Fetch all KMZ with metadata
    const { data: kmzRecords, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata")
      .limit(1000)

    if (error) {
      console.error("[v0] Error fetching KMZ records:", error)
      return NextResponse.json(
        { error: "Failed to fetch pipeline status" },
        { status: 500 }
      )
    }

    // Analyze metadata
    const stats: PipelineStats = {
      totalKmz: kmzRecords?.length || 0,
      processingStatus: {
        pending: 0,
        "evidence-found": 0,
        confirmed: 0,
        skipped: 0,
      },
      averageConfidence: 0,
      withEvidence: 0,
      confirmed: 0,
      skipped: 0,
      lastUpdated: new Date().toISOString(),
    }

    let totalConfidence = 0
    let confidenceCount = 0

    for (const kmz of kmzRecords || []) {
      const metadata = kmz.metadata || {}
      const queue = metadata.owner_research_queue || {}
      const status = (queue.status || "pending") as QueueStatus

      // Count by status
      stats.processingStatus[status]++

      // Track counts
      if (status === "confirmed") stats.confirmed++
      if (status === "skipped") stats.skipped++
      if (status === "evidence-found") stats.withEvidence++

      // Calculate average confidence
      if (metadata.owner_confidence !== undefined) {
        totalConfidence += metadata.owner_confidence
        confidenceCount++
      }
    }

    if (confidenceCount > 0) {
      stats.averageConfidence = totalConfidence / confidenceCount
    }

    return NextResponse.json({
      success: true,
      stats,
      pipelineHealth: {
        status: stats.averageConfidence > 0.7 ? "healthy" : "running",
        processingRate: `${((stats.withEvidence + stats.confirmed) / stats.totalKmz * 100).toFixed(1)}%`,
        confirmationRate: `${((stats.confirmed) / stats.totalKmz * 100).toFixed(1)}%`,
      },
    })
  } catch (error: any) {
    console.error("[v0] Pipeline status error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
