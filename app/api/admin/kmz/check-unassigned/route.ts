import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Count KMZ files that don't have a region assigned
    const { data: unassigned, error: unassignedError, count: unassignedCount } = await supabase
      .from("kmz_collection")
      .select("id, file_name", { count: "exact" })
      .is("region", null)

    if (unassignedError) {
      console.error("[v0] Error fetching unassigned KMZ:", unassignedError)
      return NextResponse.json({ error: unassignedError.message }, { status: 500 })
    }

    // Count total active KMZ files
    const { data: total, error: totalError, count: totalCount } = await supabase
      .from("kmz_collection")
      .select("id", { count: "exact" })
      .eq("is_active", true)

    if (totalError) {
      console.error("[v0] Error fetching total KMZ:", totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    const unassignedFiles = unassignedCount || 0
    const totalFiles = totalCount || 0
    const percentageUnassigned = totalFiles > 0 ? Math.round((unassignedFiles / totalFiles) * 100) : 0

    console.log(`[v0] KMZ Status: ${unassignedFiles}/${totalFiles} unassigned (${percentageUnassigned}%)`)

    return NextResponse.json({
      success: true,
      unassigned: unassignedFiles,
      total: totalFiles,
      assigned: totalFiles - unassignedFiles,
      percentageUnassigned,
      unassignedFiles: unassigned || [],
    })
  } catch (error: any) {
    console.error("[v0] Error:", error.message)
    return NextResponse.json({ error: "Error checking unassigned KMZ" }, { status: 500 })
  }
}
