export type WebOwnerRelation = "legal_owner" | "producer_operator" | "historical_owner" | "unknown"

export type WebOwnerEvidence = {
  name: string
  relation: Exclude<WebOwnerRelation, "unknown">
  confidence: number
  source: string
  url: string
  excerpt: string | null
}

type WebSearchResult = {
  title?: string
  snippet?: string
  link?: string
  date?: string
}

const SERPER_ENDPOINT = "https://google.serper.dev/search"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

export function normalizeOwnerWebText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeOwnerWebRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\//g, "-")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

export function ownerWebRolVariants(value: unknown) {
  const canonical = normalizeOwnerWebRol(value)
  if (!canonical) return []
  return Array.from(new Set([canonical, canonical.replace(/-/g, "/"), canonical.replace(/-/g, "")]))
}

function compact(value: unknown) {
  return normalizeOwnerWebText(value).replace(/\s+/g, "")
}

export function webEvidenceMatchesTarget(text: unknown, rol: unknown, commune: unknown) {
  const normalizedText = normalizeOwnerWebText(text)
  const compactText = compact(text)
  const communeToken = normalizeOwnerWebText(commune)
  const communeMatches = !communeToken || normalizedText.includes(communeToken)
  const rolMatches = ownerWebRolVariants(rol).some((variant) => {
    const normal = normalizeOwnerWebText(variant)
    const dense = compact(variant)
    return Boolean((normal && normalizedText.includes(normal)) || (dense && compactText.includes(dense)))
  })
  return communeMatches && rolMatches
}

function plausibleName(value: unknown) {
  const name = String(value ?? "").trim()
  if (name.length < 4) return false
  const normalized = normalizeOwnerWebText(name)
  return !["propietario", "dueno", "desconocido", "sin informacion", "predio", "fundo", "parcela"].includes(normalized)
}

function clamp(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0
}

async function search(query: string) {
  const key = process.env.SERPER_API_KEY
  if (!key) return [] as WebSearchResult[]
  const response = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "cl", hl: "es", num: 10 }),
    signal: AbortSignal.timeout(6500),
  })
  if (!response.ok) throw new Error(`Serper ${response.status}`)
  const body = await response.json() as { organic?: WebSearchResult[] }
  return body.organic ?? []
}

function queries(rol: string, commune: string) {
  const canonical = normalizeOwnerWebRol(rol)
  const slash = canonical.replace(/-/g, "/")
  const place = commune ? `"${commune}"` : "Chile"
  return Array.from(new Set([
    `"${canonical}" ${place} propietario predio`,
    `"${slash}" ${place} propietario predio`,
    `"${canonical}" ${place} sociedad agricola productor`,
    `"${slash}" ${place} fundo agrícola`,
  ]))
}

function unique(results: WebSearchResult[]) {
  const seen = new Set<string>()
  return results.filter((result) => {
    const link = String(result.link || "").trim()
    if (!link || seen.has(link)) return false
    seen.add(link)
    return true
  })
}

async function extract(rol: string, commune: string, results: WebSearchResult[]) {
  const key = process.env.OPENAI_API_KEY
  if (!key || !results.length) return null
  const evidence = results.slice(0, 10).map((item, index) => ({
    index: index + 1,
    title: item.title || "",
    snippet: item.snippet || "",
    url: item.link || "",
    date: item.date || null,
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
          content: "Verifica evidencia pública sobre un ROL rural chileno. Usa sólo la evidencia entregada. Exige coincidencia del ROL y de la comuna: el mismo número de ROL puede existir en otra comuna. Clasifica como legal_owner sólo si la fuente dice explícitamente propietario/dueño/titular; producer_operator si sólo demuestra productor, sucursal, explotación u operación; historical_owner si el propietario explícito proviene de evidencia antigua; unknown si no alcanza. Nunca conviertas productor en propietario. No inventes ni devuelvas teléfonos/correos personales. Responde sólo JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({ target: { rol, commune }, evidence, output: { name: "string|null", relation: "legal_owner|producer_operator|historical_owner|unknown", confidence: "0..1", evidenceIndex: "1..N or 0" } }),
        },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}`)
  const body = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> }
  try {
    const parsed = JSON.parse(body.choices?.[0]?.message?.content || "{}") as Record<string, unknown>
    const relationRaw = String(parsed.relation || "unknown")
    const relation: WebOwnerRelation = ["legal_owner", "producer_operator", "historical_owner"].includes(relationRaw) ? relationRaw as WebOwnerRelation : "unknown"
    const index = Math.max(0, Math.floor(Number(parsed.evidenceIndex || 0)))
    const chosen = results[index - 1]
    if (!chosen || relation === "unknown" || !plausibleName(parsed.name)) return null
    if (!webEvidenceMatchesTarget(`${chosen.title || ""} ${chosen.snippet || ""}`, rol, commune)) return null
    let confidence = clamp(parsed.confidence)
    if (relation === "legal_owner") confidence = Math.min(confidence, 0.88)
    if (relation === "producer_operator") confidence = Math.min(confidence, 0.78)
    if (relation === "historical_owner") confidence = Math.min(confidence, 0.65)
    return {
      name: String(parsed.name).trim(),
      relation: relation as Exclude<WebOwnerRelation, "unknown">,
      confidence,
      source: new URL(String(chosen.link)).hostname,
      url: String(chosen.link),
      excerpt: String(chosen.snippet || "").slice(0, 700) || null,
    } satisfies WebOwnerEvidence
  } catch {
    return null
  }
}

export async function researchOwnerOnPublicWeb(input: { rol: string; commune?: string | null }) {
  const rol = normalizeOwnerWebRol(input.rol)
  const commune = String(input.commune || "").trim()
  if (!rol || !commune || !process.env.SERPER_API_KEY || !process.env.OPENAI_API_KEY) {
    return { available: false, evidence: null as WebOwnerEvidence | null, attemptedQueries: 0 }
  }
  const runs = await Promise.all(queries(rol, commune).map(async (query) => {
    try { return await search(query) } catch { return [] as WebSearchResult[] }
  }))
  const candidates = unique(runs.flat())
    .filter((item) => webEvidenceMatchesTarget(`${item.title || ""} ${item.snippet || ""}`, rol, commune))
    .slice(0, 10)
  const evidence = candidates.length ? await extract(rol, commune, candidates) : null
  return { available: true, evidence, attemptedQueries: queries(rol, commune).length }
}
