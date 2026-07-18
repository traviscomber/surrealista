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
  const res = await sbFetch(`kmz_collection?select=id,file_name,metadata&order=id.asc`)
  const all = await res.json()
  const candidates = all.filter((k) => {
    const m = k.metadata || {}
    if (!FORCE && m.web_owner_scraped_at) return false
    return true
  })
  return candidates.slice(OFFSET, OFFSET + LIMIT)
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
async function extractOwner({ propertyName, commune, region, rol, results }) {
  const evidence = results
    .slice(0, 8)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet || ""}\n${r.link}`)
    .join("\n\n")

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

    // Build a focused query WITHOUT exact-phrase quotes (too strict for these
    // informal names). Commune + region anchor it to the right area.
    const q = [name, commune, region, "propiedad agricola predio propietario"]
      .filter(Boolean)
      .join(" ")
      .trim()

    try {
      const results = await serperSearch(q)
      stats.credits++
      if (results.length === 0) {
        stats.noMatch++
        console.log(`[${stats.processed}/${candidates.length}] ${label} -> no results`)
        if (!DRY_RUN)
          await updateKmz(kmz.id, { web_owner_scraped_at: new Date().toISOString(), web_owner: null }, kmz.metadata)
        await sleep(DELAY)
        continue
      }

      const ai = await extractOwner({ propertyName: name, commune, region, rol, results })
      let conf = Number(ai.confidence) || 0
      const evIdx = Number(ai.evidence_index) || 0
      const evItem = results[evIdx - 1] || results[0]
      const evUrl = evItem?.link || null

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
              confirmed_owner: ai.owner,
              owner_source: "web+ai",
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
            },
            kmz.metadata
          )
      } else {
        stats.noMatch++
        console.log(`[${stats.processed}/${candidates.length}] ${label} -> no owner found`)
        if (!DRY_RUN)
          await updateKmz(kmz.id, { web_owner_scraped_at: new Date().toISOString(), web_owner: null }, kmz.metadata)
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
