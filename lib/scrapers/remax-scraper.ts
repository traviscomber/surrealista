import puppeteer from "puppeteer"
import { createClient } from "@/lib/supabase/server"

export interface RemaxProperty {
  external_id: string
  title: string
  price_clp: number | null
  price_uf: number | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  property_type: string
  location: string
  address: string
  city: string
  region: string
  source_url: string
  images: string[]
}

// Southern regions for Remax scraping
const SOUTH_REGIONS = [
  { name: "Región del Biobío", searchTerm: "Biobio" },
  { name: "Región de La Araucanía", searchTerm: "Araucania" },
  { name: "Región de Los Ríos", searchTerm: "Los Rios" },
  { name: "Región de Los Lagos", searchTerm: "Los Lagos" },
  { name: "Región de Aysén", searchTerm: "Aysen" },
  { name: "Región de Magallanes", searchTerm: "Magallanes" },
]

export async function scrapeRemax(options: {
  searchUrl?: string
  pages?: number
  regions?: string[]
  perPage?: number
} = {}): Promise<{
  success: boolean
  data: RemaxProperty[]
  inserted: number
  total: number
  errors: string[]
}> {
  const {
    searchUrl = "https://www.remax.cl/listings",
    pages = 1,
    regions = SOUTH_REGIONS.map((r) => r.searchTerm),
    perPage = 12,
  } = options

  const supabase = await createClient()
  const errors: string[] = []
  const allProperties: RemaxProperty[] = []

  let browser

  try {
    // Launch browser - Puppeteer will automatically download Chromium if not found
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    })

    console.log(`[v0] [Remax] Scraping ${pages} page(s) for ${regions.length} south regions`)

    // Iterate by region
    for (const regionSearchTerm of regions) {
      // Find region name for logging
      const regionName =
        SOUTH_REGIONS.find((r) => r.searchTerm === regionSearchTerm)?.name || regionSearchTerm

      for (let pageNum = 1; pageNum <= pages; pageNum++) {
        const url = new URL(searchUrl)
        url.searchParams.set("FreeText", regionSearchTerm)
        url.searchParams.set("Country", "Chile")
        url.searchParams.set("CountryId", "1028")
        url.searchParams.set("ListingClass", "-1")
        url.searchParams.set("TransactionTypeUID", "261") // Buy
        url.searchParams.set("page", pageNum.toString())

      const page = await browser.newPage()
      page.setDefaultTimeout(30000)

      try {
        console.log(`[v0] [Remax] Loading page ${pageNum}: ${url.toString()}`)
        await page.goto(url.toString(), { waitUntil: "networkidle2" })

        // Wait for property cards to load
        await page.waitForSelector('[class*="card"]', { timeout: 5000 }).catch(() => {
          console.warn("[v0] [Remax] Property cards selector not found, continuing anyway")
        })

        // Extract properties using page evaluation
        const pageProperties = await page.evaluate((searchUrl) => {
          const properties: any[] = []

          // Find all property card containers
          const cardSelectors = ['[class*="card"]', '[class*="listing"]', 'a[href*="/listings/"]']
          let cards: Element[] = []

          for (const selector of cardSelectors) {
            cards = Array.from(document.querySelectorAll(selector))
            if (cards.length > 0) break
          }

          cards.forEach((card) => {
            try {
              const text = card.textContent || ""

              // Extract price in CLP
              const priceClpMatch = text.match(/([\d.,]+)\s*\$/)
              const priceClp = priceClpMatch
                ? parseInt(priceClpMatch[1].replace(/[.,]/g, ""), 10)
                : null

              // Extract price in UF
              const priceUfMatch = text.match(/([\d.,]+)\s*UF/)
              const priceUf = priceUfMatch ? parseFloat(priceUfMatch[1].replace(/[.,]/g, ".")) : null

              // Extract bedrooms
              const bedroomsMatch = text.match(/(\d+)\s*(?:bedroom|bd|dormitorio)/)
              const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1], 10) : null

              // Extract bathrooms (look for icons or text)
              const bathroomsMatch = text.match(/(\d+)\s*(?:bathroom|ba|ba?o)/)
              const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1], 10) : null

              // Extract area in m²
              const areaMatch = text.match(/([\d.,]+)\s*(?:m²|sqm|m2)/)
              const area = areaMatch ? parseFloat(areaMatch[1].replace(/[.,]/g, ".")) : null

              // Extract location
              const locationMatch = text.match(/(?:For Sale|En Venta)-(.+?)(?:,|Chile|-$)/)
              const location = locationMatch ? locationMatch[1].trim() : ""

              // Try to find property type
              const typeMatch = text.match(
                /(?:country estate|apartment|house|casa|departamento|casa comercial|comercial)/i
              )
              const propertyType = typeMatch ? typeMatch[0] : "Property"

              // Get URL if it's a link
              const link = (card as HTMLAnchorElement).href || ""

              // Extract external ID from URL
              const idMatch = link.match(/\/listings\/(\d+)/)
              const externalId = idMatch ? idMatch[1] : `remax-${Date.now()}`

              if (priceClp || priceUf) {
                properties.push({
                  external_id: externalId,
                  title: text.split("\n")[0].slice(0, 100),
                  price_clp: priceClp,
                  price_uf: priceUf,
                  bedrooms,
                  bathrooms,
                  area_m2: area,
                  property_type: propertyType,
                  location,
                  address: location,
                  city: location.split(",")[0] || "",
                  region: location.split(",")[1] || "Chile",
                  source_url: link,
                  images: [],
                })
              }
            } catch (err) {
              console.error("[Remax] Error parsing card:", err)
            }
          })

          return properties
        }, searchUrl)

        allProperties.push(...pageProperties)
        console.log(`[v0] [Remax] Page ${pageNum}: Found ${pageProperties.length} properties`)
      } catch (err) {
        const errMsg = `Error scraping page ${pageNum}: ${(err as Error).message}`
        console.error("[v0]", errMsg)
        errors.push(errMsg)
      } finally {
        await page.close()
      }
    }
  }

    // Insert into database
    let inserted = 0
    for (const prop of allProperties) {
      try {
        const { error } = await supabase.from("properties_external").insert({
          external_id: prop.external_id,
          title: prop.title,
          source: "remax",
          source_url: prop.source_url,
          price_clp: prop.price_clp,
          price_uf: prop.price_uf,
          area_m2: prop.area_m2,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          property_type: prop.property_type,
          location: prop.location,
          address: prop.address,
          city: prop.city,
          region: prop.region,
          images: prop.images,
          status: "available",
          scraped_at: new Date().toISOString(),
          is_active: true,
        })

        if (error && !error.message.includes("duplicate")) {
          throw error
        }
        if (!error) inserted++
      } catch (err) {
        console.warn(`[v0] Failed to insert property ${prop.external_id}: ${(err as Error).message}`)
      }
    }

    console.log(`[v0] [Remax] Scraping complete: ${allProperties.length} found, ${inserted} inserted`)

    return {
      success: true,
      data: allProperties,
      inserted,
      total: allProperties.length,
      errors,
    }
  } catch (err) {
    const errMsg = `[v0] [Remax] Fatal scraper error: ${(err as Error).message}`
    console.error(errMsg)
    return {
      success: false,
      data: [],
      inserted: 0,
      total: 0,
      errors: [errMsg],
    }
  } finally {
    if (browser) await browser.close()
  }
}
