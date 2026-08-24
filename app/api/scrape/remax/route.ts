import { NextRequest, NextResponse } from "next/server"
import { validateScraperAccess } from "@/lib/scrapers/route-auth"
import { scrapeRemax } from "@/lib/scrapers/remax-scraper"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const auth = await validateScraperAccess(req)
    if (!auth.authorized) return auth.response

    const body = await req.json().catch(() => ({}))
    const requestedPages = Number(body?.pages ?? 1)
    const pages = Number.isFinite(requestedPages)
      ? Math.min(10, Math.max(1, Math.floor(requestedPages)))
      : 1

    console.log("[v0] POST /api/scrape/remax - Starting scraper for configured south regions", {
      pages,
    })

    const result = await scrapeRemax({ pages })

    console.log("[v0] Remax scraper result:", {
      success: result.success,
      total_found: result.total_found,
      inserted: result.inserted,
      errors: result.errors.length,
      regions: result.regions_scraped,
    })

    return NextResponse.json({
      success: result.success,
      message: `Found ${result.total_found} properties, inserted ${result.inserted}`,
      total_found: result.total_found,
      total_inserted: result.inserted,
      errors: result.errors,
      regions_scraped: result.regions_scraped,
      source: "remax",
    })
  } catch (error) {
    console.error("[v0] Remax scraper error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "RE/MAX scrape failed" },
      { status: 500 },
    )
  }
}
