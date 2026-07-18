#!/usr/bin/env node
/**
 * Scraper coordinator CLI
 *
 * Usage:
 *   node scripts/run-scrapers.mjs                          # all sources, venta
 *   node scripts/run-scrapers.mjs --source=yapo            # single source
 *   node scripts/run-scrapers.mjs --operation=arriendo     # rental listings
 *   node scripts/run-scrapers.mjs --region="Región Metropolitana"
 *   node scripts/run-scrapers.mjs --pages=3                # pages per region
 *   node scripts/run-scrapers.mjs --aggregate              # also recompute comparables
 *
 * Requires environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { argv, env } from 'process'

// ─── Parse CLI args ────────────────────────────────────────────────────────────
function getArg(name) {
  const flag = argv.find((a) => a.startsWith(`--${name}=`))
  return flag ? flag.split('=').slice(1).join('=') : null
}
function hasFlag(name) {
  return argv.includes(`--${name}`)
}

const SOURCE_ARG = getArg('source') // portal_inmobiliario|yapo|toctoc|icasas|all
const OPERATION = getArg('operation') || 'venta'
const REGION_ARG = getArg('region')
const PAGES = parseInt(getArg('pages') || '2', 10)
const DO_AGGREGATE = hasFlag('aggregate')

const ALL_REGIONS = [
  // Sur Chile — máxima prioridad para este proyecto
  'Región de Los Lagos',
  'Región de Los Ríos',
  'Región de La Araucanía',
  'Región de Aysén',
  'Región de Magallanes',
  // Centro-norte como complemento
  'Región Metropolitana',
  'Región de Valparaíso',
  'Región del Biobío',
]
const REGIONS = REGION_ARG ? [REGION_ARG] : ALL_REGIONS

// Sources focalizadas en el sur de Chile
const SOUTH_ONLY_SOURCES = ['ichiloe', 'surealista', 'camposchile', 'terrachiloe', 'portalterreno']
const GENERAL_SOURCES = ['portal_inmobiliario', 'yapo', 'toctoc', 'icasas']
const ALL_SOURCES = [...SOUTH_ONLY_SOURCES, ...GENERAL_SOURCES]

// ─── Dynamic imports (ESM scrapers transpiled on-the-fly via tsx is not needed:
//     we call the Next.js API routes directly via HTTP instead, which avoids
//     the need to bundle TypeScript in a plain .mjs file)
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[coordinator] ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ─── HTTP scraper runner (calls the Next.js API route) ────────────────────────
async function callScrapeAPI(source, options = {}) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/api/scrape/${source}`

  console.log(`[coordinator] Starting ${source}...`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': SERVICE_KEY,
    },
    body: JSON.stringify({ operation: OPERATION, regions: REGIONS, pages: PAGES, ...options }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${source} API returned ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ─── Aggregate comparables ────────────────────────────────────────────────────
async function recomputeComparables() {
  console.log('[coordinator] Recomputing market comparables...')
  const { data, error } = await supabase.rpc('recompute_market_comparables', {
    p_operation: OPERATION,
  })
  if (error) {
    console.error('[coordinator] Aggregation error:', error.message)
  } else {
    console.log(`[coordinator] Updated ${data} market comparable rows`)
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────
async function deduplicateProperties() {
  console.log('[coordinator] Running deduplication (same hash, keep latest)...')
  const { error } = await supabase.rpc('deduplicate_properties_external')
  if (error && !error.message.includes('does not exist')) {
    console.error('[coordinator] Dedup error:', error.message)
  }
}

// ─── Print summary ────────────────────────────────────────────────────────────
function printSummary(results) {
  console.log('\n═══════════════════════════════════════════')
  console.log('           SCRAPE RUN SUMMARY              ')
  console.log('═══════════════════════════════════════════')
  let totalFound = 0, totalInserted = 0, totalErrors = 0
  for (const r of results) {
    const status = r.errors?.length > 0 ? 'PARTIAL' : 'OK'
    console.log(`  ${r.source.padEnd(25)} ${status} | found=${r.found ?? 0} inserted=${r.inserted ?? 0} errors=${r.errors?.length ?? 0}`)
    totalFound += r.found ?? 0
    totalInserted += r.inserted ?? 0
    totalErrors += r.errors?.length ?? 0
  }
  console.log('───────────────────────────────────────────')
  console.log(`  TOTAL: found=${totalFound} inserted=${totalInserted} errors=${totalErrors}`)
  console.log('═══════════════════════════════════════════\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[coordinator] run-scrapers | operation=${OPERATION} regions=${REGIONS.length} pages=${PAGES}`)

  const SOURCES = SOURCE_ARG && SOURCE_ARG !== 'all'
    ? SOURCE_ARG === 'south' ? SOUTH_ONLY_SOURCES
    : SOURCE_ARG === 'general' ? GENERAL_SOURCES
    : [SOURCE_ARG]
    : ALL_SOURCES

  const results = []

  for (const source of SOURCES) {
    try {
      const result = await callScrapeAPI(source)
      results.push(result)
      console.log(`[coordinator] ${source} done: found=${result.found} inserted=${result.inserted}`)
    } catch (err) {
      console.error(`[coordinator] ${source} failed: ${err.message}`)
      results.push({ source, found: 0, inserted: 0, errors: [err.message] })
    }
    // Polite delay between sources
    await new Promise((r) => setTimeout(r, 1500))
  }

  await deduplicateProperties()

  if (DO_AGGREGATE) {
    await recomputeComparables()
  }

  printSummary(results)

  const { data: count } = await supabase
    .from('properties_external')
    .select('*', { count: 'exact', head: true })
  console.log(`[coordinator] Total active properties in DB: ${count ?? 'unknown'}`)
}

main().catch((err) => {
  console.error('[coordinator] Fatal:', err)
  process.exit(1)
})
