const SII_COMUNA_TABLE_URL = "https://zeus.sii.cl/avalu_cgi/br/brch10.sh"

let cachedCodes: Map<string, string> | null = null
let cachedAt = 0
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&uuml;/gi, "ü")
    .replace(/&amp;/gi, "&")
}

export function normalizeCommuneName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .replace(/^COIHAIQUE$/, "COYHAIQUE")
}

export function parseSiiCommuneTable(html: string) {
  const text = decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const codes = new Map<string, string>()
  const rowPattern = /\b(\d{5})\s+([A-ZÁÉÍÓÚÜÑ0-9 .'-]+?)\s+(\d{3})\b/g

  for (const match of text.matchAll(rowPattern)) {
    const code = match[1]
    const name = match[2]?.trim()
    if (!code || !name) continue
    const normalized = normalizeCommuneName(name)
    if (normalized) codes.set(normalized, code)
  }

  return codes
}

async function loadSiiCommuneCodes() {
  const now = Date.now()
  if (cachedCodes && now - cachedAt < CACHE_TTL_MS) return cachedCodes

  const response = await fetch(SII_COMUNA_TABLE_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`SII commune table failed: ${response.status}`)
  }

  const parsed = parseSiiCommuneTable(await response.text())
  if (parsed.size < 300) {
    throw new Error(`SII commune table incomplete: ${parsed.size} codes`)
  }

  cachedCodes = parsed
  cachedAt = now
  return parsed
}

export async function resolveSiiCommuneCode(commune: string, explicitCode?: unknown) {
  const explicit = String(explicitCode || "").trim()
  if (/^\d{5}$/.test(explicit)) return explicit

  const normalized = normalizeCommuneName(commune)
  if (!normalized) return ""

  const codes = await loadSiiCommuneCodes()
  return codes.get(normalized) || ""
}

export const SII_COMUNA_CODE_SOURCE = SII_COMUNA_TABLE_URL
