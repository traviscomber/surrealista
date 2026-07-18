export type PublicOwnerLeadSource =
  | "web-search"
  | "sea-search"
  | "municipal-transparency"
  | "cbr-route"
  | "company-name-search"

export interface PublicOwnerResearchInput {
  kmzId?: string
  fileName: string
  region?: string | null
  roles?: string[] | null
  ownerCandidate?: {
    owner?: string | null
    ownerName?: string | null
    companyName?: string | null
    confidence?: string | null
    sourceType?: string | null
    evidenceText?: string | null
  } | null
  siiRecord?: {
    comuna?: string | null
    comunaCodigo?: string | null
    direccion?: string | null
    destino?: string | null
  } | null
}

export interface PublicOwnerResearchLead {
  sourceType: PublicOwnerLeadSource
  label: string
  query: string
  url: string
  confidence: "candidate" | "probable"
  reason: string
  kmzId?: string
  role?: string | null
  ownerCandidate?: string | null
  generatedAt: string
}

const GOOGLE_SEARCH_URL = "https://www.google.com/search?q="
const CONSERVADORES_URL = "https://conservadoresdigitales.cl/"
const CBRS_DOMAIN_URL = "https://www.conservador.cl/portal/copia_dominio_vigente"

function normalizeText(value?: string | null) {
  return `${value || ""}`.replace(/\.kmz$/i, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)))
}

function searchUrl(query: string) {
  return `${GOOGLE_SEARCH_URL}${encodeURIComponent(query)}`
}

function getPrimaryRole(roles?: string[] | null) {
  return roles?.map((role) => normalizeText(role).toUpperCase()).find(Boolean) || null
}

function getOwnerCandidateLabel(input: PublicOwnerResearchInput) {
  const candidate = input.ownerCandidate
  return normalizeText(candidate?.companyName || candidate?.owner || candidate?.ownerName || null) || null
}

function getLocationTerms(input: PublicOwnerResearchInput) {
  return uniqueValues([input.region, input.siiRecord?.comuna, input.siiRecord?.direccion])
}

function buildLead(
  input: PublicOwnerResearchInput,
  sourceType: PublicOwnerLeadSource,
  label: string,
  query: string,
  reason: string,
  confidence: "candidate" | "probable" = "candidate",
  url = searchUrl(query),
): PublicOwnerResearchLead {
  return {
    sourceType,
    label,
    query,
    url,
    confidence,
    reason,
    kmzId: input.kmzId,
    role: getPrimaryRole(input.roles),
    ownerCandidate: getOwnerCandidateLabel(input),
    generatedAt: new Date().toISOString(),
  }
}

export function buildPublicOwnerResearchLeads(input: PublicOwnerResearchInput): PublicOwnerResearchLead[] {
  const fileName = normalizeText(input.fileName)
  const role = getPrimaryRole(input.roles)
  const ownerCandidate = getOwnerCandidateLabel(input)
  const locationTerms = getLocationTerms(input)
  const comuna = normalizeText(input.siiRecord?.comuna)
  const direccion = normalizeText(input.siiRecord?.direccion)
  const leads: PublicOwnerResearchLead[] = []

  if (role) {
    leads.push(
      buildLead(
        input,
        "web-search",
        "Rol exacto + sociedad",
        `"${role}" sociedad OR limitada OR spa OR agricola OR forestal`,
        "Busca documentos publicos donde el rol aparece asociado a una sociedad o persona.",
      ),
    )

    leads.push(
      buildLead(
        input,
        "web-search",
        "Rol exacto + propietario",
        `"${role}" propietario OR dueno OR titular`,
        "Busca referencias publicas que nombren propietario, dueno o titular para el rol.",
      ),
    )

    if (fileName) {
      leads.push(
        buildLead(
          input,
          "web-search",
          "Rol + nombre del KMZ",
          `"${role}" "${fileName}"`,
          "Cruza el rol con el nombre operacional del campo o fundo.",
        ),
      )
    }

    for (const location of locationTerms.slice(0, 2)) {
      leads.push(
        buildLead(
          input,
          "municipal-transparency",
          `Rol + ${location}`,
          `"${role}" "${location}" filetype:pdf`,
          "Prioriza PDFs municipales, patentes, decretos o transparencia activa por rol y ubicacion.",
        ),
      )
    }
  }

  if (ownerCandidate) {
    leads.push(
      buildLead(
        input,
        "company-name-search",
        "Candidato extraido del KMZ",
        `"${ownerCandidate}" "${fileName}"`,
        "Valida si el nombre extraido del KMZ aparece relacionado con el campo.",
        "probable",
      ),
    )

    if (comuna) {
      leads.push(
        buildLead(
          input,
          "company-name-search",
          "Candidato + comuna",
          `"${ownerCandidate}" "${comuna}" fundo OR predio OR parcela`,
          "Busca relacion entre candidato, comuna y vocabulario rural.",
          "probable",
        ),
      )
    }
  }

  if (fileName) {
    const seaQuery = `site:sea.gob.cl OR site:pertinencia.sea.gob.cl "${fileName}" titular OR propietario OR sociedad`
    leads.push(
      buildLead(
        input,
        "sea-search",
        "SEA / pertinencias por campo",
        seaQuery,
        "SEA y pertinencias ambientales suelen listar titulares o sociedades asociadas a predios rurales.",
        "candidate",
        searchUrl(seaQuery),
      ),
    )
  }

  if (direccion || comuna || role) {
    leads.push(
      buildLead(
        input,
        "cbr-route",
        "Confirmacion CBR / dominio vigente",
        uniqueValues([role, comuna, direccion]).join(" "),
        "El dominio vigente del Conservador es la fuente para confirmar dueno actual.",
        "probable",
        comuna?.toUpperCase().includes("SANTIAGO") ? CBRS_DOMAIN_URL : CONSERVADORES_URL,
      ),
    )
  }

  const seen = new Set<string>()
  return leads.filter((lead) => {
    const key = `${lead.sourceType}|${lead.query}|${lead.url}`.toUpperCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function summarizePublicOwnerLeads(leads: PublicOwnerResearchLead[]) {
  return {
    total: leads.length,
    bySource: leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.sourceType] = (acc[lead.sourceType] || 0) + 1
      return acc
    }, {}),
    probable: leads.filter((lead) => lead.confidence === "probable").length,
  }
}
