import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get unique regions
    const { data: regionData } = await supabase
      .from("kmz_location_index")
      .select("region")
      .eq("is_active", true)
      .not("region", "is", null)

    const regions = [...new Set(regionData?.map((r: any) => r.region).filter(Boolean))]

    // Get unique categories
    const { data: categoryData } = await supabase
      .from("kmz_collection")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null)

    const categories = [...new Set(categoryData?.map((c: any) => c.category).filter(Boolean))]

    return NextResponse.json({
      regions: regions.sort(),
      categories: categories.sort(),
    })
  } catch (error: any) {
    console.error("[v0] Error fetching filters:", error)
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    )
  }
}
