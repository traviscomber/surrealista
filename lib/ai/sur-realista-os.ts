import type { SupabaseClient } from "@supabase/supabase-js"

export type SRDomain = "campos" | "clientes" | "multimedia" | "documentos" | "mercado"
export type SRMode = "fasttrack" | "fullagentic"

export type SRPlan = {
  mode: SRMode
  domains: SRDomain[]
  intent: "lookup" | "analysis" | "report" | "comparison" | "general"
  searchTerms: string[]
}

export type SREvidence = {
  source: string
  domain: SRDomain | "tareas"
  records: any[]
  error?: string
}

const DOMAIN_KEYWORDS: Record<SRDomain, string[]> = {
  campos: ["campo", "campos", "fundo", "fundos", "predio", "predios", "kmz", "kml", "rol", "roles", "territorio", "territorial", "parcela", "parcelas", "sii", "ciren"],
  clientes: ["cliente", "clientes", "empresa", "empresas", "contacto", "contactos", "comprador", "compradores", "inversionista", "inversionistas"],
  multimedia: ["multimedia", "redes", "social", "posteos", "post", "instagram", "facebook", "linkedin", "contenido", "campana", "campaña", "comunicacion", "comunicaciones"],
  documentos: ["documento", "documentos", "informe", "informes", "reporte", "reportes", "pdf", "archivo", "archivos", "contrato", "evidencia", "documental"],
  mercado: ["mercado", "propiedad", "propiedades", "comparable", "comparables", "precio", "precios", "venta", "arriendo", "prospeccion", "prospección", "oportunidad", "oportunidades"],
}

const STOPWORDS = new Set([
  "dame", "hazme", "hacer", "puedes", "podrias", "podrías", "quiero", "necesito", "sobre", "para", "este", "esta", "estos", "estas",
  "cliente", "clientes", "campo", "campos", "documento", "documentos", "mercado", "propiedad", "propiedades", "informe", "reporte", "datos",
  "tiene", "tienen", "cual", "cuál", "cuales", "cuáles", "como", "cómo", "donde", "dónde", "todo", "toda", "todos", "todas", "informacion", "información",
])

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function extractSearchTerms(message: string) {
  const quoted = [...message.matchAll(/[“"']([^”"']{2,80})[”"']/g)].map((match) => match[1].trim())
  const words = message
    .replace(/[^\p{L}\p{N}@._+'-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(normalize(word)))
    .sort((a, b) => b.length - a.length)

  return [...new Set([...quoted, ...words])].slice(0, 6)
}

export function buildSRPlan(message: string): SRPlan {
  const normalized = normalize(message)
  const domains = (Object.entries(DOMAIN_KEYWORDS) as Array<[SRDomain, string[]]>)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(normalize(keyword))))
    .map(([domain]) => domain)

  let intent: SRPlan["intent"] = "general"
  if (/informe|reporte|report|prepara|preparar|genera|generar/.test(normalized)) intent = "report"
  else if (/compara|comparar|comparables|versus| vs /.test(normalized)) intent = "comparison"
  else if (/analiza|analizar|analisis|análisis|evalua|evaluar/.test(normalized)) intent = "analysis"
  else if (domains.length > 0) intent = "lookup"

  const crossModuleLanguage = /cruza|cruzar|relaciona|relacionar|combina|combinar|informe|reporte|compara|comparar|cliente.*campo|campo.*cliente/.test(normalized)
  const mode: SRMode = domains.length > 1 || crossModuleLanguage ? "fullagentic" : "fasttrack"

  return {
    mode,
    domains: domains.length ? domains : ["campos", "clientes", "documentos", "mercado"],
    intent,
    searchTerms: extractSearchTerms(message),
  }
}

function bestTerm(plan: SRPlan, message: string) {
  return plan.searchTerms[0] || message.trim().slice(0, 80)
}

async function safeEvidence(domain: SREvidence["domain"], source: string, run: () => Promise<{ data: any[] | null; error: any }>): Promise<SREvidence> {
  try {
    const { data, error } = await run()
    if (error) return { source, domain, records: [], error: error.message || String(error) }
    return { source, domain, records: data || [] }
  } catch (error) {
    return { source, domain, records: [], error: error instanceof Error ? error.message : String(error) }
  }
}

export async function collectSREvidence(
  supabase: SupabaseClient,
  plan: SRPlan,
  message: string,
): Promise<SREvidence[]> {
  const term = bestTerm(plan, message)
  const pattern = `%${term.replace(/[%(),]/g, " ")}%`
  const evidence: Promise<SREvidence>[] = []

  if (plan.domains.includes("clientes")) {
    evidence.push(safeEvidence("clientes", "clients", async () =>
      supabase
        .from("clients")
        .select("id, first_name, last_name, email, phone, company_name, status, main_interest, client_type, region, comuna")
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company_name.ilike.${pattern},main_interest.ilike.${pattern}`)
        .limit(12),
    ))
  }

  if (plan.domains.includes("campos")) {
    const rol = message.match(/\b\d{1,6}-\d{1,6}\b/)?.[0]
    evidence.push(safeEvidence("campos", "kmz_collection", async () => {
      let query = supabase
        .from("kmz_collection")
        .select("id, file_name, region, description, placemarks_count, category, owner, rol_numbers, updated_at")
        .eq("is_active", true)
        .limit(12)

      if (rol) return query.contains("rol_numbers", [rol])
      return query.or(`file_name.ilike.${pattern},description.ilike.${pattern},region.ilike.${pattern},owner.ilike.${pattern}`)
    }))
  }

  if (plan.domains.includes("documentos")) {
    evidence.push(safeEvidence("documentos", "documents", async () =>
      supabase
        .from("documents")
        .select("id, title, description, document_type, status, file_name, updated_at")
        .or(`title.ilike.${pattern},description.ilike.${pattern},file_name.ilike.${pattern}`)
        .limit(12),
    ))
  }

  if (plan.domains.includes("mercado")) {
    evidence.push(safeEvidence("mercado", "properties_external", async () =>
      supabase
        .from("properties_external")
        .select("id, title, location, address, city, commune, region, price, price_clp, price_uf, area_m2, property_type, source, source_url, scraped_at")
        .eq("is_active", true)
        .or(`title.ilike.${pattern},location.ilike.${pattern},address.ilike.${pattern},city.ilike.${pattern},commune.ilike.${pattern},region.ilike.${pattern},description.ilike.${pattern},property_type.ilike.${pattern}`)
        .order("scraped_at", { ascending: false })
        .limit(12),
    ))
  }

  if (plan.domains.includes("multimedia")) {
    evidence.push(safeEvidence("multimedia", "client_communications", async () =>
      supabase
        .from("client_communications")
        .select("id, client_id, communication_type, subject, status, created_at")
        .or(`subject.ilike.${pattern},communication_type.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(12),
    ))
  }

  if (/tarea|tareas|pendiente|seguimiento/i.test(message)) {
    evidence.push(safeEvidence("tareas", "tasks", async () =>
      supabase
        .from("tasks")
        .select("id, title, description, status, priority, location, due_date, client_id")
        .or(`title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`)
        .limit(12),
    ))
  }

  return Promise.all(evidence)
}

export function evidenceSummary(evidence: SREvidence[]) {
  const successful = evidence.filter((item) => !item.error)
  const recordCount = successful.reduce((sum, item) => sum + item.records.length, 0)
  const failures = evidence.filter((item) => item.error)

  return {
    recordCount,
    sources: successful.map((item) => item.source),
    failedSources: failures.map((item) => item.source),
    confidence: recordCount > 8 ? 0.9 : recordCount > 3 ? 0.78 : recordCount > 0 ? 0.64 : 0.35,
  }
}
