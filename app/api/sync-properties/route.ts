import { type NextRequest, NextResponse } from "next/server"
import { IChiloeScraper } from "@/lib/data-extraction/ichiloe-scraper"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"

async function isAuthorized(request: NextRequest) {
  return verifyInternalAccessToken(request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value)
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[property-sync] Starting iChiloe sync")
    const scraper = new IChiloeScraper()
    const result = await scraper.syncProperties()

    return NextResponse.json({
      success: result.success,
      message: result.success ? `Se sincronizaron ${result.count} propiedades desde iChiloe` : "La sincronización falló",
      count: result.count,
      errors: result.errors,
    })
  } catch (error) {
    console.error("[property-sync] Sync error", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno durante la sincronización",
        count: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const scraper = new IChiloeScraper()
    const supabase = scraper["supabase"]

    const { data: stats, error } = await supabase
      .from("properties_external")
      .select("source, created_at, updated_at")
      .eq("source", "ichiloe")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error

    const { count, error: countError } = await supabase
      .from("properties_external")
      .select("id", { count: "exact", head: true })
      .eq("source", "ichiloe")

    if (countError) throw countError

    return NextResponse.json({
      source: "ichiloe",
      totalProperties: count || 0,
      lastSync: stats?.[0]?.created_at || null,
      lastUpdate: stats?.[0]?.updated_at || null,
    })
  } catch (error) {
    console.error("[property-sync] Stats error", error)
    return NextResponse.json({ error: "Failed to get sync stats" }, { status: 500 })
  }
}
