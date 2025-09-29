interface PortalInmobiliarioProperty {
  title: string
  price: string
  area: string
  location: string
  imageUrl: string
  propertyUrl: string
  coordinates?: { lat: number; lng: number }
  propertyType: string
  operation: string
  commission?: string
}

export class PortalInmobiliarioExtractor {
  private baseUrl = "https://www.portalinmobiliario.com"

  async extractProperties(page = 1): Promise<PortalInmobiliarioProperty[]> {
    console.log(`[v0] Extracting from Portal Inmobiliario page ${page}...`)

    // Focus on terrenos and parcelas
    const url = `${this.baseUrl}/venta/terreno/_Desde_${(page - 1) * 20 + 1}_NoIndex_True`

    try {
      console.log(`[v0] Fetching from: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        redirect: "follow",
      })

      console.log(`[v0] Portal Inmobiliario response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`[v0] Got HTML response (${html.length} characters)`)

      return this.parsePropertiesFromHTML(html)
    } catch (error) {
      console.error(`[v0] Failed to fetch from Portal Inmobiliario:`, error)
      throw new Error(
        `No se pudo acceder a Portal Inmobiliario: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  }

  private parsePropertiesFromHTML(html: string): PortalInmobiliarioProperty[] {
    const properties: PortalInmobiliarioProperty[] = []

    try {
      console.log(`[v0] Parsing Portal Inmobiliario HTML...`)

      // Portal Inmobiliario uses specific class patterns
      const propertyCardPatterns = [
        /<div[^>]*class="[^"]*ui-search-result[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<article[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
        /<div[^>]*data-qa="[^"]*posting[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ]

      let totalMatches = 0
      for (const pattern of propertyCardPatterns) {
        let match
        while ((match = pattern.exec(html)) !== null && totalMatches < 50) {
          totalMatches++
          const cardHtml = match[0]
          console.log(`[v0] Found Portal Inmobiliario card ${totalMatches}`)

          const property = this.extractPropertyFromCard(cardHtml)
          if (property && this.isValidProperty(property)) {
            console.log(`[v0] Valid Portal Inmobiliario property: ${property.title}`)
            properties.push(property)
          }
        }
      }

      console.log(`[v0] Portal Inmobiliario: Found ${totalMatches} cards, extracted ${properties.length} properties`)
      return properties
    } catch (error) {
      console.error(`[v0] Error parsing Portal Inmobiliario HTML:`, error)
      return []
    }
  }

  private extractPropertyFromCard(cardHtml: string): PortalInmobiliarioProperty | null {
    try {
      // Extract title
      const titlePatterns = [
        /<h2[^>]*class="[^"]*ui-search-item__title[^"]*"[^>]*>(.*?)<\/h2>/i,
        /<a[^>]*class="[^"]*ui-search-link[^"]*"[^>]*>(.*?)<\/a>/i,
        /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i,
      ]

      let title = ""
      for (const pattern of titlePatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          title = this.cleanText(match[1])
          if (title.length > 5) break
        }
      }

      // Extract price
      const pricePatterns = [
        /<span[^>]*class="[^"]*price-fraction[^"]*"[^>]*>(.*?)<\/span>/i,
        /<span[^>]*class="[^"]*ui-search-price__part[^"]*"[^>]*>\$\s*([\d,]+)/i,
        /\$\s*([\d,]+(?:\.[\d]+)?)/i,
      ]

      let price = ""
      for (const pattern of pricePatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          price = match[0].includes("$") ? match[0] : `$${match[1]}`
          break
        }
      }

      // Extract area
      const areaPatterns = [
        /([\d,]+(?:\.[\d]+)?)\s*(m²|hectáreas?|has?)/i,
        /superficie[^>]*>(.*?)(m²|hectáreas?|has?)/i,
      ]

      let area = ""
      for (const pattern of areaPatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          area = `${match[1]} ${match[2]}`
          break
        }
      }

      // Extract location
      const locationPatterns = [
        /<p[^>]*class="[^"]*ui-search-item__location[^"]*"[^>]*>(.*?)<\/p>/i,
        /<span[^>]*class="[^"]*ui-search-item__location[^"]*"[^>]*>(.*?)<\/span>/i,
      ]

      let location = ""
      for (const pattern of locationPatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          location = this.cleanText(match[1])
          break
        }
      }

      // Extract property URL
      const urlMatch = cardHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/i)
      const propertyUrl = urlMatch ? `${this.baseUrl}${urlMatch[1]}` : `${this.baseUrl}/venta/terreno/`

      if (title && price) {
        return {
          title,
          price,
          area,
          location: location || "Chile",
          imageUrl: "/placeholder.svg?height=200&width=300",
          propertyUrl,
          propertyType: this.extractPropertyType(title),
          operation: "venta",
          commission: "3%",
        }
      }

      return null
    } catch (error) {
      console.error(`[v0] Error extracting Portal Inmobiliario property:`, error)
      return null
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  private extractPropertyType(title: string): string {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("parcela")) return "Parcela"
    if (lowerTitle.includes("terreno")) return "Terreno"
    if (lowerTitle.includes("campo")) return "Campo"
    if (lowerTitle.includes("hectárea")) return "Terreno Agrícola"
    if (lowerTitle.includes("sitio")) return "Sitio"
    return "Terreno"
  }

  private isValidProperty(property: Partial<PortalInmobiliarioProperty>): boolean {
    return !!(property.title && property.title.length > 5 && property.price)
  }

  async extractAllPages(): Promise<PortalInmobiliarioProperty[]> {
    console.log("[v0] Starting Portal Inmobiliario extraction...")

    try {
      const properties = await this.extractProperties(1)
      console.log(`[v0] Successfully extracted ${properties.length} properties from Portal Inmobiliario`)
      return properties
    } catch (error) {
      console.error("[v0] Failed to extract from Portal Inmobiliario:", error)
      throw error
    }
  }
}
