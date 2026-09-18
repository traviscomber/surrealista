import * as cheerio from "cheerio"
import * as XLSX from "xlsx"

export type DgaWaterRightRecord = {
  holder: string | null
  commune: string | null
  source: string | null
  flow: string | null
  nature: string | null
  exercise: string | null
  resolution: string | null
  certificate: string | null
}

export type DgaWaterRightsEvidence = {
  status: "available" | "unavailable" | "unsupported_region"
  source: "Dirección General de Aguas (DGA)"
  sourceUrl: string
  cutoffDate: string | null
  regionFileUrl: string | null
  region: string | null
  commune: string | null
  communeMatchCount: number
  sample: DgaWaterRightRecord[]
  associationToProperty: "not_proven"
  note: string
}

const DGA_PAGE = "https://dga.mop.gob.cl/derechos-de-agua/derechos-registrados/"

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

const REGION_ALIASES: Array<{ aliases: string[]; linkText: string[] }> = [
  { aliases: ["arica y parinacota"], linkText: ["arica y parinacota"] },
  { aliases: ["tarapaca"], linkText: ["tarapaca"] },
  { aliases: ["antofagasta"], linkText: ["antofagasta"] },
  { aliases: ["atacama"], linkText: ["atacama"] },
  { aliases: ["coquimbo"], linkText: ["coquimbo"] },
  { aliases: ["valparaiso"], linkText: ["valparaiso"] },
  { aliases: ["metropolitana", "metropolitana de santiago", "santiago"], linkText: ["metropolitana"] },
  { aliases: ["ohiggins", "o higgins", "libertador general bernardo ohiggins", "libertador general bernardo o higgins"], linkText: ["ohiggins", "o higgins"] },
  { aliases: ["maule"], linkText: ["maule"] },
  { aliases: ["biobio", "bio bio"], linkText: ["bio bio", "biobio"] },
  { aliases: ["nuble"], linkText: ["nuble"] },
  { aliases: ["araucania", "la araucania"], linkText: ["araucania"] },
  { aliases: ["los lagos", "lagos"], linkText: ["los lagos"] },
  { aliases: ["los rios", "rios"], linkText: ["los rios"] },
  { aliases: ["aysen", "aysen del general carlos ibanez del campo"], linkText: ["aysen"] },
  { aliases: ["magallanes", "magallanes y de la antartica chilena"], linkText: ["magallanes"] },
]

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" })
  } finally {
    clearTimeout(timer)
  }
}

function absoluteHref(href: string) {
  try {
    return new URL(href, DGA_PAGE).toString()
  } catch {
    return null
  }
}

async function discoverRegionWorkbook(region: string) {
  const regionKey = normalize(region)
  const mapping = REGION_ALIASES.find((entry) => entry.aliases.some((alias) => normalize(alias) === regionKey))
  if (!mapping) return { url: null, cutoffDate: null, supported: false }

  const response = await fetchWithTimeout(DGA_PAGE)
  if (!response.ok) throw new Error(`DGA index HTTP ${response.status}`)
  const html = await response.text()
  const $ = cheerio.load(html)
  let url: string | null = null

  $("a").each((_, element) => {
    if (url) return
    const text = normalize($(element).text())
    const href = String($(element).attr("href") || "")
    if (!/\.xlsx?(?:$|\?)/i.test(href)) return
    if (!mapping.linkText.some((candidate) => text.includes(normalize(candidate)))) return
    url = absoluteHref(href)
  })

  const cutoffMatch = html.match(/Fecha\s+de\s+corte\s+de\s+informaci[oó]n\s*:\s*([^<\n]+)/i)
  return { url, cutoffDate: cutoffMatch?.[1]?.trim() || null, supported: true }
}

function keyOf(row: Record<string, unknown>, candidates: string[]) {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const wanted = normalize(candidate)
    const found = entries.find(([key]) => normalize(key).includes(wanted))
    if (found) return found[1]
  }
  return null
}

function asText(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function parseRecord(row: Record<string, unknown>): DgaWaterRightRecord {
  return {
    holder: asText(keyOf(row, ["nombre titular", "titular", "nombre solicitante"])),
    commune: asText(keyOf(row, ["comuna captacion", "comuna", "comuna de captacion"])),
    source: asText(keyOf(row, ["fuente", "nombre fuente", "fuente abastecimiento"])),
    flow: asText(keyOf(row, ["caudal", "caudal l s", "caudal otorgado"])),
    nature: asText(keyOf(row, ["naturaleza", "naturaleza del agua"])),
    exercise: asText(keyOf(row, ["ejercicio", "tipo ejercicio"])),
    resolution: asText(keyOf(row, ["resolucion", "n resolucion", "numero resolucion"])),
    certificate: asText(keyOf(row, ["certificado ano", "n certificado ano", "certificado"])),
  }
}

export async function getDgaWaterRightsEvidence(region?: string | null, commune?: string | null): Promise<DgaWaterRightsEvidence> {
  const cleanRegion = String(region ?? "").trim()
  const cleanCommune = String(commune ?? "").trim()
  if (!cleanRegion) {
    return {
      status: "unsupported_region",
      source: "Dirección General de Aguas (DGA)",
      sourceUrl: DGA_PAGE,
      cutoffDate: null,
      regionFileUrl: null,
      region: null,
      commune: cleanCommune || null,
      communeMatchCount: 0,
      sample: [],
      associationToProperty: "not_proven",
      note: "Define una región para consultar los derechos registrados publicados por la DGA.",
    }
  }

  try {
    const discovered = await discoverRegionWorkbook(cleanRegion)
    if (!discovered.supported) {
      return {
        status: "unsupported_region",
        source: "Dirección General de Aguas (DGA)",
        sourceUrl: DGA_PAGE,
        cutoffDate: null,
        regionFileUrl: null,
        region: cleanRegion,
        commune: cleanCommune || null,
        communeMatchCount: 0,
        sample: [],
        associationToProperty: "not_proven",
        note: `El conector DGA todavía no tiene mapeada la región ${cleanRegion}.`,
      }
    }
    if (!discovered.url) throw new Error("No se encontró el archivo regional XLS/XLSX en la página oficial")

    const workbookResponse = await fetchWithTimeout(discovered.url, {}, 18_000)
    if (!workbookResponse.ok) throw new Error(`DGA workbook HTTP ${workbookResponse.status}`)
    const buffer = Buffer.from(await workbookResponse.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error("DGA workbook sin hojas")
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" })

    const communeKey = normalize(cleanCommune)
    const matched = communeKey
      ? rows.filter((row) => {
          const value = asText(keyOf(row, ["comuna captacion", "comuna", "comuna de captacion"]))
          return value ? normalize(value) === communeKey : false
        })
      : rows
    const sample = matched.slice(0, 8).map(parseRecord)

    return {
      status: "available",
      source: "Dirección General de Aguas (DGA)",
      sourceUrl: DGA_PAGE,
      cutoffDate: discovered.cutoffDate,
      regionFileUrl: discovered.url,
      region: cleanRegion,
      commune: cleanCommune || null,
      communeMatchCount: matched.length,
      sample,
      associationToProperty: "not_proven",
      note: `La DGA registra ${matched.length.toLocaleString("es-CL")} derecho${matched.length === 1 ? "" : "s"} que coinciden con el filtro administrativo disponible. Esto es evidencia de contexto hídrico; no prueba que un derecho pertenezca al ROL consultado ni acredita vigencia del dominio.`,
    }
  } catch (error) {
    return {
      status: "unavailable",
      source: "Dirección General de Aguas (DGA)",
      sourceUrl: DGA_PAGE,
      cutoffDate: null,
      regionFileUrl: null,
      region: cleanRegion,
      commune: cleanCommune || null,
      communeMatchCount: 0,
      sample: [],
      associationToProperty: "not_proven",
      note: `DGA no estuvo disponible en esta ejecución: ${error instanceof Error ? error.message : "error desconocido"}.`,
    }
  }
}
