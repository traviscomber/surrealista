import { randomUUID } from "crypto"
import type { SiiAddressSearchInput, SiiAvaluoRecord, SiiProvider, SiiRolInput, SiiRoleCandidate } from "./types"
import { formatRol } from "./types"

const DEFAULT_SII_MAPAS_URL = "https://www4.sii.cl/mapasui/services/data/mapasFacadeService"
const REFERER = "https://www4.sii.cl/mapasui/internet/"

type SiiMapasEnvelope<T> = {
  data?: T
  metaData?: {
    errors?: Array<{ descripcion?: string }>
  }
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
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }

  return undefined
}

function makeEnvelope(namespace: string, data: unknown) {
  return {
    metaData: {
      namespace,
      conversationId: randomUUID(),
      transactionId: randomUUID(),
      page: null,
    },
    data,
  }
}

function buildCandidate(record: Record<string, unknown>, fallbackComuna?: string): SiiRoleCandidate | null {
  const comunaCodigo = getText(record, ["comuna", "comunaCnp", "codigoComuna"]) || fallbackComuna
  const manzana = getText(record, ["manzana", "manzanaCnp"])
  const predio = getText(record, ["predio", "predioCnp"])
  const rawRol = getText(record, ["rol"])
  const rol = comunaCodigo && manzana && predio ? formatRol({ comuna: comunaCodigo, manzana, predio }) : rawRol

  if (!rol) return null

  const lat = getNumber(record.ubicacionX)
  const lng = getNumber(record.ubicacionY)

  return {
    rol,
    comuna: getText(record, ["nombreComuna"]),
    comunaCodigo,
    manzana,
    predio,
    direccion: getText(record, ["direccion"]),
    destino: getText(record, ["destinoDescripcion"]),
    coordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    source: "sii-public",
    confidence: 0.92,
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
      source: "sii-public",
      confidence: 0.85,
      raw: record,
    } satisfies SiiRoleCandidate)

  return {
    ...candidate,
    avaluoTotal: getNumber(record.valorTotal),
    avaluoAfecto: getNumber(record.valorAfecto),
    avaluoExento: getNumber(record.valorExento),
    superficieTerreno: getNumber(record.supTerreno),
    superficieConstruida: getNumber(record.supConsMt2),
    areaHomogenea: getText(record, ["ah"]),
    periodo: getText(record, ["periodo"]),
  }
}

export class SiiMapasPublicProvider implements SiiProvider {
  private readonly baseUrl: string

  constructor(baseUrl = process.env.SII_MAPAS_BASE_URL || DEFAULT_SII_MAPAS_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  async searchByAddress(input: SiiAddressSearchInput): Promise<SiiRoleCandidate[]> {
    const data = await this.post<Record<string, unknown>[]>("getPrediosDireccion", {
      rolDireccion: {
        comuna: input.comuna,
        nombreComuna: input.comuna,
        calle: input.calle,
        numeroCalleStr: input.numero || null,
        detalle: 0,
        numeroDetalleStr: null,
        lugar: null,
      },
      servicios: [],
      tokenARSII: null,
    })

    return (Array.isArray(data) ? data : [])
      .map((record) => buildCandidate(record, input.comuna))
      .filter((candidate): candidate is SiiRoleCandidate => Boolean(candidate))
  }

  async getByRol(input: SiiRolInput): Promise<SiiAvaluoRecord | null> {
    const data = await this.post<Record<string, unknown> | null>("getPredioNacional", {
      predio: {
        comuna: input.comuna,
        manzana: input.manzana,
        predio: input.predio,
      },
      servicios: [],
      tokenARSII: null,
    })

    if (!data || typeof data !== "object") return null

    return buildAvaluo(data, input)
  }

  private async post<T>(operation: string, data: unknown): Promise<T> {
    const namespace = `cl.sii.sdi.lob.bbrr.mapas.data.api.interfaces.MapasFacadeService/${operation}`
    const response = await fetch(`${this.baseUrl}/${operation}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: "https://www4.sii.cl",
        Referer: REFERER,
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify(makeEnvelope(namespace, data)),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`SII Mapas ${operation} failed: ${response.status}`)
    }

    const envelope = (await response.json()) as SiiMapasEnvelope<T>
    const errors = envelope.metaData?.errors?.map((error) => error.descripcion).filter(Boolean)
    if (errors?.length) {
      throw new Error(`SII Mapas ${operation} failed: ${errors.join("; ")}`)
    }

    return envelope.data as T
  }
}
