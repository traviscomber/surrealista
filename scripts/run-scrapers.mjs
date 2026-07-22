#!/usr/bin/env node
/**
 * Scraper coordinator CLI
 *
 * Usage:
 *   node scripts/run-scrapers.mjs
 *   node scripts/run-scrapers.mjs --source=yapo
 *   node scripts/run-scrapers.mjs --source=south
 *   node scripts/run-scrapers.mjs --operation=arriendo
 *   node scripts/run-scrapers.mjs --region="Región Metropolitana"
 *   node scripts/run-scrapers.mjs --pages=3
 *   node scripts/run-scrapers.mjs --aggregate
 */
import { createClient } from '@supabase/supabase-js'
import { argv, env } from 'process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

function getArg(name) {
  const flag = argv.find((arg) => arg.startsWith(`--${name}=`))
  return flag ? flag.split('=').slice(1).join('=') : null
}

function hasFlag(name) {
  return argv.includes(`--${name}`)
}

const SOURCE_ARG = getArg('source')
const OPERATION = getArg('operation') || 'venta'
const REGION_ARG = getArg('region')
const PAGES = Number.parseInt(getArg('pages') || '2', 10)
const DO_AGGREGATE = hasFlag('aggregate')

const ALL_REGIONS = [
  'Región de Los Lagos',
  'Región de Los Ríos',
  'Región de La Araucanía',
  'Región de Aysén',
  'Región de Magallanes',
  'Región Metropolitana',
  'Región de Valparaíso',
  'Región del Biobío',
]

const REGIONS = REGION_ARG ? [REGION_ARG] : ALL_REGIONS
const here = dirname(fileURLToPath(import.meta.url))
const registryPath = resolve(here, '../config/scrapers.json')
const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
const enabledSources = registry.sources.filter((source) => source.enabled)
const SOUTH_ONLY_SOURCES = enabledSources.filter((source) => source.group === 'south').map((source) => source.key)
const GENERAL_SOURCES = enabledSources.filter((source) => source.group === 'general').map((source) => source.key)
const ALL_SOURCES = enabledSources.map((source) => source.key)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[coordinator] ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!Number.isFinite(PAGES) || PAGES < 1 || PAGES > 20) {
  console.error('[coordinator] ERROR: --pages must be between 1 and 20')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function resolveSources() {
  if (!SOURCE_ARG || SOURCE_ARG === 'all') return ALL_SOURCES
  if (SOURCE_ARG === 'south') return SOUTH_ONLY_SOURCES
  if (SOURCE_ARG === 'general') return GENERAL_SOURCES

  const source = registry.sources.find((item) => item.key === SOURCE_ARG)
  if (!source) throw new Error(`Unknown scraper source: ${SOURCE_ARG}`)
  if (!source.enabled) throw new Error(`${source.label} is disabled: ${source.disabledReason || 'not operational'}`)
  return [source.key]
}

async function callScrapeAPI(source, options = {}) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/api/scrape/${source}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 240_000)

  console.log(`[coordinator] Starting ${source}...`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': SERVICE_KEY,
      },
      body: JSON.stringify({ operation: OPERATION, regions: REGIONS, pages: PAGES, ...options }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`${source} API returned ${response.status}: ${text.slice(0, 300)}`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function recomputeComparables() {
  console.log('[coordinator] Recomputing market comparables...')
  const { data, error } = await supabase.rpc('recompute_market_comparables', {
    p_operation: OPERATION,
  })

  if (error) console.error('[coordinator] Aggregation error:', error.message)
  else console.log(`[coordinator] Updated ${data} market comparable rows`)
}

async function deduplicateProperties() {
  console.log('[coordinator] Running deduplication...')
  const { error } = await supabase.rpc('deduplicate_properties_external')
  if (error && !error.message.includes('does not exist')) {
    console.error('[coordinator] Dedup error:', error.message)
  }
}

function printSummary(results) {
  console.log('\n═══════════════════════════════════════════')
  console.log('           SCRAPE RUN SUMMARY              ')
  console.log('═══════════════════════════════════════════')

  let totalFound = 0
  let totalInserted = 0
  let totalErrors = 0

  for (const result of results) {
    const errors = result.errors?.length ?? 0
    const status = errors > 0 ? 'PARTIAL' : 'OK'
    console.log(`  ${result.source.padEnd(25)} ${status} | found=${result.found ?? 0} inserted=${result.inserted ?? 0} errors=${errors}`)
    totalFound += result.found ?? 0
    totalInserted += result.inserted ?? 0
    totalErrors += errors
  }

  console.log('───────────────────────────────────────────')
  console.log(`  TOTAL: found=${totalFound} inserted=${totalInserted} errors=${totalErrors}`)
  console.log('═══════════════════════════════════════════\n')
}

async function main() {
  const sources = resolveSources()
  console.log(`[coordinator] operation=${OPERATION} regions=${REGIONS.length} pages=${PAGES} sources=${sources.length}`)

  const results = []
  for (const source of sources) {
    try {
      const result = await callScrapeAPI(source)
      results.push({ source, ...result })
      console.log(`[coordinator] ${source} done: found=${result.found ?? 0} inserted=${result.inserted ?? 0}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[coordinator] ${source} failed: ${message}`)
      results.push({ source, found: 0, inserted: 0, errors: [message] })
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500))
  }

  await deduplicateProperties()
  if (DO_AGGREGATE) await recomputeComparables()
  printSummary(results)

  const { count } = await supabase
    .from('properties_external')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  console.log(`[coordinator] Total active properties in DB: ${count ?? 'unknown'}`)
}

main().catch((error) => {
  console.error('[coordinator] Fatal:', error)
  process.exit(1)
})
