import { load, type CheerioAPI } from "cheerio"
import type { RawProperty, ScrapeResult } from "./base-scraper"
import { logScrapeRun, normaliseProperty, normaliseRegion, upsertProperties } from "./base-scraper"

const BASE_URL = "https://sur-realista.cl"
const LIST_URL = `${BASE_URL}/lista-de-campos/`

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-CL,es;q=0.9",
  Referer: BASE_URL,
}

type ScrapeOptions = {
  regions?: string[]
  pages?: number
  dryRun?: boolean
}

type SurRealistaResult = ScrapeResult & {
  dryRun: boolean
  preview?: Array<{
    externalId: string
    title: string
    priceRaw: string | number | null | undefined
    areaRaw: string | number | null | undefined
    commune: string | null | undefined
    region: string | null | undefined
    sourceUrl: string | null | undefined
  }>
}

function cleanText(value: string | null | undefined) {
  return `${value || ""}`.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function absoluteUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    return new URL(value, BASE_URL).toString()
  } catch {
    return null
  }
}

function externalIdFromUrl(url: string) {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "property"
  return `surealista-${slug}`
}

function parseSiteHectares(raw: string | null) {
  if (!raw) return null
  const value = raw.trim().replace(",", ".")

  // The site uses a dot as a thousands separator when exactly three digits follow it
  // (for example 1.600, 5.000 and 16.691 hectares), while shorter suffixes are decimals.
  const normalized = /^\d{1,3}\.\d{3}$/.test(value) ? value.replace(".", "") : value
  const hectares = Number.parseFloat(normalized)
  return Number.isFinite(hectares) && hectares > 0 ? hectares : null
}

function getLeafTokens($: CheerioAPI, card: ReturnType<CheerioAPI>) {
  return card
    .find("*")
    .filter((_, element) => $(element).children().length === 0)
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean)
}

function findListingCard($: CheerioAPI, anchor: ReturnType<CheerioAPI>) {
  let current = anchor
  for (let depth = 0; depth < 10; depth += 1) {
    const text = cleanText(current.text())
    if (/Superficie:/i.test(text) && /\bUF\b/i.test(text)) return current
    const parent = current.parent()
    if (!parent.length) break
    current = parent
  }
  return null
}

function extractImage(card: ReturnType<CheerioAPI>) {
  const image = card.find("img").first()
  const direct = image.attr("data-lazy-src") || image.attr("data-src") || image.attr("src")
  if (direct && !direct.startsWith("data:")) return absoluteUrl(direct)

  const srcset = image.attr("data-srcset") || image.attr("srcset")
  const candidate = srcset?.split(",").pop()?.trim().split(/\s+/)[0]
  return absoluteUrl(candidate)
}

function extractListings(html: string): RawProperty[] {
  const $ = load(html)
  const results = new Map<string, RawProperty>()

  $('a[href*="/campos/"]').each((_, element) => {
    const anchor = $(element)
    const href = absoluteUrl(anchor.attr("href"))
    if (!href || href === `${BASE_URL}/campos/`) return

    const card = findListingCard($, anchor)
    if (!card) return

    const cardText = cleanText(card.text())
    const areaMatch = cardText.match(/Superficie:\s*([\d.,]+)\s*has?/i)
    const priceMatch = cardText.match(/\bUF\s*(Consultar precio|[\d.]+(?:\s*x\s*ha)?)/i)
    if (!areaMatch || !priceMatch) return

    const title = cleanText(
      card.find("h1, h2, h3, h4, h5, h6").first().text() || anchor.attr("title") || anchor.text(),
    )
    if (!title) return

    const tokens = Array.from(new Set(getLeafTokens($, card)))
    const regionToken = tokens.find((token) => /Regi[oó]n|RM de Santiago/i.test(token)) || null
    const regionIndex = regionToken ? tokens.indexOf(regionToken) : -1
    const ignored = (token: string) =>
      token === title || /Superficie:/i.test(token) || /^UF\b/i.test(token) || /Mostrar|detalle|ver m[aá]s/i.test(token)
    const commune = regionIndex > 0
      ? [...tokens.slice(0, regionIndex)].reverse().find((token) => !ignored(token)) || null
      : null

    const hectares = parseSiteHectares(areaMatch[1])
    const priceLabel = cleanText(priceMatch[1])
    const isPricePerHectare = /x\s*ha/i.test(priceLabel)
    const isPriceOnRequest = /consultar/i.test(priceLabel)
    const image = extractImage(card)
    const features = [
      `Superficie publicada: ${areaMatch[1]} ha`,
      isPricePerHectare ? `Precio publicado por hectárea: UF ${priceLabel}` : null,
      isPriceOnRequest ? "Precio a consultar" : null,
    ].filter((feature): feature is string => Boolean(feature))

    results.set(href, {
      externalId: externalIdFromUrl(href),
      source: "surealista",
      title,
      priceRaw: isPricePerHectare || isPriceOnRequest ? null : `UF ${priceLabel}`,
      currencyRaw: "UF",
      areaRaw: hectares ? `${hectares} ha` : null,
      propertyType: /casa/i.test(title) ? "casa rural" : /terreno|lote|parcela/i.test(title) ? "terreno" : "campo",
      operation: "venta",
      region: normaliseRegion(regionToken),
      commune,
      city: commune,
      description: features.join(" · "),
      features,
      images: image ? [image] : [],
      sourceUrl: href,
      contactName: "Juan Eduardo Navarro",
      contactPhone: "+56 9 6674 9221",
    })
  })

  return Array.from(results.values())
}

export async function scrapeSurRealista(options: ScrapeOptions = {}): Promise<SurRealistaResult> {
  const { regions, dryRun = false } = options
  const startedAt = Date.now()
  const errors: string[] = []

  const response = await fetch(LIST_URL, {
    headers: HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  })

  if (!response.ok) throw new Error(`sur-realista.cl returned HTTP ${response.status}`)

  const html = await response.text()
  let rawProperties = extractListings(html)

  if (regions?.length) {
    const normalizedRegions = new Set(regions.map((region) => normaliseRegion(region)).filter(Boolean))
    rawProperties = rawProperties.filter((property) => normalizedRegions.has(normaliseRegion(property.region)))
  }

  if (rawProperties.length === 0) {
    errors.push("No property cards were detected; the source HTML structure may have changed")
  }

  const normalised = await Promise.all(rawProperties.map(normaliseProperty))
  let inserted = 0
  let updated = 0
  let skipped = 0

  if (!dryRun && normalised.length > 0) {
    const dbResult = await upsertProperties(normalised)
    inserted = dbResult.inserted
    updated = dbResult.updated
    skipped = dbResult.skipped
    errors.push(...dbResult.errors)
  }

  const result: Omit<SurRealistaResult, "source"> = {
    found: rawProperties.length,
    inserted,
    updated,
    skipped,
    errors,
    durationMs: Date.now() - startedAt,
    dryRun,
    ...(dryRun
      ? {
          preview: rawProperties.slice(0, 10).map((property) => ({
            externalId: property.externalId,
            title: property.title,
            priceRaw: property.priceRaw,
            areaRaw: property.areaRaw,
            commune: property.commune,
            region: property.region,
            sourceUrl: property.sourceUrl,
          })),
        }
      : {}),
  }

  if (!dryRun) await logScrapeRun("surealista", result)
  return { source: "surealista", ...result }
}
