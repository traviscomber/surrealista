import type { NeighborRoleCandidate, NeighborRoleOptions } from "@/lib/owners/neighbor-roles"
import { buildNeighborRolesForRoles } from "@/lib/owners/neighbor-roles"

export type NeighborContactLeadSource =
  | "internal-kmz-match"
  | "web-search"
  | "company-name-search"
  | "municipal-transparency"
  | "sea-search"
  | "cbr-route"

export interface NeighborContactResearchInput {
  kmzId?: string
  fileName: string
  region?: string | null
  roles?: string[] | null
  siiRecord?: {
    comuna?: string | null
    direccion?: string | null
  } | null
  knownNeighborRoles?: Record<string, KnownNeighborRoleInfo>
  options?: NeighborRoleOptions
}

export interface KnownNeighborRoleInfo {
  kmzIds?: string[]
  fileNames?: string[]
  owner?: string | null
  region?: string | null
  ownerCandidate?: string | null
  googleDocsLink?: string | null
}

export interface NeighborContactLead {
  sourceType: NeighborContactLeadSource
  label: string
  query: string
  url: string
  confidence: "candidate" | "probable"
  reason: string
  kmzId?: string
  baseRol: string
  rol: string
  relation: NeighborRoleCandidate["relation"]
  predioDistance: number
  manzanaDistance: number
  distanceScore: number
  contactSignals: {
    companyName?: string | null
    ownerCandidate?: string | null
    website?: string | null
    email?: string | null
    phone?: string | null
    googleDocsLink?: string | null
    internalKmzIds?: string[]
    internalFileNames?: string[]
  }
  generatedAt: string
}

const GOOGLE_SEARCH_URL = "https://www.google.com/search?q="
const CONSERVADORES_URL = "https://conservadoresdigitales.cl/"
const CBRS_DOMAIN_URL = "https://www.conservador.cl/portal/copia_dominio_vigente"

function normalizeText(value?: string | null) {
  return `${value || ""}`.replace(/\.kmz$/i, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
}

function searchUrl(query: string) {
  return `${GOOGLE_SEARCH_URL}${encodeURIComponent(query)}`
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))
}

function getLocationTerms(input: NeighborContactResearchInput) {
  return uniqueValues([input.region, input.siiRecord?.comuna, input.siiRecord?.direccion]).slice(0, 2)
}

function buildLead(
  input: NeighborContactResearchInput,
  neighbor: NeighborRoleCandidate,
  sourceType: NeighborContactLeadSource,
  label: string,
  query: string,
  reason: string,
  confidence: "candidate" | "probable" = "candidate",
  contactSignals: NeighborContactLead["contactSignals"] = {},
  url = searchUrl(query),
): NeighborContactLead {
  return {
    sourceType,
    label,
    query,
    url,
    confidence,
    reason,
    kmzId: input.kmzId,
    baseRol: neighbor.baseRol,
    rol: neighbor.rol,
    relation: neighbor.relation,
    predioDistance: neighbor.predioDistance,
    manzanaDistance: neighbor.manzanaDistance,
    distanceScore: neighbor.distanceScore,
    contactSignals,
    generatedAt: new Date().toISOString(),
  }
}

function getKnownRoleLabel(known: KnownNeighborRoleInfo) {
  return normalizeText(known.owner || known.ownerCandidate || known.fileNames?.[0] || null) || null
}

export function buildNeighborContactLeads(input: NeighborContactResearchInput): NeighborContactLead[] {
  const fileName = normalizeText(input.fileName)
  const locationTerms = getLocationTerms(input)
  const neighbors = buildNeighborRolesForRoles(input.roles, input.options)
  const leads: NeighborContactLead[] = []

  for (const neighbor of neighbors) {
    const known = input.knownNeighborRoles?.[neighbor.rol]
    const knownLabel = known ? getKnownRoleLabel(known) : null

    if (known) {
      leads.push(
        buildLead(
          input,
          neighbor,
          "internal-kmz-match",
          "Rol vecino ya existe en Campos",
          `"${neighbor.rol}" "${knownLabel || neighbor.rol}"`,
          "El rol vecino ya aparece en otros KMZ internos; puede indicar paño, sociedad o contacto relacionado.",
          "probable",
          {
            companyName: known.owner || null,
            ownerCandidate: known.ownerCandidate || null,
            googleDocsLink: known.googleDocsLink || null,
            internalKmzIds: known.kmzIds || [],
            internalFileNames: known.fileNames || [],
          },
        ),
      )
    }

    leads.push(
      buildLead(
        input,
        neighbor,
        "web-search",
        "Rol vecino + contacto",
        `"${neighbor.rol}" contacto OR email OR telefono OR sitio`,
        "Busca informacion publica de contacto asociada al rol vecino sin asumir que es el dueno del KMZ base.",
      ),
    )

    leads.push(
      buildLead(
        input,
        neighbor,
        "company-name-search",
        "Rol vecino + sociedad",
        `"${neighbor.rol}" sociedad OR limitada OR spa OR agricola OR forestal`,
        "Prioriza sociedades y empresas vecinas, que son mejores leads comerciales que personas naturales.",
      ),
    )

    if (fileName) {
      leads.push(
        buildLead(
          input,
          neighbor,
          "web-search",
          "Rol vecino + nombre campo",
          `"${neighbor.rol}" "${fileName}"`,
          "Cruza el rol vecino con el nombre operacional del campo para encontrar paños relacionados.",
        ),
      )
    }

    for (const location of locationTerms) {
      leads.push(
        buildLead(
          input,
          neighbor,
          "municipal-transparency",
          `Rol vecino + ${location}`,
          `"${neighbor.rol}" "${location}" filetype:pdf`,
          "Busca PDFs municipales, patentes, permisos o transparencia activa asociados a roles vecinos.",
        ),
      )
    }

    const seaQuery = `site:sea.gob.cl OR site:pertinencia.sea.gob.cl "${neighbor.rol}" titular OR sociedad OR propietario`
    leads.push(
      buildLead(
        input,
        neighbor,
        "sea-search",
        "SEA / pertinencias por rol vecino",
        seaQuery,
        "SEA y pertinencias ambientales pueden listar titulares o contactos de proyectos cercanos.",
        "candidate",
        {},
        searchUrl(seaQuery),
      ),
    )

    leads.push(
      buildLead(
        input,
        neighbor,
        "cbr-route",
        "Confirmacion CBR rol vecino",
        neighbor.rol,
        "El dominio vigente del Conservador ayuda a confirmar relaciones prediales antes de contactar.",
        "probable",
        {},
        input.siiRecord?.comuna?.toUpperCase().includes("SANTIAGO") ? CBRS_DOMAIN_URL : CONSERVADORES_URL,
      ),
    )
  }

  const seen = new Set<string>()
  return leads.filter((lead) => {
    const key = `${lead.sourceType}|${lead.rol}|${lead.query}|${lead.url}`.toUpperCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function summarizeNeighborContactLeads(leads: NeighborContactLead[]) {
  const uniqueRoles = new Set(leads.map((lead) => lead.rol))
  return {
    total: leads.length,
    uniqueNeighborRoles: uniqueRoles.size,
    bySource: leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.sourceType] = (acc[lead.sourceType] || 0) + 1
      return acc
    }, {}),
    probable: leads.filter((lead) => lead.confidence === "probable").length,
    internalMatches: leads.filter((lead) => lead.sourceType === "internal-kmz-match").length,
  }
}
