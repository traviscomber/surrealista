#!/usr/bin/env node
/**
 * SEA Owner Scraper
 * -----------------
 * Enriches KMZ records with the real "Titular" (legal owner / company) by
 * matching each property against Chile's SEA (Servicio de Evaluación Ambiental)
 * public project database.
 *
 * SEA is one of the few public sources reachable from a datacenter IP that
 * exposes real owner names (empresas / personas) tied to a project, comuna and
 * region. We match KMZ property names + commune against SEA projects.
 *
 * Data source: https://seia.sea.gob.cl/busqueda/buscarProyectoResumenAction.php
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/scrape-owners.mjs [options]
 *
 * Options:
 *   --limit N      Process at most N KMZ records (default: 50)
 *   --offset N     Skip the first N candidates (default: 0)
 *   --dry-run      Do not write to the database, just log what would happen
 *   --force        Re-process records that already have a sea_titular
 *   --delay MS     Delay between SEA queries in ms (default: 1500)
 *   --min-score N  Minimum match score 0-1 to accept (default: 0.55)
 */

import { chromium } from "playwright"

// ----------------------------- Config ------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SEA_ENDPOINT = "https://seia.sea.gob.cl/busqueda/buscarProyectoResumenAction.php"
const SEA_SESSION_URL = "https://seia.sea.gob.cl/busqueda/buscarProyecto.php"

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[scraper] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars")
  process.exit(1)
}

// --------------------------- CLI args -------------------------------------
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  const next = process.argv[i + 1]
  if (!next || next.startsWith("--")) return true // boolean flag
  return next
}
const LIMIT = parseInt(arg("limit", "50"), 10)
const OFFSET = parseInt(arg("offset", "0"), 10)
const DRY_RUN = arg("dry-run", false) === true
const FORCE = arg("force", false) === true
const DELAY = parseInt(arg("delay", "1500"), 10)
const MIN_SCORE = parseFloat(arg("min-score", "0.55"))

// --------------------------- Helpers --------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Normalize a string: lowercase, strip accents, remove noise words/symbols. */
function normalize(str) {
  if (!str) return ""
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STOPWORDS = new Set([
  "fundo", "hacienda", "estancia", "campo", "parcela", "lote", "sitio", "predio",
  "hijuela", "retazo", "resto", "has", "ha", "hectareas", "hectarea", "sector",
  "camino", "ruta", "km", "kmz", "de", "la", "el", "los", "las", "del", "san",
  "santa", "cerro", "rio", "valle", "alto", "bajo", "norte", "sur", "alta",
])

/** Build clean search terms from a KMZ filename. */
function buildSearchTerms(fileName) {
  const clean = normalize(
    fileName
      .replace(/\.(kmz|kml|zip)$/i, "")
      .replace(/\(\d+\)/g, "")
      .replace(/\d+\s*(has?|hectareas?|ha)\b/gi, "")
  )
  const words = clean.split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w))
  // Return the most meaningful token group (up to 3 words) plus the full clean string
  const terms = []
  if (words.length > 0) terms.push(words.slice(0, 3).join(" "))
  if (words.length > 1) terms.push(words[0]) // single strongest token
  // dedupe
  return [...new Set(terms)].filter(Boolean)
}

/** Token overlap similarity between two normalized strings (0-1). */
function similarity(a, b) {
  const ta = new Set(normalize(a).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w)))
  const tb = new Set(normalize(b).split(" ").filter((w) => w.length > 2))
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / ta.size
}

// --------------------------- Supabase REST --------------------------------
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`)
  }
  return res
}

/** Load KMZ candidates that have commune data but no confirmed SEA owner. */
async function loadCandidates() {
  const select = "id,file_name,metadata"
  const res = await sbFetch(`kmz_collection?select=${select}&order=id.asc`)
  const all = await res.json()
  const candidates = all.filter((k) => {
    const m = k.metadata || {}
    const hasCommune =
      m.commune ||
      m?.sii_point_resolution?.record?.comuna ||
      m?.sii_point_resolution?.record?.nombreComuna
    if (!hasCommune) return false
    if (!FORCE && m.sea_titular) return false // already done
    return true
  })
  return candidates.slice(OFFSET, OFFSET + LIMIT)
}

function getCommune(metadata) {
  const m = metadata || {}
  return (
    m.commune ||
    m?.sii_point_resolution?.record?.comuna ||
    m?.sii_point_resolution?.record?.nombreComuna ||
    ""
  )
}

async function updateKmz(id, patchMeta, existingMeta) {
  const merged = { ...(existingMeta || {}), ...patchMeta }
  await sbFetch(`kmz_collection?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ metadata: merged }),
  })
}

// --------------------------- SEA search -----------------------------------
async function searchSEA(context, term) {
  const resp = await context.request.get(
    `${SEA_ENDPOINT}?nombre=${encodeURIComponent(term)}`,
    { timeout: 20000 }
  )
  if (resp.status() !== 200) return []
  // SEA responds in ISO-8859-1 (latin1); decode correctly to preserve ñ/á
  const buf = await resp.body()
  const text = new TextDecoder("latin1").decode(buf)
  try {
    const json = JSON.parse(text)
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

/** Score a SEA project against the KMZ (name similarity + commune match).
 *
 * Commune match is the decisive signal for a *confirmed* owner. A name-only
 * overlap (common in SEA where generic geographic words repeat) is treated as a
 * weak, unconfirmed lead so we don't record false positives like a government
 * "SEREMI" as the private owner of a parcel in a different commune.
 */
function scoreMatch(kmzName, kmzCommune, project) {
  const nameSim = similarity(kmzName, project.EXPEDIENTE_NOMBRE || "")
  const communeMatch = Boolean(
    kmzCommune && normalize(kmzCommune) === normalize(project.COMUNA_NOMBRE || "")
  )
  let score
  if (communeMatch) {
    // Confirmed tier: commune verified, name similarity refines it
    score = 0.6 + nameSim * 0.4 // 0.60 - 1.00
  } else {
    // Weak tier: name only. Cap below the confirmed threshold so it never
    // gets written as a confirmed owner, only as an unconfirmed lead.
    score = nameSim * 0.45 // 0.00 - 0.45
  }
  return { score, nameSim, communeMatch }
}

// ------------------------------- Main -------------------------------------
async function main() {
  console.log("=".repeat(60))
  console.log("SEA OWNER SCRAPER")
  console.log("=".repeat(60))
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"} | limit=${LIMIT} offset=${OFFSET} force=${FORCE}`)
  console.log(`Delay=${DELAY}ms | min-score=${MIN_SCORE}`)
  console.log("")

  console.log("[scraper] Loading candidates from Supabase...")
  const candidates = await loadCandidates()
  console.log(`[scraper] ${candidates.length} candidates to process`)
  if (candidates.length === 0) {
    console.log("[scraper] Nothing to do. Exiting.")
    return
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "es-CL",
  })

  // Establish SEA session (sets cookies needed for the JSON endpoint)
  const page = await context.newPage()
  await page.goto(SEA_SESSION_URL, { waitUntil: "domcontentloaded", timeout: 30000 })
  await page.waitForTimeout(800)

  const stats = { processed: 0, matched: 0, weak: 0, noMatch: 0, errors: 0 }
  const matches = []

  for (const kmz of candidates) {
    stats.processed++
    const commune = getCommune(kmz.metadata)
    const terms = buildSearchTerms(kmz.file_name)
    const label = kmz.file_name.slice(0, 45).padEnd(45)

    if (terms.length === 0) {
      console.log(`[${stats.processed}/${candidates.length}] ${label} SKIP (no terms)`)
      stats.noMatch++
      continue
    }

    try {
      let best = null
      for (const term of terms) {
        const projects = await searchSEA(context, term)
        for (const proj of projects) {
          const { score, nameSim, communeMatch } = scoreMatch(
            kmz.file_name,
            commune,
            proj
          )
          if (!best || score > best.score) {
            best = { score, nameSim, communeMatch, proj }
          }
        }
        await sleep(DELAY)
        if (best && best.score >= 0.85) break // strong enough, stop early
      }

      // Count meaningful tokens in the KMZ name (guards single-word leads)
      const kmzTokenCount = normalize(kmz.file_name)
        .split(" ")
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)).length

      const isConfirmed = best && best.communeMatch && best.score >= MIN_SCORE
      const isWeakLead =
        best && !best.communeMatch && best.nameSim >= 0.99 && kmzTokenCount >= 2

      if (isConfirmed) {
        stats.matched++
        const titular = (best.proj.TITULAR || "").trim()
        console.log(
          `[${stats.processed}/${candidates.length}] ${label} -> ${titular} (score ${best.score.toFixed(2)}, comuna OK)`
        )
        matches.push({ file: kmz.file_name, titular, score: best.score, tier: "confirmed" })
        if (!DRY_RUN) {
          await updateKmz(
            kmz.id,
            {
              sea_titular: titular,
              sea_expediente_nombre: best.proj.EXPEDIENTE_NOMBRE,
              sea_expediente_url: best.proj.EXPEDIENTE_URL_PPAL,
              sea_comuna: best.proj.COMUNA_NOMBRE,
              sea_region: best.proj.REGION_NOMBRE,
              sea_match_score: Number(best.score.toFixed(3)),
              sea_commune_match: true,
              sea_scraped_at: new Date().toISOString(),
              confirmed_owner: titular,
              owner_source: "SEA",
            },
            kmz.metadata
          )
        }
      } else if (isWeakLead) {
        stats.weak++
        const titular = (best.proj.TITULAR || "").trim()
        console.log(
          `[${stats.processed}/${candidates.length}] ${label} ~ ${titular} (weak lead, name only, no comuna)`
        )
        matches.push({ file: kmz.file_name, titular, score: best.score, tier: "weak" })
        if (!DRY_RUN) {
          await updateKmz(
            kmz.id,
            {
              // Unconfirmed lead only - NOT written as confirmed_owner
              sea_lead_titular: titular,
              sea_lead_expediente_url: best.proj.EXPEDIENTE_URL_PPAL,
              sea_lead_comuna: best.proj.COMUNA_NOMBRE,
              sea_lead_name_sim: Number(best.nameSim.toFixed(3)),
              sea_scraped_at: new Date().toISOString(),
              owner_source_attempted: "SEA",
            },
            kmz.metadata
          )
        }
      } else {
        stats.noMatch++
        console.log(
          `[${stats.processed}/${candidates.length}] ${label} -> no match${best ? ` (best ${best.score.toFixed(2)})` : ""}`
        )
        if (!DRY_RUN) {
          await updateKmz(
            kmz.id,
            { sea_scraped_at: new Date().toISOString(), owner_source_attempted: "SEA" },
            kmz.metadata
          )
        }
      }
    } catch (err) {
      stats.errors++
      console.log(`[${stats.processed}/${candidates.length}] ${label} ERROR: ${err.message}`)
    }
  }

  await browser.close()

  console.log("")
  console.log("=".repeat(60))
  console.log("RESULTS")
  console.log("=".repeat(60))
  console.log(`Processed:       ${stats.processed}`)
  console.log(`Confirmed owner: ${stats.matched} (${((stats.matched / stats.processed) * 100).toFixed(1)}%)  [commune verified]`)
  console.log(`Weak leads:      ${stats.weak}  [name-only, unconfirmed]`)
  console.log(`No match:        ${stats.noMatch}`)
  console.log(`Errors:          ${stats.errors}`)
  console.log("")
  const confirmed = matches.filter((m) => m.tier === "confirmed")
  const weak = matches.filter((m) => m.tier === "weak")
  if (confirmed.length > 0) {
    console.log("Confirmed owners (commune verified):")
    for (const m of confirmed.slice(0, 15)) {
      console.log(`  ${m.titular}  [${m.score.toFixed(2)}]  <- ${m.file}`)
    }
  }
  if (weak.length > 0) {
    console.log("\nWeak leads (name only, verify manually):")
    for (const m of weak.slice(0, 10)) {
      console.log(`  ${m.titular}  <- ${m.file}`)
    }
  }
}

main().catch((e) => {
  console.error("[scraper] FATAL:", e)
  process.exit(1)
})
