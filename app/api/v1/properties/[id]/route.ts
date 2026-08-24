import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase.from("properties").select("*, images(*)").eq("id", id).single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { property: data } })
  } catch (error) {
    console.error("[api/v1/properties/:id] failed", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
