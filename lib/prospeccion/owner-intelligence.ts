import { createClient } from "@supabase/supabase-js"

export type OwnerRelation = "legal_owner" | "producer_operator" | "historical_owner" | "unknown"
export type OwnerResearchStatus = "owner_verified" | "owner_candidate_found" | "producer_candidate_found" | "owner_pending"

export type OwnerEvidence = {
  relation: OwnerRelation
  name: string | null
  confidence: number
  source: string
  sourceUrl: string | null
  excerpt: string | null
  observedAt: string | null
  authority: "canonical" | "official" | "public_web" | "derived"
}

export type OwnerResearchResult = {
  rol: string
  commune: string | null
  status: OwnerResearchStatus
  owner: { name: string; confidence: number; source: string; evidenceUrl: string | null; relation: "legal_owner" } | null
  producer: { name: string; confidence: number; source: string; evidenceUrl: string | null; relation: "producer_operator" } | null
  historicalOwner: { name: string; confidence: number; source: string; evidenceUrl: string | null; relation: "historical_owner" } | null
  evidence: OwnerEvidence[]
  attemptedSources: string[]
  verificationRequired: boolean
  nextAction: string
}

type WebSearchResult = {
  title?: string
  snippet?: string
  link?: string
  date?: string
}

type ExtractedWebOwner = {
  name: string | null
  relation: OwnerRelation
  confidence: number
  evidenceIndex: number
  reasoning: string | null
}

const SERPER_ENDPOINT = "https://google.serper.dev/search"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function normalizeOwnerSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeOwnerRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/\//g, "-")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

export function ownerRolVariants(value: unknown) {
  const canonical = normalizeOwnerRol(value)
  if (!canonical) return []
  const slash = canonical.replace(/-/g, "/")
  const compact = canonical.replace(/-/g, "")
  return Array.from(new Set([canonical, slash, compact]))
}

function compactEvidenceText(value: unknown) {
  return normalizeOwnerSearchText(value).replace(/\s+/g, "")
}

export function evidenceMatchesRolAndCommune(text: unknown, rol: unknown, commune: unknown) {
  const normalized = normalizeOwnerSearchText(text)
  const compact = compactEvidenceText(text)
  const communeToken = normalizeOwnerSearchText(commune)
  const rolMatches = ownerRolVariants(rol).some((variant) => {
    const normalizedVariant = normalizeOwnerSearchText(variant)
    const compactVariant = compactEvidenceText(variant)
    return (normalizedVariant && normalized.includes(normalizedVariant)) || (compactVariant && compact.includes(compactVariant))
  })
  const communeMatches = !communeToken || normalized.includes(communeToken)
  return rolMatches && communeMatches
}

function parseOwnerCandidate(value: unknown) {
  if (!value) return null
  if (typeof value === "string") return value.trim() || null
  if (typeof value === "object") {
    const name = String((value as Record<string, unknown>).name || "").trim()
    return name || null
  }
  return null
}

function extractKmzRoles(row: any) {
  const values: string[] = []
  if (Array.isArray(row?.rol_numbers)) values.push(...row.rol_numbers.map(String))
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {}
  for (const key of ["rol", "rol_predio", "rolpredi", "property_rol"]) {
    if (metadata[key]) values.push(String(metadata[key]))
  }
  if (Array.isArray(metadata.rol_numbers)) values.push(...metadata.rol_numbers.map(String))
  return Array.from(new Set(values.map(normalizeOwnerRol).filter(Boolean)))
}

function clampConfidence(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(1, number))
}

function isPlausibleName(value: unknown) {
  const name = String(value ?? "").trim()
  if (name.length < 4) return false
  const normalized = normalizeOwnerSearchText(name)
  if (!normalized) return false
  const generic = ["propietario", "dueno", "sin informacion", "desconocido", "curico", "predio", "fundo", "parcela"]
  if (generic.includes(normalized)) return false
  return true
}

async function exactInternalEvidence(rol: string, commune: string | null) {
  const supabase = db()
  if (!supabase) return [] as OwnerEvidence[]
  const canonicalRol = normalizeOwnerRol(rol)
  const evidence: OwnerEvidence[] = []

  const [{ data: kmzRows }, { data: enhancedRows }, { data: summaryRows }] = await Promise.all([
    supabase
      .from("kmz_collection")
      .select("id,file_name,owner,pic,pic_phone,pic_email,rol_numbers,metadata,is_active")
      .eq("is_active", true)
      .not("rol_numbers", "is", null)
      .limit(5000),
    supabase
      .from("properties_enhanced")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email,city,region,import_source,data_quality_score,updated_at")
      .in("property_rol", ownerRolVariants(rol))
      .limit(20),
    supabase
      .from("properties_summary")
      .select("id,title,property_rol,owner_name,contact_name,contact_phone,contact_email,region,status,created_at")
      .in("property_rol", ownerRolVariants(rol))
      .limit(20),
  ])

  for (const row of kmzRows ?? []) {
    if (!extractKmzRoles(row).includes(canonicalRol)) continue
    const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {}
    const confirmed = String(metadata.confirmed_owner || "").trim()
    const webOwner = String(metadata.web_owner || "").trim()
    const webConfidence = clampConfidence(metadata.web_owner_confidence)
    const direct = String(row?.owner || "").trim()
    const publicCandidate = parseOwnerCandidate(metadata.public_owner_candidate)
    const publicConfidence = clampConfidence(
      typeof metadata.public_owner_candidate === "object"
        ? metadata.public_owner_candidate?.confidence
        : metadata.owner_confidence,
    )
    const evidenceUrl = String(metadata.web_owner_evidence_url || metadata.cbr_document_url || "").trim() || null

    if (isPlausibleName(confirmed)) {
      evidence.push({ relation: "legal_owner", name: confirmed, confidence: 1, source: "kmz.confirmed_owner", sourceUrl: evidenceUrl, excerpt: `Coincidencia exacta de ROL ${rol} en inventario KMZ con propietario confirmado.`, observedAt: row.updated_at ?? null, authority: "canonical" })
    } else if (isPlausibleName(direct)) {
      evidence.push({ relation: "legal_owner", name: direct, confidence: 0.9, source: "kmz.owner", sourceUrl: evidenceUrl, excerpt: `Coincidencia exacta de ROL ${rol} en inventario KMZ con campo owner.`, observedAt: row.updated_at ?? null, authority: "canonical" })
    } else if (isPlausibleName(webOwner) && webConfidence >= 0.8 && evidenceUrl) {
      evidence.push({ relation: "producer_operator", name: webOwner, confidence: Math.min(0.85, webConfidence), source: "kmz.web_owner", sourceUrl: evidenceUrl, excerpt: String(metadata.web_owner_evidence_snippet || metadata.web_owner_reasoning || "Evidencia web previamente validada para este ROL."), observedAt: String(metadata.web_owner_scraped_at || "") || null, authority: "public_web" })
    } else if (isPlausibleName(publicCandidate) && publicConfidence >= 0.85 && evidenceUrl) {
      evidence.push({ relation: "producer_operator", name: publicCandidate, confidence: Math.min(0.8, publicConfidence), source: "kmz.public_owner_candidate", sourceUrl: evidenceUrl, excerpt: "Candidato público previamente almacenado con evidencia URL y alta confianza.", observedAt: row.updated_at ?? null, authority: "public_web" })
    }
  }

  for (const row of enhancedRows ?? []) {
    const owner = String(row.owner_name || "").trim()
    if (!isPlausibleName(owner)) continue
    const city = normalizeOwnerSearchText(row.city)
    const wantedCommune = normalizeOwnerSearchText(commune)
    if (wantedCommune && city && city !== wantedCommune) continue
    evidence.push({ relation: "legal_owner", name: owner, confidence: Number(row.data_quality_score || 0) >= 90 ? 0.95 : 0.85, source: `properties_enhanced${row.import_source ? `:${row.import_source}` : ""}`, sourceUrl: null, excerpt: `ROL exacto ${rol} en properties_enhanced.`, observedAt: row.updated_at ?? null, authority: "canonical" })
  }

  for (const row of summaryRows ?? []) {
    const owner = String(row.owner_name || "").trim()
    if (!isPlausibleName(owner)) continue
    evidence.push({ relation: "legal_owner", name: owner, confidence: 0.85, source: "properties_summary", sourceUrl: null, excerpt: `ROL exacto ${rol} en properties_summary.`, observedAt: row.created_at ?? null, authority: "canonical" })
  }

  return evidence
}

function uniqueResults(results: WebSearchResult[]) {
  const seen = new Set<string>()
  return results.filter((result) => {
    const link = String(result.link || "").trim()
    if (!link || seen.has(link)) return false
    seen.add(link)
    return true
  })
}

async function serperSearch(query: string) {
  const key = process.env.SERPER_API_KEY
  if (!key) return [] as WebSearchResult[]
  const response = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "cl", hl: "es", num: 10 }),
    signal: AbortSignal.timeout(7000),
  })
  if (!response.ok) throw new Error(`Serper ${response.status}`)
  const body = await response.json() as { organic?: WebSearchResult[] }
  return body.organic ?? []
}

function buildQueries(rol: string, commune: string | null) {
  const canonical = normalizeOwnerRol(rol)
  const slash = canonical.replace(/-/g, "/")
  const place = commune ? `"${commune}"` : "Chile"
  return Array.from(new Set([
    `"${canonical}" ${place} propietario predio`,
    `"${slash}" ${place} propietario predio`,
    `"${canonical}" ${place} agrícola sociedad fundo`,
    `"${slash}" ${place} productor agrícola`,
  ]))
}

async function extractFromSearchResults(rol: string, commune: string | null, results: WebSearchResult[]): Promise<ExtractedWebOwner> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !results.length) return { name: null, relation: "unknown", confidence: 0, evidenceIndex: 0, reasoning: null }

  const evidence = results.slice(0, 10).map((result, index) => ({
    index: index + 1,
    title: result.title || "",
    snippet: result.snippet || "",
    url: result.link || "",
    date: result.date || null,
  }))

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Eres un verificador de propiedad rural chilena. Sólo puedes usar la evidencia entregada. El ROL no es globalmente único: exige coincidencia del ROL y de la comuna. Distingue legal_owner (la fuente dice explícitamente propietario/dueño/titular), producer_operator (empresa/productor/sucursal en ese ROL sin probar dominio), historical_owner (propietario explícito pero evidencia antigua), y unknown. Nunca conviertas productor u operador en propietario legal. No inventes. No devuelvas teléfonos o correos personales. Responde sólo JSON válido.",
        },
        {
          role: "user",
          content: JSON.stringify({
            target: { rol, commune },
            evidence,
            output: { name: "string|null", relation: "legal_owner|producer_operator|historical_owner|unknown", confidence: "0..1", evidenceIndex: "1-based index or 0", reasoning: "brief" },
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}`)
  const body = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> }
  const content = body.choices?.[0]?.message?.content || "{}"
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    const relation = ["legal_owner", "producer_operator", "historical_owner"].includes(String(parsed.relation))
      ? String(parsed.relation) as OwnerRelation
      : "unknown"
    return {
      name: isPlausibleName(parsed.name) ? String(parsed.name).trim() : null,
      relation,
      confidence: clampConfidence(parsed.confidence),
      evidenceIndex: Math.max(0, Math.floor(Number(parsed.evidenceIndex || 0))),
      reasoning: String(parsed.reasoning || "").trim() || null,
    }
  } catch {
    return { name: null, relation: "unknown", confidence: 0, evidenceIndex: 0, reasoning: null }
  }
}

async function webEvidence(rol: string, commune: string | null) {
  if (!process.env.SERPER_API_KEY || !process.env.OPENAI_API_KEY) return [] as OwnerEvidence[]
  const queryRuns = await Promise.all(buildQueries(rol, commune).map(async (query) => {
    try {
      return await serperSearch(query)
    } catch (error) {
      console.warn("[Owner Intelligence] Serper query failed", error instanceof Error ? error.message : "unknown")
      return [] as WebSearchResult[]
    }
  }))
  const results = uniqueResults(queryRuns.flat())
    .filter((result) => evidenceMatchesRolAndCommune(`${result.title || ""} ${result.snippet || ""}`, rol, commune))
    .slice(0, 10)
  if (!results.length) return []

  const extracted = await extractFromSearchResults(rol, commune, results)
  if (!extracted.name || extracted.relation === "unknown" || extracted.evidenceIndex < 1) return []
  const chosen = results[extracted.evidenceIndex - 1]
  if (!chosen || !evidenceMatchesRolAndCommune(`${chosen.title || ""} ${chosen.snippet || ""}`, rol, commune)) return []

  let confidence = extracted.confidence
  if (extracted.relation === "producer_operator") confidence = Math.min(confidence, 0.78)
  if (extracted.relation === "historical_owner") confidence = Math.min(confidence, 0.65)
  if (extracted.relation === "legal_owner") confidence = Math.min(confidence, 0.88)

  return [{
    relation: extracted.relation,
    name: extracted.name,
    confidence,
    source: new URL(String(chosen.link)).hostname,
    sourceUrl: String(chosen.link),
    excerpt: String(chosen.snippet || extracted.reasoning || "").slice(0, 700) || null,
    observedAt: chosen.date || null,
    authority: "public_web",
  }]
}

function dedupeEvidence(evidence: OwnerEvidence[]) {
  const seen = new Set<string>()
  return evidence
    .filter((item) => item.name && item.confidence > 0)
    .filter((item) => {
      const key = `${item.relation}:${normalizeOwnerSearchText(item.name)}:${item.sourceUrl || item.source}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.confidence - a.confidence)
}

export async function researchOffMarketOwner(rolInput: string, communeInput?: string | null): Promise<OwnerResearchResult> {
  const rol = normalizeOwnerRol(rolInput)
  const commune = String(communeInput || "").trim() || null
  const attemptedSources = ["internal_exact_rol", "properties_enhanced", "properties_summary"]
  const internal = await exactInternalEvidence(rol, commune)

  let external: OwnerEvidence[] = []
  if (!internal.some((item) => item.relation === "legal_owner" && item.confidence >= 0.9)) {
    if (process.env.SERPER_API_KEY && process.env.OPENAI_API_KEY) {
      attemptedSources.push("serper_google", "openai_evidence_extraction")
      external = await webEvidence(rol, commune)
    } else {
      attemptedSources.push("web_provider_unavailable")
    }
  }

  const evidence = dedupeEvidence([...internal, ...external])
  const verifiedOwner = evidence.find((item) => item.relation === "legal_owner" && item.authority === "canonical" && item.confidence >= 0.9) ?? null
  const ownerCandidate = evidence.find((item) => item.relation === "legal_owner" && item.confidence >= 0.7) ?? null
  const producer = evidence.find((item) => item.relation === "producer_operator" && item.confidence >= 0.55) ?? null
  const historicalOwner = evidence.find((item) => item.relation === "historical_owner" && item.confidence >= 0.5) ?? null

  const owner = verifiedOwner || ownerCandidate
  const status: OwnerResearchStatus = verifiedOwner
    ? "owner_verified"
    : ownerCandidate
      ? "owner_candidate_found"
      : producer
        ? "producer_candidate_found"
        : "owner_pending"

  return {
    rol,
    commune,
    status,
    owner: owner ? { name: String(owner.name), confidence: owner.confidence, source: owner.source, evidenceUrl: owner.sourceUrl, relation: "legal_owner" } : null,
    producer: producer ? { name: String(producer.name), confidence: producer.confidence, source: producer.source, evidenceUrl: producer.sourceUrl, relation: "producer_operator" } : null,
    historicalOwner: historicalOwner ? { name: String(historicalOwner.name), confidence: historicalOwner.confidence, source: historicalOwner.source, evidenceUrl: historicalOwner.sourceUrl, relation: "historical_owner" } : null,
    evidence,
    attemptedSources,
    verificationRequired: status !== "owner_verified",
    nextAction: status === "owner_verified"
      ? "Propietario respaldado por evidencia interna canónica. Revalidar vigencia antes del contacto comercial."
      : status === "owner_candidate_found"
        ? "Existe candidato de propietario, pero falta validar vigencia registral en el Conservador antes de tratarlo como dueño actual."
        : status === "producer_candidate_found"
          ? "Existe productor u operador asociado al ROL. No equivale a propietario legal; validar dominio vigente antes de contacto como dueño."
          : historicalOwner
            ? "Existe evidencia histórica de propietario, insuficiente para afirmar dominio vigente. Validar en Conservador."
            : "No se encontró evidencia suficiente para afirmar propietario. Mantener el ROL en investigación y validar con Directorio Frutícola/CBR.",
  }
}
