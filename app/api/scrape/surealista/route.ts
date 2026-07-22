import { NextRequest, NextResponse } from "next/server"
import { validateScraperAccess } from "@/lib/scrapers/route-auth"
import { scrapeSurRealista } from "@/lib/scrapers/surealista-scraper"

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const auth = await validateScraperAccess(request)
    if (!auth.authorized) return auth.response

    const body = await request.json().catch(() => ({}))
    const pages = Math.min(Math.max(Number(body.pages) || 1, 1), 3)
    const dryRun = body.dryRun === true
    const regions = Array.isArray(body.regions) ? body.regions : undefined

    const result = await scrapeSurRealista({ pages, regions, dryRun })

    return NextResponse.json({
      success: result.errors.length === 0 || result.found > 0,
      message: dryRun
        ? `Dry run detected ${result.found} Sur Realista properties`
        : `Detected ${result.found} properties; inserted ${result.inserted}, updated ${result.updated}`,
      ...result,
    })
  } catch (error) {
    console.error("[Sur Realista scraper]", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown scraper error" },
      { status: 500 },
    )
  }
}
