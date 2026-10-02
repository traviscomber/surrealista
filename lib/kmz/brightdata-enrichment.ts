import { load } from "cheerio"

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
      host.endsWith("gstatic.com") ||
      host.endsWith("googleusercontent.com") ||
      host.endsWith("doubleclick.net") ||
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

  const $ = load(content)
  $("a[href]").each((_, element) => {
    if (hits.length >= limit) return false
    const rawHref = $(element).attr("href") || ""
    const label = $(element).text()

    if (/^https?:\/\//i.test(rawHref)) {
      accept(rawHref, label)
      return
    }

    if (rawHref.startsWith("/url?")) {
      const query = rawHref.slice(rawHref.indexOf("?") + 1).replace(/&amp;/gi, "&")
      const params = new URLSearchParams(query)
      const target = params.get("q") || params.get("url")
      if (target?.startsWith("http")) accept(target, label)
    }
  })

  if (hits.length < limit) {
    const decoded = content
      .replace(/\\u002F/gi, "/")
      .replace(/\\u003A/gi, ":")
      .replace(/\\u0026/gi, "&")
      .replace(/\\u003D/gi, "=")
      .replace(/\\\//g, "/")
      .replace(/&amp;/gi, "&")

    const genericUrlRegex = /https?:\/\/[^\s"'<>\\)]+/gi
    let match: RegExpExecArray | null
    while ((match = genericUrlRegex.exec(decoded)) && hits.length < limit) {
      accept(match[0], "")
    }
  }

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

export function buildFieldEvidenceSearchUrl(args: {
  fileName?: string | null
  region?: string | null
}) {
  const cleanName = String(args.fileName || "")
    .replace(/\.kmz$/i, "")
    .replace(/\(\d+\)/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\b(kmz|marca posicion googleearth|googleearth|tentativo|opcion|vta|cal)\b/gi, " ")
    .replace(/\d+(?:[.,]\d+)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!cleanName) return null
  const region = String(args.region || "").replace(/\s+/g, " ").trim()
  const query = [`"${cleanName}"`, region ? `"${region}"` : "", "Chile terreno campo"].filter(Boolean).join(" ")
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es-419&gl=cl`
}

export function brightDataConfigStatus() {
  return {
    configured: Boolean(process.env.BRIGHTDATA_API_KEY),
    zone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || DEFAULT_ZONE,
  }
}
