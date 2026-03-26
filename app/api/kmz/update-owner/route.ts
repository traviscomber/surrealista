import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PATCH(request: NextRequest) {
  try {
    const { kmzId, owner } = await request.json()

    if (!kmzId) {
      return NextResponse.json({ error: "KMZ ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("kmz_collection")
      .update({ owner: owner || null })
      .eq("id", kmzId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating KMZ owner:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated KMZ owner:", kmzId, owner)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[v0] Error in PATCH /api/kmz/update-owner:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
