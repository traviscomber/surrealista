import { NextRequest, NextResponse } from "next/server"
import { scrapeSurRealista } from "@/lib/scrapers/surealista-scraper"

export const maxDuration = 300

const ONE_TIME_TOKEN = "sr-sync-7f9c2e4a-22jul26-51d8"

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await scrapeSurRealista({ dryRun: false })
  return NextResponse.json(result)
}
