export interface SiiAddressSearchInput {
  comuna: string
  calle: string
  numero?: string
}

export interface SiiRolInput {
  comuna: string
  manzana: string
  predio: string
}

export interface SiiRoleCandidate {
  rol: string
  comuna?: string
  comunaCodigo?: string
  manzana?: string
  predio?: string
  direccion?: string
  destino?: string
  coordinates?: {
    lat: number
    lng: number
  }
  source: "kmz" | "baseapi" | "manual" | "sii-public"
  confidence: number
  raw?: unknown
}

export interface SiiAvaluoRecord extends SiiRoleCandidate {
  avaluoTotal?: number
  avaluoAfecto?: number
  avaluoExento?: number
  superficieTerreno?: number
  superficieConstruida?: number
  areaHomogenea?: string
  periodo?: string
}

export interface SiiProvider {
  searchByAddress(input: SiiAddressSearchInput): Promise<SiiRoleCandidate[]>
  getByRol(input: SiiRolInput): Promise<SiiAvaluoRecord | null>
}

export function parseRolParts(rol: string): SiiRolInput | null {
  const clean = rol.trim().toUpperCase()
  const parts = clean.split("-").filter(Boolean)

  if (parts.length === 3) {
    return {
      comuna: parts[0],
      manzana: parts[1],
      predio: parts[2],
    }
  }

  if (parts.length === 2) {
    return {
      comuna: "",
      manzana: parts[0],
      predio: parts[1],
    }
  }

  return null
}

export function formatRol(parts: SiiRolInput): string {
  return [parts.comuna, parts.manzana, parts.predio].filter(Boolean).join("-")
}
