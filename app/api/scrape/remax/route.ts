import { NextRequest, NextResponse } from "next/server"
import { validateScraperAccess } from "@/lib/scrapers/route-auth"
import { scrapeRemax } from "@/lib/scrapers/remax-scraper"

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const auth = await validateScraperAccess(req)
    if (!auth.authorized) return auth.response

    const body = await req.json()
    const { pages = 1, searchUrl } = body

    console.log("[v0] POST /api/scrape/remax - Starting scraper for all south regions", {
      pages,
    })

    const result = await scrapeRemax({
      pages,
      searchUrl,
      // Defaults to all south regions
    })

    console.log("[v0] Remax scraper result:", {
      success: result.success,
      total: result.total,
      inserted: result.inserted,
      errors: result.errors.length,
    })

    return NextResponse.json({
      success: result.success,
      message: `Found ${result.total} properties, inserted ${result.inserted}`,
      total_found: result.total,
      total_inserted: result.inserted,
      errors: result.errors,
      source: "remax",
    })
  } catch (err) {
    console.error("[v0] Remax scraper error:", err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
