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

const VALID_SOURCES = [
  "surealista",
  "camposchile",
  "ichiloe",
  "terrachiloe",
  "portalterreno",
  "rura",
  "goplaceit",
  "remax",
  "portal_inmobiliario",
  "icasas",
  "toctoc",
  "yapo",
] as const

type RetrySource = (typeof VALID_SOURCES)[number]

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
  source: RetrySource
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

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
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

function buildRetryTask(source: RetrySource): ScraperTask {
  switch (source) {
    case "surealista":
      return { source, run: () => scrapeSurRealista({ pages: 1, regions: SOUTH_REGIONS }) }
    case "camposchile":
      return { source, run: () => scrapeCamposChile({ pages: 1, regions: SOUTH_REGIONS }) }
    case "ichiloe":
      return { source, run: () => scrapeIChiloe({ pages: 1 }) }
    case "terrachiloe":
      return { source, run: () => scrapeTerraChiloe({ pages: 1 }) }
    case "portalterreno":
      return { source, run: () => scrapePortalTerreno({ pages: 1, regions: SOUTH_REGIONS }) }
    case "rura":
      return { source, run: () => scrapeRura({}) }
    case "goplaceit":
      return { source, run: () => scrapeGoPlaceIt({ pages: 1, perPage: 25, regions: SOUTH_REGIONS }) }
    case "remax":
      return { source, run: () => scrapeRemax({ pages: 1 }) }
    case "portal_inmobiliario":
      return {
        source,
        run: () => scrapePortalInmobiliario({ operation: "venta", regions: GENERAL_REGIONS, maxPerQuery: 24 }),
      }
    case "icasas":
      return { source, run: () => scrapeICasas({ operation: "venta", regions: GENERAL_REGIONS, pages: 1 }) }
    case "toctoc":
      return { source, run: () => scrapeTocToc({ operation: "venta", regions: GENERAL_REGIONS, pages: 1 }) }
    case "yapo":
      return { source, run: () => scrapeYapo({ operation: "venta", regions: GENERAL_REGIONS, pages: 1 }) }
  }
}

async function fetchRetrySources(): Promise<RetrySource[]> {
  const supabase = getAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("scrape_runs")
    .select("source, status, completed_at")
    .in("status", ["failed", "partial"])
    .gte("completed_at", since)
    .order("completed_at", { ascending: false })
    .limit(30)

  if (error) {
    throw new Error(`Failed to read scrape_runs: ${error.message}`)
  }

  const sources = new Set<RetrySource>()
  for (const row of data ?? []) {
    if (VALID_SOURCES.includes(row.source as RetrySource)) {
      sources.add(row.source as RetrySource)
    }
  }

  return Array.from(sources)
}

async function runMaintenance() {
  const supabase = getAdminClient()
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

  try {
    console.log(requestId, "[v0] Retry failed property scrapers cron started")

    const retrySources = await fetchRetrySources()
    if (retrySources.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        message: "No failed or partial scraper runs in the last 24 hours",
        retriedSources: [],
      })
    }

    const sources = await Promise.all(retrySources.map((source) => runTask(buildRetryTask(source))))
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

    console.log(requestId, "[v0] Retry failed property scrapers cron finished", {
      durationMs: Date.now() - startedAt,
      retrySources,
      totals,
      maintenance,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      retriedSources: retrySources,
      totals,
      maintenance,
      sources,
    })
  } catch (error) {
    console.error(requestId, "[v0] Retry failed property scrapers cron failed", error)
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
