#!/usr/bin/env node
/**
 * Standalone Owner Scraper
 *
 * Enriches KMZ properties with real owner leads by:
 *  1. Reading resolved SII data (ROL, direccion, comuna) already in metadata
 *  2. Running real web searches (Bing) with Playwright/Chromium
 *  3. Extracting owner candidates with OpenAI GPT-4o-mini (anti-hallucination)
 *  4. Writing leads back to metadata.owner_research_leads via Supabase REST
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/scrape-owners.mjs [--limit N] [--offset N] [--dry-run] [--force]
 *
 * Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { chromium } from "playwright"

// ---------- Config ----------
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[scraper] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error("[scraper] Missing OPENAI_API_KEY")
  process.exit(1)
}

// ---------- CLI args ----------
const args = process.argv.slice(2)
function argValue(name, fallback) {
  const idx = args.indexOf(name)
  if (idx !== -1 && args[idx + 1]) return args[idx + 1]
  return fallback
}
const LIMIT = parseInt(argValue("--limit", "25"), 10)
const OFFSET = parseInt(argValue("--offset", "0"), 10)
const DRY_RUN = args.includes("--dry-run")
const FORCE = args.includes("--force")
const SEARCH_DELAY_MS = parseInt(argValue("--delay", "3500"), 10)

// ---------- Helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function restHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  }
}

async function fetchCandidates() {
  // Pull rows that have SII resolution but no confirmed owner leads yet
  const select = "id,file_name,metadata"
  const url = `${SUPABASE_URL}/rest/v1/kmz_collection?select=${select}&metadata->sii_point_resolution=not.is.null&order=id.asc&limit=${LIMIT}&offset=${OFFSET}`
  const res = await fetch(url, { headers: restHeaders() })
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
  }
  const rows = await res.json()
  if (FORCE) return rows
  // Skip rows already scraped (unless --force)
  return rows.filter((r) => {
    const status = r.metadata?.owner_search_status
    return status !== "done" && status !== "no_results"
  })
}

async function updateMetadata(id, metadata) {
  if (DRY_RUN) return true
  const url = `${SUPABASE_URL}/rest/v1/kmz_collection?id=eq.${id}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: { ...restHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ metadata }),
  })
  if (!res.ok) {
    console.error(`[scraper] Update failed for ${id}: ${res.status} ${await res.text()}`)
    return false
  }
  return true
}

function buildQueries(row) {
  const sii = row.metadata?.sii_point_resolution?.record || {}
  const rol = sii.rol || ""
  const comuna = sii.comuna || sii.nombreComuna || row.metadata?.commune || ""
  const direccion = (sii.direccion || "").trim()
  const cleanName = (row.file_name || "")
    .replace(/\.(kmz|zip)$/i, "")
    .replace(/\(\d+\)/g, "")
    .replace(/puntos?\s+aterrizaje|aerodromo|aeródromo/gi, "")
    .trim()

  const queries = []
  if (cleanName && comuna) queries.push(`"${cleanName}" ${comuna} propietario dueño`)
  if (direccion && comuna) queries.push(`"${direccion}" ${comuna} rol propietario`)
  if (rol && comuna) queries.push(`rol ${rol} ${comuna} propietario predio`)
  if (cleanName) queries.push(`"${cleanName}" predio agrícola dueño sociedad`)
  return { queries: queries.slice(0, 3), rol, comuna, direccion, cleanName }
}

async function searchBing(page, query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=es&cc=cl`
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 })
    await page.waitForTimeout(1200)
    const results = await page.evaluate(() => {
      const items = []
      const nodes = document.querySelectorAll("li.b_algo")
      nodes.forEach((n) => {
        const titleEl = n.querySelector("h2")
        const linkEl = n.querySelector("h2 a")
        const snippetEl = n.querySelector(".b_caption p, .b_algoSlug, p")
        items.push({
          title: titleEl?.textContent?.trim() || "",
          url: linkEl?.getAttribute("href") || "",
          snippet: snippetEl?.textContent?.trim() || "",
        })
      })
      return items.slice(0, 6)
    })
    return results
  } catch (err) {
    console.error(`[scraper]   Bing search error: ${err.message}`)
    return []
  }
}

const SYSTEM_PROMPT = `You are an expert property owner researcher for Chilean agricultural land.
Analyze the web search results and extract owner information (person or company).

CRITICAL RULES:
1. ONLY extract owner info explicitly present in the search results text.
2. NEVER invent, hallucinate, or assume names. If unclear, return null.
3. Company names often end with: SPA, S.A., LTDA, LIMITADA, EIRL, INMOBILIARIA, AGRICOLA, FORESTAL.
4. Person names have 2-4 parts.

CONFIDENCE:
- 0.9+: official registry/government source explicitly naming owner
- 0.7+: authoritative source (SEA, municipal, news) names owner tied to the property
- 0.5+: plausible match in a document
- <0.5: uncertain -> null

Respond ONLY with valid JSON (no markdown):
{"possibleOwner": string|null, "possibleCompany": string|null, "confidence": number, "reason": string, "evidence": string}`

async function analyzeWithAI(searchText, context) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Property context: ${context}\n\nSearch results:\n${searchText}\n\nExtract ONLY explicitly stated owner info. Respond with JSON only.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    })
    if (!res.ok) {
      console.error(`[scraper]   OpenAI error: ${res.status}`)
      return null
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ""
    const jsonText = content.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(jsonText)
    return {
      possibleOwner: parsed.possibleOwner || null,
      possibleCompany: parsed.possibleCompany || null,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
      reason: parsed.reason || "",
      evidence: parsed.evidence || "",
    }
  } catch (err) {
    console.error(`[scraper]   AI analyze error: ${err.message}`)
    return null
  }
}

// ---------- Main ----------
async function main() {
  console.log("========================================")
  console.log("  OWNER SCRAPER (SII + Web/IA)")
  console.log("========================================")
  console.log(`Limit: ${LIMIT} | Offset: ${OFFSET} | DryRun: ${DRY_RUN} | Force: ${FORCE}`)

  const candidates = await fetchCandidates()
  console.log(`Candidates to process: ${candidates.length}\n`)
  if (candidates.length === 0) {
    console.log("Nothing to do.")
    return
  }

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] })
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "es-CL",
  })
  const page = await context.newPage()

  let processed = 0
  let withLeads = 0
  let noResults = 0

  for (const row of candidates) {
    processed++
    const { queries, rol, comuna, direccion, cleanName } = buildQueries(row)
    const ctxLabel = `${cleanName || row.file_name} | ROL ${rol || "?"} | ${comuna || "?"}`
    console.log(`[${processed}/${candidates.length}] ${ctxLabel}`)

    // Collect search results across queries
    const allResults = []
    for (const q of queries) {
      const r = await searchBing(page, q)
      allResults.push(...r)
      await sleep(SEARCH_DELAY_MS)
    }

    // Dedup by url
    const seen = new Set()
    const deduped = allResults.filter((r) => {
      if (!r.url || seen.has(r.url)) return false
      seen.add(r.url)
      return true
    })

    const metadata = { ...row.metadata }
    metadata.owner_search_at = new Date().toISOString()

    if (deduped.length === 0) {
      metadata.owner_search_status = "no_results"
      noResults++
      await updateMetadata(row.id, metadata)
      console.log("   -> no search results")
      continue
    }

    const searchText = deduped
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`)
      .join("\n")
    const propContext = `Predio: ${cleanName}. Dirección: ${direccion}. Comuna: ${comuna}. ROL: ${rol}.`

    const analysis = await analyzeWithAI(searchText, propContext)

    if (analysis && (analysis.possibleOwner || analysis.possibleCompany) && analysis.confidence >= 0.5) {
      const name = analysis.possibleCompany || analysis.possibleOwner
      const lead = {
        name,
        type: analysis.possibleCompany ? "company" : "person",
        confidence: analysis.confidence,
        reason: analysis.reason,
        evidence: analysis.evidence,
        source: "web-ia-bing",
        dateFound: new Date().toISOString(),
      }
      const existing = Array.isArray(metadata.owner_research_leads) ? metadata.owner_research_leads : []
      // Avoid duplicate names
      const merged = [lead, ...existing.filter((l) => l.name?.toLowerCase() !== name.toLowerCase())]
      metadata.owner_research_leads = merged
      metadata.confirmed_owner = name
      metadata.owner_search_status = "done"
      withLeads++
      await updateMetadata(row.id, metadata)
      console.log(`   -> LEAD: ${name} (${(analysis.confidence * 100).toFixed(0)}%) [${lead.type}]`)
    } else {
      metadata.owner_search_status = "no_owner_found"
      metadata.owner_search_snippets = deduped.slice(0, 5)
      await updateMetadata(row.id, metadata)
      console.log("   -> results found but no clear owner")
    }
  }

  await browser.close()

  console.log("\n========================================")
  console.log("  DONE")
  console.log("========================================")
  console.log(`Processed:   ${processed}`)
  console.log(`With leads:  ${withLeads}`)
  console.log(`No results:  ${noResults}`)
}

main().catch((err) => {
  console.error("[scraper] Fatal:", err)
  process.exit(1)
})
