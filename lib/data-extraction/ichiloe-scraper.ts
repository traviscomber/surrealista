// Sistema de extracción de datos reales de iChiloe.cl
import { createClient } from "@supabase/supabase-js"

interface IChiloeProperty {
  id: string
  title: string
  price: number
  currency: string
  area: number
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  images: string[]
  description: string
  propertyType: string
  operation: "venta" | "arriendo"
  features: string[]
  contact: {
    name?: string
    phone?: string
    email?: string
  }
  url: string
  scrapedAt: Date
}

export class IChiloeScraper {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  async scrapeProperties(): Promise<IChiloeProperty[]> {
    try {
      console.log("[v0] Starting iChiloe property scraping...")

      // Por ahora, vamos a usar fetch para obtener la página
      const response = await fetch("https://www.ichiloe.cl/propiedades/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      console.log("[v0] HTML fetched, parsing properties...")

      const properties = this.parsePropertiesFromHTML(html)

      console.log(`[v0] Found ${properties.length} properties`)
      return properties
    } catch (error) {
      console.error("[v0] Error scraping iChiloe:", error)
      return []
    }
  }

  private parsePropertiesFromHTML(html: string): IChiloeProperty[] {
    const properties: IChiloeProperty[] = []

    // Regex patterns para extraer datos de propiedades
    const propertyPattern = /<div[^>]*class="[^"]*property[^"]*"[^>]*>(.*?)<\/div>/gs
    const titlePattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i
    const pricePattern = /\$\s*([\d,.]+)/i
    const areaPattern = /(\d+(?:\.\d+)?)\s*(?:ha|hectáreas|m²|metros)/i

    const matches = html.match(propertyPattern) || []

    matches.forEach((match, index) => {
      try {
        const titleMatch = match.match(titlePattern)
        const priceMatch = match.match(pricePattern)
        const areaMatch = match.match(areaPattern)

        if (titleMatch) {
          const property: IChiloeProperty = {
            id: `ichiloe_${Date.now()}_${index}`,
            title: titleMatch[1].replace(/<[^>]*>/g, "").trim(),
            price: priceMatch ? Number.parseFloat(priceMatch[1].replace(/[,.]/g, "")) : 0,
            currency: "CLP",
            area: areaMatch ? Number.parseFloat(areaMatch[1]) : 0,
            location: "Chiloé, Chile",
            images: this.extractImages(match),
            description: this.extractDescription(match),
            propertyType: this.extractPropertyType(match),
            operation: this.extractOperation(match),
            features: this.extractFeatures(match),
            contact: this.extractContact(match),
            url: `https://www.ichiloe.cl/propiedades/`,
            scrapedAt: new Date(),
          }

          properties.push(property)
        }
      } catch (error) {
        console.error("[v0] Error parsing property:", error)
      }
    })

    return properties
  }

  private extractImages(html: string): string[] {
    const imgPattern = /<img[^>]+src="([^"]+)"/gi
    const images: string[] = []
    let match

    while ((match = imgPattern.exec(html)) !== null) {
      images.push(match[1])
    }

    return images
  }

  private extractDescription(html: string): string {
    const descPattern = /<p[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/p>/i
    const match = html.match(descPattern)
    return match ? match[1].replace(/<[^>]*>/g, "").trim() : ""
  }

  private extractPropertyType(html: string): string {
    if (html.toLowerCase().includes("casa")) return "casa"
    if (html.toLowerCase().includes("terreno")) return "terreno"
    if (html.toLowerCase().includes("campo")) return "campo"
    if (html.toLowerCase().includes("parcela")) return "parcela"
    return "propiedad"
  }

  private extractOperation(html: string): "venta" | "arriendo" {
    return html.toLowerCase().includes("arriendo") ? "arriendo" : "venta"
  }

  private extractFeatures(html: string): string[] {
    const features: string[] = []
    const featureKeywords = [
      "agua",
      "luz",
      "alcantarillado",
      "internet",
      "vista al mar",
      "bosque",
      "río",
      "lago",
      "playa",
      "montaña",
    ]

    featureKeywords.forEach((keyword) => {
      if (html.toLowerCase().includes(keyword)) {
        features.push(keyword)
      }
    })

    return features
  }

  private extractContact(html: string): { name?: string; phone?: string; email?: string } {
    const phonePattern = /(\+?56\s*9\s*\d{4}\s*\d{4}|\d{9})/
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/

    const phoneMatch = html.match(phonePattern)
    const emailMatch = html.match(emailPattern)

    return {
      phone: phoneMatch ? phoneMatch[1] : undefined,
      email: emailMatch ? emailMatch[1] : undefined,
    }
  }

  async savePropertiesToDatabase(properties: IChiloeProperty[]): Promise<void> {
    try {
      console.log(`[v0] Saving ${properties.length} properties to database...`)

      for (const property of properties) {
        const { data: existing } = await this.supabase
          .from("properties_external")
          .select("id")
          .eq("external_id", property.id)
          .single()

        if (!existing) {
          const { error } = await this.supabase.from("properties_external").insert({
            external_id: property.id,
            source: "ichiloe",
            title: property.title,
            price: property.price,
            currency: property.currency,
            area: property.area,
            location: property.location,
            coordinates: property.coordinates,
            images: property.images,
            description: property.description,
            property_type: property.propertyType,
            operation: property.operation,
            features: property.features,
            contact_info: property.contact,
            source_url: property.url,
            scraped_at: property.scrapedAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (error) {
            console.error("[v0] Error saving property:", error)
          } else {
            console.log(`[v0] Saved property: ${property.title}`)
          }
        }
      }

      console.log("[v0] All properties processed")
    } catch (error) {
      console.error("[v0] Error saving properties to database:", error)
    }
  }

  async syncProperties(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      console.log("[v0] Starting property sync from iChiloe...")

      const properties = await this.scrapeProperties()
      await this.savePropertiesToDatabase(properties)

      return {
        success: true,
        count: properties.length,
        errors: [],
      }
    } catch (error) {
      console.error("[v0] Sync failed:", error)
      return {
        success: false,
        count: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  }
}
