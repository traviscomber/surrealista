type CBRSource = "cbrs" | "conservadores-digitales" | "manual"

export interface CBRReference {
  label: string
  url: string
  verified: boolean
}

export interface CBRRoute {
  source: CBRSource
  conservatorName: string
  communeName: string
  communeCode?: string
  rol?: string
  supportsOnlineIndex: boolean
  supportsOnlineDomainRequest: boolean
  searchUrl: string
  domainUrl?: string
  notes: string[]
  references: CBRReference[]
}

export interface ResolveCBRInput {
  rol?: string
  comunaCode?: string
  comunaName?: string
}

type DirectDigitalRoute = {
  conservatorName: string
  searchUrl: string
  domainUrl: string
  references: CBRReference[]
}

const CBRS_INDEX_URL = "https://www.conservador.cl/portal/indice_propiedad"
const CBRS_DOMAIN_URL = "https://www.conservador.cl/portal/copia_dominio_vigente"
const CONSERVADORES_HOME_URL = "https://conservadoresdigitales.cl/"

const SANTIAGO_JURISDICTION_CODES = new Set([
  "13102",
  "13103",
  "13104",
  "13105",
  "13106",
  "13107",
  "13108",
  "13109",
  "13110",
  "13111",
  "13112",
  "13113",
  "13114",
  "13115",
  "13116",
  "13117",
  "13118",
  "13119",
  "13120",
  "13121",
  "13122",
  "13123",
  "13124",
  "13125",
  "13126",
  "13127",
  "13128",
  "13129",
  "13130",
  "13131",
  "13132",
  "13401",
  "13402",
  "13403",
  "13404",
  "13501",
  "13502",
  "13503",
  "13601",
  "13602",
  "13603",
  "13604",
  "13605",
  "13606",
])

const DIRECT_DIGITAL_ROUTES: Record<string, DirectDigitalRoute> = {
  SANTIAGO: {
    conservatorName: "Conservador de Bienes Raices de Santiago",
    searchUrl: CBRS_INDEX_URL,
    domainUrl: CBRS_DOMAIN_URL,
    references: [
      { label: "Indice del Registro de Propiedad", url: CBRS_INDEX_URL, verified: true },
      { label: "Copia con Vigencia o Dominio Vigente", url: CBRS_DOMAIN_URL, verified: true },
    ],
  },
  QUELLON: {
    conservatorName: "Conservador de Bienes Raices de Quellon",
    searchUrl: "https://conservadoresdigitales.cl/conservador/quellon/consultas-en-linea/indice-de-propiedad",
    domainUrl: "https://conservadoresdigitales.cl/conservador/quellon/tramites-en-linea",
    references: [
      {
        label: "Tramites en linea Quellon",
        url: "https://conservadoresdigitales.cl/conservador/quellon/tramites-en-linea",
        verified: true,
      },
      {
        label: "Jurisdiccion Quellon",
        url: "https://conservadoresdigitales.cl/conservador/quellon/informacion/jurisdiccion",
        verified: true,
      },
    ],
  },
}

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toUpperCase()
}

function communeFromRol(rol?: string) {
  const parts = (rol || "").split("-")
  return parts.length >= 3 ? parts[0].trim() : undefined
}

function buildGenericDigitalRoute(communeName: string, communeCode?: string, rol?: string): CBRRoute {
  return {
    source: "conservadores-digitales",
    conservatorName: `Conservadores Digitales / CBR por comuna`,
    communeName,
    communeCode,
    rol,
    supportsOnlineIndex: false,
    supportsOnlineDomainRequest: false,
    searchUrl: CONSERVADORES_HOME_URL,
    notes: [
      `Buscar la comuna ${communeName} dentro de Conservadores Digitales.`,
      "El dueño o la sociedad se acredita con dominio vigente o copia con vigencia del CBR, no con el certificado de avaluo del SII.",
      "Si el CBR de la comuna no esta digitalizado, se requiere tramite manual o en el portal propio del conservador.",
    ],
    references: [
      {
        label: "Conservadores Digitales",
        url: CONSERVADORES_HOME_URL,
        verified: true,
      },
    ],
  }
}

export class CBRService {
  resolveRoute(input: ResolveCBRInput): CBRRoute {
    const comunaCode = input.comunaCode || communeFromRol(input.rol)
    const comunaName = normalizeText(input.comunaName) || comunaCode || "COMUNA"

    if (comunaCode && SANTIAGO_JURISDICTION_CODES.has(comunaCode)) {
      return {
        source: "cbrs",
        conservatorName: "Conservador de Bienes Raices de Santiago",
        communeName: comunaName,
        communeCode: comunaCode,
        rol: input.rol,
        supportsOnlineIndex: true,
        supportsOnlineDomainRequest: true,
        searchUrl: CBRS_INDEX_URL,
        domainUrl: CBRS_DOMAIN_URL,
        notes: [
          "El indice de propiedad del CBRS permite buscar por apellidos, comuna y ano de inscripcion.",
          "El dominio vigente del CBRS acredita quien es el dueno; normalmente requiere fojas, numero y ano para pedir el documento.",
        ],
        references: [
          { label: "Indice del Registro de Propiedad", url: CBRS_INDEX_URL, verified: true },
          { label: "Copia con Vigencia o Dominio Vigente", url: CBRS_DOMAIN_URL, verified: true },
        ],
      }
    }

    const direct = DIRECT_DIGITAL_ROUTES[comunaName]
    if (direct) {
      return {
        source: comunaName === "SANTIAGO" ? "cbrs" : "conservadores-digitales",
        conservatorName: direct.conservatorName,
        communeName: comunaName,
        communeCode: comunaCode,
        rol: input.rol,
        supportsOnlineIndex: true,
        supportsOnlineDomainRequest: true,
        searchUrl: direct.searchUrl,
        domainUrl: direct.domainUrl,
        notes: [
          `Existe un portal digital identificado para ${direct.conservatorName}.`,
          "El flujo formal sigue siendo indice de propiedad -> fojas/numero/ano -> dominio vigente o copia con vigencia.",
        ],
        references: direct.references,
      }
    }

    return buildGenericDigitalRoute(comunaName, comunaCode, input.rol)
  }
}

export const cbrService = new CBRService()
