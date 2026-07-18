import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get first KMZ
    const { data: firstKmz, error: fetchError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, metadata")
      .limit(1)
      .single()

    if (fetchError || !firstKmz) {
      return NextResponse.json({ error: "No KMZ found" }, { status: 400 })
    }

    console.log("[v0] Test: KMZ before update:", firstKmz.metadata?.test_field)

    // Try to update with test field
    const testData = {
      ...firstKmz.metadata,
      test_field: `TEST_${Date.now()}`,
      test_updated_at: new Date().toISOString(),
    }

    const { error: updateError, data: updateData } = await supabase
      .from("kmz_collection")
      .update({ metadata: testData })
      .eq("id", firstKmz.id)
      .select()

    console.log("[v0] Update response:", { updateError, dataReturned: !!updateData })

    // Immediately read back
    const { data: afterUpdate, error: readError } = await supabase
      .from("kmz_collection")
      .select("id, metadata")
      .eq("id", firstKmz.id)
      .single()

    console.log("[v0] After update read:", afterUpdate?.metadata?.test_field)

    return NextResponse.json({
      test_kmz_id: firstKmz.id,
      before_update: firstKmz.metadata?.test_field,
      update_request: testData.test_field,
      update_error: updateError?.message,
      after_update: afterUpdate?.metadata?.test_field,
      read_error: readError?.message,
      success: afterUpdate?.metadata?.test_field === testData.test_field,
    })
  } catch (error) {
    console.error("[v0] Test persistence error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
