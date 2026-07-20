import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseKMZFile } from "@/lib/kmz/kmz-reader"
import { detectRegionFromCoordinateArray } from "@/lib/utils/region-detector"

export const maxDuration = 300

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  return Boolean(secret && request.headers.get("authorization")?.trim() === `Bearer ${secret}`)
}

function adminClient() {
  const url = process