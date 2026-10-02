const BRIGHTDATA_ENDPOINT = "https://api.brightdata.com/request"
const DEFAULT_ZONE = "portal_inmobiliario_unlocker"
const REQUEST_TIMEOUT_MS = 45_000

export type BrightDataSearchHit = {
  label: string
  url: string
}

function config() {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) throw new Error("BRIGHTDATA_API_KEY_MISSING")
  return {
    apiKey,
    zone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || DEFAULT_ZONE,
  }
}

export async function brightDataMarkdown(url: string) {
  const { apiKey, zone } = config()
  const response = await fetch(BRIGHTDATA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone,
      url,
      format: "raw",
      data_format: "markdown",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const body = await response.text()
  if (!response.ok) throw new Error(`BRIGHTDATA_HTTP_${response.status}`)
  if (!body.trim()) throw new Error("BRIGHTDATA_EMPTY_BODY")
  return body
}

function normalizeUrl(raw: string) {
  try {
    const url = new URL(raw)
    return url.toString()
  } catch {
    return null
  }
}

export function extractExternalLinks(markdown: string, limit = 8): BrightDataSearchHit[] {
  const hits: BrightDataSearchHit[] = []
  const seen = new Set<string>()
  const regex = /\[([^\]]{2,180})\]\((https?:\/\/[^)\s]+)\)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(markdown)) && hits.length < limit) {
    const label = match[1].replace(/\s+/g, " ").trim()
    const normalized = normalizeUrl(match[2])
    if (!normalized) continue

    const host = new URL(normalized).hostname.toLowerCase()
    if (
      host.endsWith("bing.com") ||
      host.endsWith("microsoft.com") ||
      host.endsWith("msn.com") ||
      host.endsWith("brightdata.com")
    ) continue

    if (seen.has(normalized)) continue
    seen.add(normalized)
    hits.push({ label, url: normalized })
  }

  return hits
}

export function buildPublicEvidenceSearchUrl(args: {
  rol: string
  fileName?: string | null
  region?: string | null
}) {
  const cleanName = (args.fileName || "").replace(/\.kmz$/i, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
  const terms = [
    `"${args.rol}"`,
    cleanName ? `"${cleanName}"` : "",
    args.region ? `"${args.region}"` : "",
    "propietario sociedad fundo predio",
  ].filter(Boolean)
  return `https://www.bing.com/search?q=${encodeURIComponent(terms.join(" "))}&setlang=es-CL`
}

export function brightDataConfigStatus() {
  return {
    configured: Boolean(process.env.BRIGHTDATA_API_KEY),
    zone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || DEFAULT_ZONE,
  }
}
