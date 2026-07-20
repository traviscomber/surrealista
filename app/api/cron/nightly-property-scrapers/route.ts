import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { scrapeCamposChile } from "@/lib/scrapers/camposchile-scraper"
import { scrapeGoPlaceIt } from "@/lib/scrapers/goplaceit-scraper"
import { scrapeIChiloe } from "@/lib/scrapers/ichiloe-scraper"
import { scrapeICasas } from "@/lib/scrapers/icasas-scraper"
import { scrapePortalInmobiliario } from "@/lib/scrapers/portal-inmobiliario-scraper"
import { scrapeRemax } from "@/lib/scrapers/remax-scraper"
import { scrapeRura } from "@/lib/scrapers/rura-scraper"
import { scrapeSurRealista } from "@/lib/scrapers/surealista-scraper"
import { scrapeTerraChiloe, scrapePortalTerreno } from "@/lib/scrapers/terrachiloe-portalterreno-scraper"
import { scrapeTocToc } from "@/lib/scrapers/toctoc-scraper"
import { scrapeYapo } from "@/lib/scrapers/yapo-scraper"

export const maxDuration = 300

const SOUTH_REGIONS = [
  "Región del Biobío",
  "Región de La Araucanía",
  "Región de Los Lagos",
  "Región de Los Ríos",
  "Región de Aysén",
  "Región de Magallanes",
]

const GENERAL_REGIONS = [
  "Región Metropolitana",
  "Región de Valparaíso",
  "Región del Biobío",
  "Región de La Araucanía",
  "Región de Los Lagos",
]

type NormalizedResult = {
  source: string
  found: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  durationMs: number
}

type ScraperTask = {
  source: string
  run: () => Promise<any>
}

function isAuthorizedCronCall(request: NextRequest) {
  const authHeader = request.headers.get("authorization")?.trim()
  const expectedSecret = (
    process.env.CRON_SECRET?.trim() ||
    process.env.APP_PASSWORD?.trim() ||
    process.env.NEXT_PUBLIC_APP_PASSWORD?.trim()
  )

  if (!authHeader?.startsWith("Bearer ")) return false
  if (!expectedSecret) return true

  return authHeader === `Bearer ${expectedSecret}`
}

function normalizeScraperResult(source: string, result: any, durationMs: number): NormalizedResult {
  return {
    source,
    found: Number(result?.found ?? result?.total_found ?? 0),
    inserted: Number(result?.inserted ?? 0),
    updated: Number(result?.updated ?? 0),
    skipped: Number(result?.skipped ?? 0),
    errors: Array.isArray(result?.errors) ? result.errors.map(String) : [],
    durationMs,
  }
}

async function runTask(task: ScraperTask) {
  const start = Date.now()
  try {
    const result = await task.run()
    return normalizeScraperResult(task.source, result, Date.now() - start)
  } catch (error) {
    return normalizeScraperResult(
      task.source,
      { errors: [(error as Error).message] },
      Date.now() - start
    )
  }
}

async function runTaskBatch(tasks: ScraperTask[]) {
  return Promise.all(tasks.map((task) => runTask(task)))
}

async function runMaintenance() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      deduplication: "skipped: missing SUPABASE config",
      aggregation: "skipped: missing SUPABASE config",
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const maintenance = {
    deduplication: "ok",
    aggregation: "ok",
  }

  const { error: dedupError } = await supabase.rpc("deduplicate_properties_external")
  if (dedupError && !dedupError.message.includes("does not exist")) {
    maintenance.deduplication = dedupError.message
  }

  const { error: aggregateError } = await supabase.rpc("recompute_market_comparables", {
    p_operation: "venta",
  })
  if (aggregateError && !aggregateError.message.includes("does not exist")) {
    maintenance.aggregation = aggregateError.message
  }

  return maintenance
}

export async function GET(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`
  const startedAt = Date.now()

  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const southBatch: ScraperTask[] = [
    { source: "surealista", run: () => scrapeSurRealista({ pages: 3, regions: SOUTH_REGIONS }) },
    { source: "camposchile", run: () => scrapeCamposChile({ pages: 2, regions: SOUTH_REGIONS }) },
    { source: "ichiloe", run: () => scrapeIChiloe({ pages: 3 }) },
    { source: "terrachiloe", run: () => scrapeTerraChiloe({ pages: 3 }) },
    { source: "portalterreno", run: () => scrapePortalTerreno({ pages: 3, regions: SOUTH_REGIONS }) },
    { source: "rura", run: () => scrapeRura({}) },
    { source: "goplaceit", run: () => scrapeGoPlaceIt({ pages: 2, perPage: 25, regions: SOUTH_REGIONS }) },
    { source: "remax", run: () => scrapeRemax({ pages: 1 }) },
  ]

  const generalBatch: ScraperTask[] = [
    {
      source: "portal_inmobiliario",
      run: () => scrapePortalInmobiliario({ operation: "venta", regions: GENERAL_REGIONS, maxPerQuery: 48 }),
    },
    { source: "icasas", run: () => scrapeICasas({ operation: "venta", regions: GENERAL_REGIONS, pages: 2 }) },
    { source: "toctoc", run: () => scrapeTocToc({ operation: "venta", regions: GENERAL_REGIONS, pages: 2 }) },
    { source: "yapo", run: () => scrapeYapo({ operation: "venta", regions: GENERAL_REGIONS, pages: 2 }) },
  ]

  try {
    console.log(requestId, "[v0] Nightly property scraper cron started")

    const southResults = await runTaskBatch(southBatch)
    const generalResults = await runTaskBatch(generalBatch)
    const sources = [...southResults, ...generalResults].sort((a, b) => b.inserted - a.inserted)

    const maintenance = await runMaintenance()

    const totals = sources.reduce(
      (acc, item) => {
        acc.found += item.found
        acc.inserted += item.inserted
        acc.updated += item.updated
        acc.skipped += item.skipped
        acc.errors += item.errors.length
        return acc
      },
      { found: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 }
    )

    console.log(requestId, "[v0] Nightly property scraper cron finished", {
      durationMs: Date.now() - startedAt,
      totals,
      maintenance,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      totals,
      maintenance,
      sources,
    })
  } catch (error) {
    console.error(requestId, "[v0] Nightly property scraper cron failed", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }
}
