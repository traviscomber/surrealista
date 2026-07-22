import { NextRequest, NextResponse } from "next/server"
import { scrapeSurRealista } from "@/lib/scrapers/surealista-scraper"

export const maxDuration = 300

const TOKEN = "sr-once-20260722-66079380"

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await scrapeSurRealista({ dryRun: false })
  return NextResponse.json(result)
}
