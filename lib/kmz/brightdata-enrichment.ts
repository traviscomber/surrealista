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

export function extractExternalLinks(content: string, limit = 8): BrightDataSearchHit[] {
  const hits: BrightDataSearchHit[] = []
  const seen = new Set<string>()

  const accept = (rawUrl: string, rawLabel: string) => {
    const cleanedUrl = rawUrl.replace(/&amp;/gi, "&").replace(/&#x2F;/gi, "/")
    const normalized = normalizeUrl(cleanedUrl)
    if (!normalized) return

    const host = new URL(normalized).hostname.toLowerCase()
    const searchEngineHost =
      host === "google.com" ||
      host.endsWith(".google.com") ||
      /^([^.]+\.)*google\.[a-z.]+$/i.test(host) ||
      host.endsWith("bing.com") ||
      host.endsWith("duckduckgo.com")

    if (
      searchEngineHost ||
      host.endsWith("microsoft.com") ||
      host.endsWith("msn.com") ||
      host.endsWith("brightdata.com")
    ) return

    if (seen.has(normalized)) return
    seen.add(normalized)

    const label = rawLabel
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()

    hits.push({ label: label || host, url: normalized })
  }

  const markdownRegex = /\[([^\]]{2,180})\]\((https?:\/\/[^)\s]+)\)/g
  let match: RegExpExecArray | null
  while ((match = markdownRegex.exec(content)) && hits.length < limit) accept(match[2], match[1])

  const htmlRegex = /<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  while ((match = htmlRegex.exec(content)) && hits.length < limit) accept(match[1], match[2])

  return hits.slice(0, limit)
}

export function buildPublicEvidenceSearchUrl(args: {
  rol: string
  fileName?: string | null
  region?: string | null
}) {
  const query = `"${args.rol}" Chile`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es-419&gl=cl`
}

export function brightDataConfigStatus() {
  return {
    configured: Boolean(process.env.BRIGHTDATA_API_KEY),
    zone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || DEFAULT_ZONE,
  }
}
