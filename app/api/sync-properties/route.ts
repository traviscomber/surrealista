import { type NextRequest, NextResponse } from "next/server"
import { IChiloeScraper } from "@/lib/data-extraction/ichiloe-scraper"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting property sync API call...")

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const scraper = new IChiloeScraper()
    const result = await scraper.syncProperties()

    console.log("[v0] Sync completed:", result)

    return NextResponse.json({
      success: result.success,
      message: result.success ? `Successfully synced ${result.count} properties from iChiloe` : "Sync failed",
      count: result.count,
      errors: result.errors,
    })
  } catch (error) {
    console.error("[v0] API sync error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const scraper = new IChiloeScraper()

    // Obtener estadísticas de propiedades externas
    const supabase = scraper["supabase"] // Acceso privado para estadísticas

    const { data: stats, error } = await supabase
      .from("properties_external")
      .select("source, created_at, updated_at")
      .eq("source", "ichiloe")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    const { count } = await supabase
      .from("properties_external")
      .select("*", { count: "exact", head: true })
      .eq("source", "ichiloe")

    return NextResponse.json({
      source: "ichiloe",
      totalProperties: count || 0,
      lastSync: stats?.[0]?.created_at || null,
      lastUpdate: stats?.[0]?.updated_at || null,
    })
  } catch (error) {
    console.error("[v0] API stats error:", error)
    return NextResponse.json({ error: "Failed to get sync stats" }, { status: 500 })
  }
}
