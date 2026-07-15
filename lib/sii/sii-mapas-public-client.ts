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

  const normalized = value.trim()
  if (!normalized) return undefined

  const withoutSpaces = normalized.replace(/\s+/g, "")
  const decimalNormalized = withoutSpaces.includes(",") && !withoutSpaces.includes(".")
    ? withoutSpaces.replace(",", ".")
    : withoutSpaces.replace(/,/g, "")

  const parsed = Number(decimalNormalized)
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

  const coordinateInfo = extractCoordinateInfo(record)

  return {
    rol,
    comuna: getText(record, ["nombreComuna"]),
    comunaCodigo,
    manzana,
    predio,
    direccion: getText(record, ["direccion"]),
    destino: getText(record, ["destinoDescripcion"]),
    coordinates: coordinateInfo?.coordinates,
    coordinateSource: coordinateInfo?.source,
    source: "sii-public",
    confidence: 0.92,
    raw: record,
  }
}

type CoordinateInfo = {
  coordinates: { lat: number; lng: number }
  source: "direct" | "projected-ah" | "projected-csa"
}

function utmToLatLng(easting: number, northing: number, zone: number): { lat: number; lng: number } {
  const a = 6378137
  const eccSquared = 0.00669438
  const k0 = 0.9996
  const eccPrimeSquared = eccSquared / (1 - eccSquared)

  const x = easting - 500000
  const y = northing - 10000000
  const longOrigin = (zone - 1) * 6 - 180 + 3
  const M = y / k0
  const mu =
    M /
    (a *
      (1 -
        eccSquared / 4 -
        (3 * eccSquared * eccSquared) / 64 -
        (5 * eccSquared * eccSquared * eccSquared) / 256))

  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared))
  const j1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32
  const j2 = (21 * e1 * e1) / 16 - (55 * Math.pow(e1, 4)) / 32
  const j3 = (151 * Math.pow(e1, 3)) / 96
  const j4 = (1097 * Math.pow(e1, 4)) / 512
  const fp =
    mu +
    j1 * Math.sin(2 * mu) +
    j2 * Math.sin(4 * mu) +
    j3 * Math.sin(6 * mu) +
    j4 * Math.sin(8 * mu)

  const sinFp = Math.sin(fp)
  const cosFp = Math.cos(fp)
  const tanFp = Math.tan(fp)
  const C1 = eccPrimeSquared * cosFp * cosFp
  const T1 = tanFp * tanFp
  const N1 = a / Math.sqrt(1 - eccSquared * sinFp * sinFp)
  const R1 = (a * (1 - eccSquared)) / Math.pow(1 - eccSquared * sinFp * sinFp, 1.5)
  const D = x / (N1 * k0)

  const lat =
    fp -
    (N1 * tanFp * (D * D / 2 -
      ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * Math.pow(D, 4)) / 24 +
      ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * Math.pow(D, 6)) /
        720)) /
      R1

  const lng =
    (D -
      ((1 + 2 * T1 + C1) * Math.pow(D, 3)) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * Math.pow(D, 5)) / 120) /
    cosFp

  return {
    lat: (lat * 180) / Math.PI,
    lng: longOrigin + (lng * 180) / Math.PI,
  }
}

function isValidLatLng(lat: number | undefined, lng: number | undefined) {
  return lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

function isProjectedCoordinatePair(x: number | undefined, y: number | undefined) {
  return (
    x !== undefined &&
    y !== undefined &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 100000 &&
    x <= 900000 &&
    y >= 1000000 &&
    y <= 10000000
  )
}

function extractProjectedCoordinateInfo(record: Record<string, unknown>): CoordinateInfo | undefined {
  const ahRecord = Array.isArray(record.datosAh) ? record.datosAh[0] : record.datosAh
  if (ahRecord && typeof ahRecord === "object") {
    const x = getNumber((ahRecord as Record<string, unknown>).ubicacionX)
    const y = getNumber((ahRecord as Record<string, unknown>).ubicacionY)
    if (isProjectedCoordinatePair(x, y)) {
      return {
        coordinates: utmToLatLng(x!, y!, 19),
        source: "projected-ah",
      }
    }
  }

  const csaRecord = Array.isArray(record.datosCsa) ? record.datosCsa[0] : record.datosCsa
  if (csaRecord && typeof csaRecord === "object") {
    const x = getNumber((csaRecord as Record<string, unknown>).ubicacionX)
    const y = getNumber((csaRecord as Record<string, unknown>).ubicacionY)
    if (isProjectedCoordinatePair(x, y)) {
      return {
        coordinates: utmToLatLng(x!, y!, 19),
        source: "projected-csa",
      }
    }
  }

  return undefined
}

function extractCoordinateInfo(record: Record<string, unknown>): CoordinateInfo | undefined {
  const lat = getNumber(record.ubicacionX)
  const lng = getNumber(record.ubicacionY)
  if (isValidLatLng(lat, lng)) {
    return {
      coordinates: { lat: lat!, lng: lng! },
      source: "direct",
    }
  }

  return extractProjectedCoordinateInfo(record)
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

  async getServiceForComuna(comuna: string): Promise<Record<string, unknown> | null> {
    const services = await this.post<Record<string, unknown>[]>("getServicioPredio", {
      comuna,
      eac: -1,
      tokenARSII: null,
    })

    return services.find((service) => service.aliasServicio === "P" || service.tipoServicio === 2) || services[0] || null
  }

  async getByPoint(input: { comuna: string; lat: number; lng: number; span?: number }): Promise<SiiAvaluoRecord | null> {
    const service = await this.getServiceForComuna(input.comuna)
    const layer = getText(service || {}, ["layer"])
    const style = getText(service || {}, ["style"])
    const eac = getNumber(service?.eac) || 0
    const eacano = getNumber(service?.eacano) || 0
    const span = input.span || 0.02

    if (!layer || !style) {
      return null
    }

    const data = await this.post<Record<string, unknown> | null>("getFeatureInfo", {
      clickInfo: {
        x: 500,
        y: 500,
        southwestx: input.lat - span,
        southwesty: input.lng - span,
        northeastx: input.lat + span,
        northeasty: input.lng + span,
        layer,
        width: 1000,
        height: 1000,
        servicios: [
          {
            comuna: Number(input.comuna),
            layer,
            style,
            eac,
            eacano,
          },
        ],
      },
      tokenARSII: null,
    })

    if (!data || typeof data !== "object" || data.existePredio === -1) {
      return null
    }

    const manzana = getText(data, ["manzana", "manzanaCnp"])
    const predio = getText(data, ["predio", "predioCnp"])
    if (!manzana || !predio) {
      return null
    }

    return buildAvaluo(data, { comuna: input.comuna, manzana, predio })
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
