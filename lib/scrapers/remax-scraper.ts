import { createClient } from "@/lib/supabase/server"

// ─── Remax Azure Cognitive Search API ────────────────────────────────────────
// Discovered via network interception — no auth token required
const REMAX_SEARCH_API = "https://www.remax.cl/search/listing-search/docs/search"
const PAGE_SIZE = 50 // max per request

// Southern Chilean regions to scrape
const SOUTH_REGIONS = [
  { name: "Región del Biobío",       searchTerm: "Biobio" },
  { name: "Región de La Araucanía",  searchTerm: "Araucania" },
  { name: "Región de Los Ríos",      searchTerm: "Los Rios" },
  { name: "Región de Los Lagos",     searchTerm: "Los Lagos" },
  { name: "Región de Aysén",         searchTerm: "Aysen" },
  { name: "Región de Magallanes",    searchTerm: "Magallanes" },
]

// CDN base URL for Remax Chile images (CountryId 1028)
const REMAX_IMAGE_CDN = "https://cdn.gryphtech.com/userimages/1028/LargeWM"

interface RemaxApiResult {
  "@search.score": number
  content: {
    ListingKey:         string
    MLSID:              string
    ListingId:          number
    ListingClass:       number        // 1=residential, 2=land, etc
    TitleAddress:       string
    FullAddress:        string
    City:               string
    Province:           string
    RegionalZone:       string
    ListingPrice:       number | null
    ListingPriceEuro:   number | null
    NumberOfBedrooms:   number | null
    NumberOfBathrooms:  number | null
    TotalArea:          number | null
    LivingArea:         number | null
    LotSize:            number | null
    TransactionTypeUID: number        // 261=buy
    PropertyTypeUID:    number
    PropertyTypeDescription?: string
    ListingDescriptions?: { Description: string }[]
    ListingImages?: { FileName: string; Order: string; HasLargeImage: string }[]
    AgentId:            number
  }
}

// Build the POST body for Azure Cognitive Search
function buildSearchBody(searchTerm: string, skip = 0) {
  return {
    count: true,
    skip,
    top: PAGE_SIZE,
    searchMode: "any",
    queryType: "full",
    scoringProfile: "",
    searchFields: [
      "content/City",
      "content/Province",
      "content/GeoDatas/City",
      "content/GeoDatas/Province",
      "content/ListingDescriptions/Description",
      "content/FullTextSearch",
      "content/DevelopmentName",
    ].join(","),
    search: searchTerm,
    facets: ["content/RegionalZone,count:500,sort:count"],
    filter: [
      "content/TenantId eq 6",
      "content/CountryID eq 1028",
      "content/OnHoldListing eq false",
      "content/IsRegionalOffice eq false",
      "content/IsViewable eq true",
      "content/TransactionTypeUID eq 261", // Buy/Venta
    ].join(" and "),
    minimumCoverage: 90,
    orderby: "",
  }
}

// Map Remax PropertyTypeUID to a human-readable string
function mapPropertyType(uid: number): string {
  const types: Record<number, string> = {
    1: "Casa",
    2: "Departamento",
    3: "Terreno",
    4: "Oficina",
    5: "Local Comercial",
    6: "Bodega",
    7: "Parcela",
    8: "Fundo",
    9: "Agrícola",
    10: "Industrial",
  }
  return types[uid] ?? "Propiedad"
}

// Calculate price in UF (1 UF ≈ 38,000 CLP as reference rate)
const UF_RATE = 38000
function clpToUf(clp: number | null): number | null {
  if (!clp || clp <= 0) return null
  return Math.round((clp / UF_RATE) * 100) / 100
}

// ─── Main Scraper Function ────────────────────────────────────────────────────
export async function scrapeRemax(options: {
  pages?: number
  regions?: string[]
} = {}): Promise<{
  success: boolean
  total_found: number
  inserted: number
  errors: string[]
  regions_scraped: string[]
}> {
  const {
    pages = 1,
    regions = SOUTH_REGIONS.map((r) => r.searchTerm),
  } = options

  const supabase = await createClient()
  const errors: string[] = []
  const regionsScraped: string[] = []
  let totalFound = 0
  let totalInserted = 0

  for (const regionSearchTerm of regions) {
    const regionName =
      SOUTH_REGIONS.find((r) => r.searchTerm === regionSearchTerm)?.name ?? regionSearchTerm

    try {
      // Fetch all pages for this region
      for (let pageNum = 0; pageNum < pages; pageNum++) {
        const skip = pageNum * PAGE_SIZE
        const body = buildSearchBody(regionSearchTerm, skip)

        const resp = await fetch(REMAX_SEARCH_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Referer: "https://www.remax.cl/",
          },
          body: JSON.stringify(body),
        })

        if (!resp.ok) {
          errors.push(`[${regionName}] HTTP ${resp.status}: ${await resp.text().catch(() => "")}`)
          break
        }

        const json = await resp.json()
        const results: RemaxApiResult[] = json.value ?? []
        const totalCount: number = json["@odata.count"] ?? 0

        totalFound += results.length

        // Insert each property into DB
        for (const item of results) {
          const c = item.content

          // Skip if no price at all
          if (!c.ListingPrice) continue

          const priceClp   = c.ListingPrice ? Math.round(c.ListingPrice) : null
          const priceUf    = clpToUf(priceClp)
          const areaM2     = c.LivingArea ?? c.TotalArea ?? c.LotSize ?? null
          const externalId = `remax-${c.MLSID ?? c.ListingKey}`
          const title      = c.TitleAddress || `${mapPropertyType(c.PropertyTypeUID)} en ${c.City}`
          const location   = [c.City, c.Province].filter(Boolean).join(", ")
          // Build full image URLs from ListingImages using Gryphtech CDN
          const images = (c.ListingImages ?? [])
            .sort((a, b) => Number(a.Order) - Number(b.Order))
            .slice(0, 5)
            .map((img) => `${REMAX_IMAGE_CDN}/${img.FileName}`)

          const { error } = await supabase
            .from("properties_external")
            .upsert(
              {
                external_id:    externalId,
                title,
                source:         "remax",
                source_url:     `https://www.remax.cl/listings/${c.ListingKey}`,
                price:          priceClp,
                price_clp:      priceClp,
                price_uf:       priceUf,
                currency:       "CLP",
                area:           areaM2,
                area_m2:        areaM2,
                bedrooms:       c.NumberOfBedrooms ?? null,
                bathrooms:      c.NumberOfBathrooms ?? null,
                property_type:  mapPropertyType(c.PropertyTypeUID),
                operation:      "venta",
                location,
                address:        c.FullAddress ?? location,
                city:           c.City ?? "",
                commune:        c.City ?? "",
                region:         c.Province ?? regionName,
                images,
                scraped_at:     new Date().toISOString(),
                is_active:      true,
              },
              { onConflict: "external_id" }
            )

          if (error) {
            errors.push(`[${externalId}] ${error.message}`)
          } else {
            totalInserted++
          }
        }

        // Stop paginating if we got all results
        if (skip + results.length >= totalCount) break
      }

      regionsScraped.push(regionName)
    } catch (err) {
      errors.push(`[${regionName}] ${(err as Error).message}`)
    }
  }

  return {
    success: errors.length === 0 || totalInserted > 0,
    total_found:    totalFound,
    inserted:       totalInserted,
    errors:         errors.slice(0, 20), // cap to avoid huge payloads
    regions_scraped: regionsScraped,
  }
}
