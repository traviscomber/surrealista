#!/usr/bin/env node
/**
 * Web + AI Owner Scraper
 * ----------------------
 * Enriches KMZ records with the real owner (person or company) by running a
 * real Google web search (via Serper.dev) for each property and using an LLM
 * (GPT-4o-mini) to extract the owner name from the actual search results.
 *
 * Why this approach:
 *   - SII gives property data (address, avaluo, commune) but hides the owner.
 *   - CBR (the legal owner registry) requires login + payment + captcha.
 *   - General search engines block this datacenter IP directly, but Serper.dev
 *     provides Google results through a proper API with no IP blocking.
 *
 * The LLM is instructed to ONLY return an owner when the search snippets
 * clearly support it, and to return null otherwise. This avoids inventing data.
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/scrape-owners.mjs [options]
 *
 * Options:
 *   --limit N       Process at most N KMZ records (default: 50)
 *   --offset N      Skip the first N candidates (default: 0)
 *   --dry-run       Do not write to the database, just log what would happen
 *   --force         Re-process records already attempted
 *   --delay MS      Delay between properties in ms (default: 400)
 *   --min-conf N    Minimum AI confidence 0-1 to store confirmed owner (default: 0.7)
 */

// ----------------------------- Config ------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SERPER_KEY = process.env.SERPER_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const SERPER_ENDPOINT = "https://google.serper.dev/search"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[scraper] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
if (!SERPER_KEY) {
  console.error("[scraper] Missing SERPER_API_KEY")
  process.exit(1)
}
if (!OPENAI_KEY) {
  console.error("[scraper] Missing OPENAI_API_KEY")
  process.exit(1)
}

// --------------------------- CLI args -------------------------------------
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  const next = process.argv[i + 1]
  if (!next || next.startsWith("--")) return true
  return next
}
const LIMIT = parseInt(arg("limit", "50"), 10)
const OFFSET = parseInt(arg("offset", "0"), 10)
const DRY_RUN = arg("dry-run", false) === true
const FORCE = arg("force", false) === true
const DELAY = parseInt(arg("delay", "400"), 10)
const MIN_CONF = parseFloat(arg("min-conf", "0.7"))

// --------------------------- Helpers --------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const MAX_QUERY_COUNT = 8
const MAX_RESULT_COUNT = 10
const MAX_PAGE_EXTRACTS = 3

const SOURCE_TARGETS = [
  { label: "sea", domains: ["sea.gob.cl", "seia.cl"], confidenceBoost: 0.12, queryHint: "site:sea.gob.cl OR site:seia.cl" },
  { label: "pjud", domains: ["pjud.cl"], confidenceBoost: 0.1, queryHint: "site:pjud.cl" },
  { label: "mercado-publico", domains: ["mercadopublico.cl"], confidenceBoost: 0.08, queryHint: "site:mercadopublico.cl" },
  { label: "conaf", domains: ["conaf.cl"], confidenceBoost: 0.08, queryHint: "site:conaf.cl" },
  { label: "municipal", domains: [".muni.cl", ".municipalidad.cl"], confidenceBoost: 0.07, queryHint: "site:muni.cl OR site:municipalidad.cl" },
  { label: "cbr", domains: ["conservador.cl", "conservadordigital.cl"], confidenceBoost: 0.15, queryHint: "site:conservador.cl OR site:conservadordigital.cl" },
]

const BLOCKED_RESULT_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "linkedin.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
]

function normalize(str) {
  if (!str) return ""
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STOPWORDS = new Set([
  "has", "ha", "hectareas", "hectarea", "km",
  "de", "la", "el", "los", "las", "del", "y", "en", "con",
])

// Junk tokens that come from file naming conventions, not the property itself.
const JUNK = new Set([
  "kmz", "kml", "zip", "oficial", "posicion", "posición", "googleearth", "google",
  "earth", "ws", "gps", "waypoint", "waypoints", "track", "tracks", "limite",
  "limites", "límites", "toponimos", "topónimos", "usos", "suelos", "suelo",
  "marca", "poligono", "polígono", "poligonos", "mapa", "capa", "final", "copia",
  "nuevo", "nueva", "rev", "version", "versión", "v1", "v2", "def", "editado",
])

/** Build a clean, human-readable property name from a KMZ filename. */
function cleanName(fileName) {
  let base = fileName
    .replace(/\.(kmz|kml|zip)$/i, "")
    .replace(/\(\d+\)/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\d+\s*(has?|hectareas?|ha)\b/gi, "") // "18 has" -> ""
    .replace(/\b\d{4}\b/g, "") // stray years like 2016
    .replace(/\s+/g, " ")
    .trim()

  // Drop junk tokens but keep meaningful place words
  const kept = base
    .split(" ")
    .filter((w) => {
      const n = normalize(w)
      return n.length > 1 && !JUNK.has(n)
    })
  return kept.join(" ").trim()
}

// Generic property words that are NOT distinctive on their own. "Lote 9" or
// "Parcela 2" carry no identifying signal, so we don't treat them as a real
// searchable property name.
const GENERIC = new Set([
  "fundo", "hacienda", "estancia", "campo", "parcela", "lote", "sitio", "predio",
  "hijuela", "retazo", "resto", "sector", "camino", "ruta", "terreno", "loteo",
  "norte", "sur", "este", "oeste", "alto", "bajo", "nuevo", "grande", "chico",
])

/** Count meaningful (non-stopword) tokens in a cleaned name. */
function meaningfulTokens(name) {
  return normalize(name)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

/** Distinctive tokens = meaningful tokens that aren't generic property words. */
function distinctiveTokens(name) {
  return meaningfulTokens(name).filter((w) => !GENERIC.has(w))
}

function getHostname(input) {
  try {
    return new URL(input).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function classifySource(link) {
  const hostname = getHostname(link)
  const matched = SOURCE_TARGETS.find((target) =>
    target.domains.some((domain) => domain.startsWith(".") ? hostname.endsWith(domain) : hostname === domain || hostname.endsWith(`.${domain}`))
  )

  return {
    hostname,
    sourceLabel: matched?.label || "general",
    confidenceBoost: matched?.confidenceBoost || 0,
    isPrioritySource: Boolean(matched),
  }
}

function isBlockedResult(link) {
  const hostname = getHostname(link)
  return BLOCKED_RESULT_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildSearchQueries({ name, commune, region, rol }) {
  const cleanRol = `${rol || ""}`.trim()
  const cleanNameValue = `${name || ""}`.trim()
  const cleanCommune = `${commune || ""}`.trim()
  const cleanRegion = `${region || ""}`.trim()
  const distinctNameTokens = distinctiveTokens(cleanNameValue).slice(0, 4)
  const tokenLabel = distinctNameTokens.join(" ")

  const queries = [
    cleanRol ? `"${cleanRol}" propietario sociedad predio chile` : null,
    cleanRol && cleanCommune ? `"${cleanRol}" "${cleanCommune}" propietario sociedad` : null,
    cleanRol && cleanRegion ? `"${cleanRol}" "${cleanRegion}" sociedad agricola forestal` : null,
    cleanRol ? `"${cleanRol}" site:sea.gob.cl OR site:seia.cl` : null,
    cleanRol ? `"${cleanRol}" site:pjud.cl OR site:mercadopublico.cl` : null,
    cleanRol ? `"${cleanRol}" site:conaf.cl OR site:muni.cl` : null,
    cleanNameValue && cleanRegion ? `"${cleanNameValue}" "${cleanRegion}" sociedad propietario` : null,
    tokenLabel && cleanRegion ? `"${tokenLabel}" "${cleanRegion}" sociedad agricola forestal` : null,
    tokenLabel ? `"${tokenLabel}" site:sea.gob.cl OR site:conaf.cl OR site:mercadopublico.cl` : null,
  ]

  for (const source of SOURCE_TARGETS) {
    if (cleanRol) {
      queries.push(`"${cleanRol}" ${source.queryHint}`)
    }
  }

  return unique(queries).slice(0, MAX_QUERY_COUNT)
}

function scoreResult(result, context) {
  const title = normalize(result?.title || "")
  const snippet = normalize(result?.snippet || "")
  const link = `${result?.link || ""}`.trim()
  const { confidenceBoost, isPrioritySource } = classifySource(link)
  let score = isPrioritySource ? 40 : 10

  if (!link) score -= 50
  if (isBlockedResult(link)) score -= 100

  const rolToken = normalize(context.rol || "")
  if (rolToken && (`${title} ${snippet}`).includes(rolToken)) score += 28

  const communeToken = normalize(context.commune || "")
  if (communeToken && (`${title} ${snippet}`).includes(communeToken)) score += 10

  const regionToken = normalize(context.region || "")
  if (regionToken && (`${title} ${snippet}`).includes(regionToken)) score += 6

  for (const token of context.distinctive || []) {
    if ((`${title} ${snippet}`).includes(token)) score += 8
  }

  if (/\bpropietari|\bduen|\bsociedad|\bspa\b|\bltda\b|\bs\.a\b|\bagricola\b|\bforestal\b/.test(`${title} ${snippet}`)) {
    score += 16
  }

  score += Math.round(confidenceBoost * 100)
  return score
}

function mergeSearchResults(queryRuns, context) {
  const byLink = new Map()

  for (const run of queryRuns) {
    for (const result of run.results || []) {
      const link = `${result?.link || ""}`.trim()
      if (!link || isBlockedResult(link)) continue

      const merged = {
        ...result,
        query: run.query,
        sourceHint: classifySource(link).sourceLabel,
      }
      const scored = scoreResult(merged, context)
      const existing = byLink.get(link)

      if (!existing || scored > existing.__score) {
        byLink.set(link, {
          ...merged,
          __score: scored,
          queryCount: existing ? existing.queryCount + 1 : 1,
        })
      } else if (existing) {
        existing.queryCount += 1
      }
    }
  }

  return Array.from(byLink.values())
    .sort((a, b) => b.__score - a.__score)
    .slice(0, MAX_RESULT_COUNT)
}

function stripHtml(html) {
  return `${html || ""}`
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchPageExtract(link) {
  if (!link || /\.pdf(\?|$)/i.test(link)) {
    return null
  }

  try {
    const response = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SurRealistaOwnerResearch/1.0)",
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.6",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      return null
    }

    const contentType = `${response.headers.get("content-type") || ""}`.toLowerCase()
    if (!contentType.includes("text/html")) {
      return null
    }

    const html = await response.text()
    const text = stripHtml(html).slice(0, 1800)
    if (!text) return null

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

    return {
      link,
      title: titleMatch?.[1]?.replace(/\s+/g, " ").trim() || null,
      text,
    }
  } catch {
    return null
  }
}

async function fetchPriorityPageExtracts(results) {
  const selected = results
    .filter((result) => classifySource(result.link).isPrioritySource)
    .slice(0, MAX_PAGE_EXTRACTS)

  const extracts = []
  for (const result of selected) {
    const extract = await fetchPageExtract(result.link)
    if (extract) extracts.push(extract)
  }
  return extracts
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

/** Extract commune code and name from ROL (format: XXXX-YYY-ZZ where XXXX is commune code).
 * Returns { code, name } or { code: null, name: null } if not found.
 */
function getCommuneFromRol(rol) {
  if (!rol || typeof rol !== "string") return { code: null, name: null }
  const match = rol.match(/^(\d{4,5})(-|$)/)
  if (!match) return { code: null, name: null }
  return { code: match[1], name: null } // name comes from SII lookup
}

function getCommune(metadata) {
  const m = metadata || {}
  // Priority 1: Direct commune field
  if (m.commune) return m.commune
  
  // Priority 2: ROL code (most reliable - embedded in ROL structure)
  const rol = m?.sii_point_resolution?.record?.rol
  if (rol) {
    const { code } = getCommuneFromRol(rol)
    if (code) {
      // Return the nome name if available, otherwise just the code
      return m?.sii_point_resolution?.record?.nombreComuna || `Comuna-${code}`
    }
  }
  
  // Priority 3: SII resolution data
  return (
    m?.sii_point_resolution?.record?.nombreComuna ||
    ""
  )
}

function getRegion(metadata) {
  const m = metadata || {}
  return m?.sii_point_resolution?.record?.region || m.region || ""
}

function getRol(metadata) {
  const m = metadata || {}
  return m?.sii_point_resolution?.record?.rol || m.rol || ""
}

/** Load KMZ candidates not yet attempted with web+ai. */
async function loadCandidates() {
  // Supabase REST API max is 1000 rows. Fetch in pages and combine.
  const all = []
  let page = 0
  const pageSize = 1000
  
  while (true) {
    const offset = page * pageSize
    console.log(`[debug] Fetching page ${page} (offset=${offset}, limit=${pageSize})...`)
    const res = await sbFetch(
      `kmz_collection?select=id,file_name,metadata&order=id.asc&limit=${pageSize}&offset=${offset}`
    )
    const batch = await res.json()
    console.log(`[debug] Got ${batch ? batch.length : 0} rows`)
    if (!batch || batch.length === 0) {
      console.log(`[debug] No more rows, stopping pagination`)
      break
    }
    all.push(...batch)
    console.log(`[debug] Loaded page ${page}: ${batch.length} rows (total: ${all.length})`)
    // Stop if we got fewer rows than pageSize (means we're at the end)
    if (batch.length < pageSize) {
      console.log(`[debug] Got fewer than ${pageSize} rows, must be last page`)
      break
    }
    page++
  }
  console.log(`[debug] Loaded all ${all.length} total KMZ from DB`)
  
  const candidates = all.filter((k) => {
    const m = k.metadata || {}
    // Skip already-scraped unless FORCE is set
    const alreadyScraped = m.web_owner_scraped_at || m.web_owner_search_run_at
    if (!FORCE && alreadyScraped) {
      return false
    }
    return true
  })
  
  console.log(`[debug] After filter: ${candidates.length} candidates (FORCE=${FORCE})`)
  
  // LIMIT=0 means "process all remaining", not "process nothing"
  const endIdx = LIMIT === 0 ? candidates.length : OFFSET + LIMIT
  const final = candidates.slice(OFFSET, endIdx)
  console.log(`[debug] Sliced to ${final.length} (OFFSET=${OFFSET}, LIMIT=${LIMIT}, endIdx=${endIdx})`)
  return final
}

async function updateKmz(id, patchMeta, existingMeta) {
  const merged = { ...(existingMeta || {}), ...patchMeta }
  await sbFetch(`kmz_collection?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ metadata: merged }),
  })
}

// --------------------------- Serper search --------------------------------
async function serperSearch(query) {
  const res = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "cl", hl: "es", num: 8 }),
  })
  if (!res.ok) throw new Error(`Serper ${res.status}: ${(await res.text()).slice(0, 150)}`)
  const data = await res.json()
  return data.organic || []
}

// --------------------------- OpenAI extraction ----------------------------
async function extractOwner({ propertyName, commune, region, rol, results, pageExtracts = [] }) {
  let evidence = results
    .slice(0, 8)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet || ""}\n${r.link}`)
    .join("\n\n")
  const pageEvidence = pageExtracts.length
    ? `\n\nExtractos de paginas fuente:\n${pageExtracts
        .map((item, index) => `[P${index + 1}] ${item.title || item.link}\n${item.text}\n${item.link}`)
        .join("\n\n")}`
    : ""
  evidence += pageEvidence

  const system =
    "Eres un analista experto en propiedad rural chilena. Extraes el nombre del " +
    "PROPIETARIO o SOCIEDAD dueña de un predio ESPECÍFICO a partir de resultados de búsqueda web reales. " +
    "Reglas estrictas:\n" +
    "- El resultado debe referirse al MISMO predio (el nombre del predio o su localidad debe aparecer explícitamente en el snippet que citas).\n" +
    "- NO asocies una empresa solo porque opera en la misma comuna o región. Coincidencia geográfica NO basta.\n" +
    "- SOLO devuelve un dueño si un resultado lo respalda CLARAMENTE y de forma específica para este predio.\n" +
    "- Prefiere sociedades/empresas (SpA, Ltda, S.A., Agrícola, Forestal, Inmobiliaria) o personas nombradas.\n" +
    "- NO inventes. Si son avisos de venta genéricos, loteos, corredoras, portales inmobiliarios, municipios, o no mencionan un dueño concreto de ESTE predio, devuelve owner=null.\n" +
    "- Confianza: 0.9+ si el nombre del predio (o su dueño) aparece explícito en un resultado; 0.6-0.8 si es probable por contexto; <0.4 si es dudoso.\n" +
    "- Si un resultado nombra una sociedad agrícola/forestal cuyo nombre coincide con el del predio (ej: predio 'Santa Teresa' y 'Agrícola Santa Teresa SpA'), es un match fuerte.\n" +
    "- Responde SOLO JSON válido."

  const user =
    `Predio: "${propertyName}"\n` +
    `Comuna: ${commune || "desconocida"}\n` +
    `Región: ${region || "desconocida"}\n` +
    `ROL SII: ${rol || "desconocido"}\n\n` +
    `Resultados de búsqueda:\n${evidence}\n\n` +
    `Devuelve JSON con este formato exacto:\n` +
    `{"owner": "nombre o null", "owner_type": "company|person|null", "confidence": 0.0, "evidence_index": 0, "reasoning": "breve"}`

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 150)}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || "{}"
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    parsed = { owner: null, confidence: 0 }
  }
  // Normalize owner null-ish values
  if (
    !parsed.owner ||
    ["null", "none", "desconocido", "n/a"].includes(String(parsed.owner).toLowerCase())
  ) {
    parsed.owner = null
  }
  return parsed
}

// ------------------------------- Main -------------------------------------
async function main() {
  console.log("=".repeat(60))
  console.log("WEB + AI OWNER SCRAPER (Serper + GPT-4o-mini)")
  console.log("=".repeat(60))
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"} | limit=${LIMIT} offset=${OFFSET} force=${FORCE}`)
  console.log(`Delay=${DELAY}ms | min-conf=${MIN_CONF}`)
  console.log("")

  const candidates = await loadCandidates()
  console.log(`[scraper] ${candidates.length} candidates to process`)
  if (candidates.length === 0) {
    console.log("[scraper] Nothing to do. Exiting.")
    return
  }

  const stats = { processed: 0, confirmed: 0, lead: 0, noMatch: 0, errors: 0, credits: 0 }
  const found = []

  for (const kmz of candidates) {
    stats.processed++
    const name = cleanName(kmz.file_name)
    const commune = getCommune(kmz.metadata)
    const region = getRegion(kmz.metadata)
    const rol = getRol(kmz.metadata)
    const label = (name || kmz.file_name).slice(0, 40).padEnd(40)
    const tokens = meaningfulTokens(name)

    // Skip properties with no meaningful place name (saves Serper credits) -
    // unless we at least have a commune to anchor the search.
    if (tokens.length === 0 && !commune) {
      stats.noMatch++
      console.log(`[${stats.processed}/${candidates.length}] ${label} -> skip (no name/commune)`)
      if (!DRY_RUN)
        await updateKmz(kmz.id, { web_owner_scraped_at: new Date().toISOString(), web_owner: null }, kmz.metadata)
      continue
    }

    const searchQueries = buildSearchQueries({ name, commune, region, rol })
    const searchContext = {
      rol,
      commune,
      region,
      distinctive: distinctiveTokens(name),
    }

    try {
      const queryRuns = []
      for (const query of searchQueries) {
        const queryResults = await serperSearch(query)
        stats.credits++
        queryRuns.push({ query, results: queryResults })
        await sleep(150)
      }

      const results = mergeSearchResults(queryRuns, searchContext)
      if (results.length === 0) {
        stats.noMatch++
        console.log(`[${stats.processed}/${candidates.length}] ${label} -> no results`)
        if (!DRY_RUN)
          await updateKmz(
            kmz.id,
            {
              web_owner_scraped_at: new Date().toISOString(),
              web_owner_search_run_at: new Date().toISOString(),
              web_owner: null,
              web_owner_search_queries: searchQueries,
              web_owner_search_sources: [],
            },
            kmz.metadata
          )
        await sleep(DELAY)
        continue
      }

      const pageExtracts = await fetchPriorityPageExtracts(results)
      const ai = await extractOwner({ propertyName: name, commune, region, rol, results, pageExtracts })
      let conf = Number(ai.confidence) || 0
      const evIdx = Number(ai.evidence_index) || 0
      const evItem = results[evIdx - 1] || results[0]
      const pageEvIdx = Number(ai.page_evidence_index) || 0
      const pageEvItem = pageExtracts[pageEvIdx - 1] || null
      const evUrl = evItem?.link || null
      const primarySource = classifySource(pageEvItem?.link || evUrl)
      const topSources = unique(
        results.map((item) => classifySource(item.link).sourceLabel).filter((item) => item && item !== "general")
      ).slice(0, 5)

      // Evidence verification: at least one DISTINCTIVE token of the property
      // name must appear in the cited evidence (title+snippet+link). This stops
      // the model from confidently attaching any regional company to a generic
      // name like "Lote 9". If it fails, downgrade to an unconfirmed lead.
      const distinctive = distinctiveTokens(name)
      if (ai.owner && distinctive.length > 0) {
        const evText = normalize(
          `${evItem?.title || ""} ${evItem?.snippet || ""} ${evItem?.link || ""}`
        )
        const nameInEvidence = distinctive.some((t) => evText.includes(t))
        if (!nameInEvidence && conf >= MIN_CONF) {
          conf = 0.5 // demote: owner plausible but not tied to THIS property
        }
      } else if (ai.owner && distinctive.length === 0) {
        // Purely generic name (e.g. "Lote 9"): never confirm from web alone.
        if (conf >= MIN_CONF) conf = 0.4
      }

      conf = Math.min(1, conf + primarySource.confidenceBoost)

      const runMetadata = {
        queries: searchQueries,
        resultCount: results.length,
        pageExtractCount: pageExtracts.length,
        topSources,
        primaryEvidenceDomain: primarySource.hostname || null,
        executedAt: new Date().toISOString(),
      }

      if (ai.owner && conf >= MIN_CONF) {
        stats.confirmed++
        console.log(`[${stats.processed}/${candidates.length}] ${label} -> ${ai.owner} (${ai.owner_type}, conf ${conf.toFixed(2)})`)
        found.push({ file: kmz.file_name, owner: ai.owner, conf, tier: "confirmed" })
        if (!DRY_RUN)
          await updateKmz(
            kmz.id,
            {
              web_owner: ai.owner,
              web_owner_type: ai.owner_type || null,
              web_owner_confidence: conf,
              web_owner_evidence_url: evUrl,
              web_owner_reasoning: ai.reasoning || null,
              web_owner_scraped_at: new Date().toISOString(),
              web_owner_search_run_at: new Date().toISOString(),
              web_owner_search_queries: searchQueries,
              web_owner_search_sources: topSources,
              web_owner_page_evidence_url: pageEvItem?.link || null,
              confirmed_owner: ai.owner,
              owner_source: "web+ai",
              public_owner_candidate: {
                name: ai.owner,
                type: ai.owner_type || null,
                confidence: conf,
                reason: ai.reasoning || null,
                source: primarySource.sourceLabel,
                url: pageEvItem?.link || evUrl,
                dateFound: new Date().toISOString(),
              },
              web_owner_last_run: runMetadata,
            },
            kmz.metadata
          )
      } else if (ai.owner && conf > 0) {
        stats.lead++
        console.log(`[${stats.processed}/${candidates.length}] ${label} ~ ${ai.owner} (lead, conf ${conf.toFixed(2)})`)
        found.push({ file: kmz.file_name, owner: ai.owner, conf, tier: "lead" })
        if (!DRY_RUN)
          await updateKmz(
            kmz.id,
            {
              web_owner_lead: ai.owner,
              web_owner_lead_type: ai.owner_type || null,
              web_owner_confidence: conf,
              web_owner_evidence_url: evUrl,
              web_owner_scraped_at: new Date().toISOString(),
              web_owner_search_run_at: new Date().toISOString(),
              web_owner_search_queries: searchQueries,
              web_owner_search_sources: topSources,
              web_owner_page_evidence_url: pageEvItem?.link || null,
              web_owner_last_run: runMetadata,
            },
            kmz.metadata
          )
      } else {
        stats.noMatch++
        console.log(`[${stats.processed}/${candidates.length}] ${label} -> no owner found`)
        if (!DRY_RUN)
          await updateKmz(
            kmz.id,
            {
              web_owner_scraped_at: new Date().toISOString(),
              web_owner_search_run_at: new Date().toISOString(),
              web_owner: null,
              web_owner_search_queries: searchQueries,
              web_owner_search_sources: topSources,
              web_owner_last_run: runMetadata,
            },
            kmz.metadata
          )
      }
    } catch (err) {
      stats.errors++
      console.log(`[${stats.processed}/${candidates.length}] ${label} ERROR: ${err.message}`)
    }

    await sleep(DELAY)
  }

  console.log("")
  console.log("=".repeat(60))
  console.log("RESULTS")
  console.log("=".repeat(60))
  console.log(`Processed:        ${stats.processed}`)
  console.log(`Confirmed owner:  ${stats.confirmed} (${((stats.confirmed / stats.processed) * 100).toFixed(1)}%)`)
  console.log(`Leads (low conf): ${stats.lead}`)
  console.log(`No owner:         ${stats.noMatch}`)
  console.log(`Errors:           ${stats.errors}`)
  console.log(`Serper credits:   ~${stats.credits}`)
  console.log("")
  const confirmed = found.filter((f) => f.tier === "confirmed")
  if (confirmed.length > 0) {
    console.log("Confirmed owners:")
    for (const f of confirmed.slice(0, 20)) {
      console.log(`  ${f.owner}  [${f.conf.toFixed(2)}]  <- ${f.file}`)
    }
  }
}

main().catch((e) => {
  console.error("[scraper] FATAL:", e)
  process.exit(1)
})
