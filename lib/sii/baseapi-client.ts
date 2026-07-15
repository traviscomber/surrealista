import type { SiiAddressSearchInput, SiiAvaluoRecord, SiiProvider, SiiRolInput, SiiRoleCandidate } from "./types"
import { formatRol } from "./types"

const DEFAULT_BASEAPI_URL = "https://api.baseapi.cl/api/v1"

type BaseApiClientOptions = {
  apiKey?: string
  baseUrl?: string
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return undefined

  const parsed = Number(value.replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : undefined
}

function getText(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

function getNestedNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    const parsed = getNumber(value)
    if (parsed !== undefined) return parsed
  }

  return undefined
}

function pickPayload(json: unknown): unknown {
  if (!json || typeof json !== "object") return json
  const record = json as Record<string, unknown>

  return record.data ?? record.result ?? record.results ?? record.predios ?? record
}

function toArrayPayload(json: unknown): Record<string, unknown>[] {
  const payload = pickPayload(json)
  if (Array.isArray(payload)) return payload.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    for (const key of ["items", "predios", "roles", "results", "data"]) {
      const value = record[key]
      if (Array.isArray(value)) {
        return value.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
      }
    }
  }

  return []
}

function buildCandidate(record: Record<string, unknown>, fallbackComuna?: string): SiiRoleCandidate | null {
  const comuna = getText(record, ["comuna", "comuna_nombre", "nombre_comuna"]) || fallbackComuna
  const comunaCodigo = getText(record, ["comuna_codigo", "codigo_comuna", "comunaCode", "comuna"])
  const manzana = getText(record, ["manzana", "rol_manzana", "mza"])
  const predio = getText(record, ["predio", "rol_predio", "prd"])
  const rawRol = getText(record, ["rol", "rol_predial", "rolPredial", "rol_avaluo", "rolAvaluo"])
  const rol = rawRol || (manzana && predio ? [comunaCodigo, manzana, predio].filter(Boolean).join("-") : undefined)

  if (!rol) return null

  const lat = getNestedNumber(record, ["lat", "latitude", "latitud"])
  const lng = getNestedNumber(record, ["lng", "lon", "longitude", "longitud"])

  return {
    rol,
    comuna,
    comunaCodigo,
    manzana,
    predio,
    direccion: getText(record, ["direccion", "direccion_predial", "address"]),
    destino: getText(record, ["destino", "uso", "tipo_destino"]),
    coordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    source: "baseapi",
    confidence: 0.9,
    raw: record,
  }
}

function buildAvaluo(record: Record<string, unknown>, input: SiiRolInput): SiiAvaluoRecord {
  const candidate =
    buildCandidate(record, input.comuna) ||
    ({
      rol: formatRol(input),
      comunaCodigo: input.comuna,
      manzana: input.manzana,
      predio: input.predio,
      source: "baseapi",
      confidence: 0.85,
      raw: record,
    } satisfies SiiRoleCandidate)

  return {
    ...candidate,
    avaluoTotal: getNestedNumber(record, ["avaluo_total", "avaluoTotal", "avaluo"]),
    avaluoAfecto: getNestedNumber(record, ["avaluo_afecto", "avaluoAfecto"]),
    avaluoExento: getNestedNumber(record, ["avaluo_exento", "avaluoExento"]),
    superficieTerreno: getNestedNumber(record, ["superficie_terreno", "superficieTerreno", "terreno_m2"]),
    superficieConstruida: getNestedNumber(record, ["superficie_construida", "superficieConstruida", "construido_m2"]),
    areaHomogenea: getText(record, ["area_homogenea", "areaHomogenea", "ah"]),
    periodo: getText(record, ["periodo", "reavaluo", "periodo_avaluo"]),
  }
}

export class BaseApiSiiProvider implements SiiProvider {
  private readonly apiKey?: string
  private readonly baseUrl: string

  constructor(options: BaseApiClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.BASEAPI_API_KEY
    this.baseUrl = (options.baseUrl || process.env.BASEAPI_BASE_URL || DEFAULT_BASEAPI_URL).replace(/\/$/, "")
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  async searchByAddress(input: SiiAddressSearchInput): Promise<SiiRoleCandidate[]> {
    if (!this.apiKey) {
      return []
    }

    const url = new URL(`${this.baseUrl}/sii/avaluo/buscar`)
    url.searchParams.set("comuna", input.comuna)
    url.searchParams.set("calle", input.calle)
    if (input.numero) url.searchParams.set("numero", input.numero)

    const response = await fetch(url, {
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`BaseAPI address lookup failed: ${response.status}`)
    }

    const json = await response.json()
    return toArrayPayload(json)
      .map((record) => buildCandidate(record, input.comuna))
      .filter((candidate): candidate is SiiRoleCandidate => Boolean(candidate))
  }

  async getByRol(input: SiiRolInput): Promise<SiiAvaluoRecord | null> {
    if (!this.apiKey) {
      return null
    }

    const url = `${this.baseUrl}/sii/avaluo/predio/${encodeURIComponent(input.comuna)}/${encodeURIComponent(input.manzana)}/${encodeURIComponent(input.predio)}`
    const response = await fetch(url, {
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`BaseAPI rol lookup failed: ${response.status}`)
    }

    const json = await response.json()
    const payload = pickPayload(json)
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null
    }

    return buildAvaluo(payload as Record<string, unknown>, input)
  }
}
