interface IChiloeProperty {
  title: string
  price: string
  area: string
  location: string
  imageUrl: string
  propertyUrl: string
  coordinates?: { lat: number; lng: number }
  propertyType: string
  operation: string // venta/arriendo
  commission?: string
}

export class IChiloeExtractor {
  private baseUrl = "https://www.ichiloe.cl"

  async extractProperties(page = 1): Promise<IChiloeProperty[]> {
    console.log(`[v0] Attempting to extract REAL data from iChiloe page ${page}...`)

    const url = `${this.baseUrl}/propiedades/`

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
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      })

      console.log(`[v0] Response status: ${response.status}`)
      console.log(`[v0] Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`[v0] Got HTML response (${html.length} characters)`)
      console.log(`[v0] HTML preview (first 500 chars):`, html.substring(0, 500))
      console.log(`[v0] HTML contains 'propiedad':`, html.toLowerCase().includes("propiedad"))
      console.log(`[v0] HTML contains '$':`, html.includes("$"))
      console.log(`[v0] HTML contains 'precio':`, html.toLowerCase().includes("precio"))

      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
      if (nextDataMatch) {
        console.log(`[v0] Found __NEXT_DATA__ script, attempting to parse...`)
        try {
          const nextData = JSON.parse(nextDataMatch[1])
          console.log(`[v0] Next.js data keys:`, Object.keys(nextData))
          const properties = this.extractFromNextData(nextData)
          if (properties.length > 0) {
            console.log(`[v0] Successfully extracted ${properties.length} properties from Next.js data`)
            return properties
          }
        } catch (error) {
          console.log(`[v0] Failed to parse Next.js data:`, error)
        }
      }

      const wpApiMatch = html.match(/wp-json\/wp\/v2\/([^"']+)/g)
      if (wpApiMatch) {
        console.log(`[v0] Found WordPress API endpoints:`, wpApiMatch)
        for (const endpoint of wpApiMatch) {
          try {
            const apiUrl = `${this.baseUrl}/${endpoint}`
            console.log(`[v0] Trying WordPress API: ${apiUrl}`)
            const apiResponse = await fetch(apiUrl)
            if (apiResponse.ok) {
              const apiData = await apiResponse.json()
              const properties = this.parseJSONProperties(apiData)
              if (properties.length > 0) {
                console.log(`[v0] Successfully extracted ${properties.length} properties from WordPress API`)
                return properties
              }
            }
          } catch (error) {
            console.log(`[v0] WordPress API failed:`, error)
          }
        }
      }

      return this.parseRealPropertiesFromHTML(html)
    } catch (error) {
      console.error(`[v0] Failed to fetch from ${url}:`, error)
      throw new Error(
        `No se pudo acceder a iChiloe.cl: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  }

  private extractFromNextData(nextData: any): IChiloeProperty[] {
    const properties: IChiloeProperty[] = []

    try {
      // Look for properties in various possible locations in Next.js data
      const possiblePaths = [
        nextData.props?.pageProps?.properties,
        nextData.props?.pageProps?.initialData?.properties,
        nextData.props?.pageProps?.data?.properties,
        nextData.query?.properties,
        nextData.buildId && nextData.props?.pageProps,
      ]

      for (const data of possiblePaths) {
        if (Array.isArray(data)) {
          console.log(`[v0] Found property array with ${data.length} items`)
          for (const item of data) {
            const property = this.convertToProperty(item)
            if (property && this.isValidProperty(property)) {
              properties.push(property)
            }
          }
          if (properties.length > 0) break
        }
      }

      return properties
    } catch (error) {
      console.error(`[v0] Error extracting from Next.js data:`, error)
      return []
    }
  }

  private convertToProperty(data: any): IChiloeProperty | null {
    if (!data || typeof data !== "object") return null

    try {
      return {
        title: data.title || data.name || data.titulo || data.post_title || "Propiedad sin título",
        price: this.formatPrice(data.price || data.precio || data.valor || data.meta?.price || "0"),
        area: this.formatArea(data.area || data.superficie || data.metros || data.meta?.area || ""),
        location: data.location || data.ubicacion || data.direccion || data.meta?.location || "Chiloé",
        imageUrl:
          data.image || data.imagen || data.photo || data.featured_image || "/placeholder.svg?height=200&width=300",
        propertyUrl: `${this.baseUrl}${data.url || data.link || data.permalink || "/propiedades/"}`,
        propertyType: this.extractPropertyType(data.type || data.tipo || data.post_type || data.title || ""),
        operation: data.operation || data.operacion || data.meta?.operation || "venta",
        commission: data.commission || data.comision || data.meta?.commission || "2.5%",
      }
    } catch (error) {
      console.error(`[v0] Error converting data to property:`, error)
      return null
    }
  }

  private parseRealPropertiesFromHTML(html: string): IChiloeProperty[] {
    const properties: IChiloeProperty[] = []

    try {
      console.log(`[v0] Starting HTML parsing...`)

      const propertyIndicators = [
        html.toLowerCase().includes("propiedad"),
        html.includes("$"),
        html.toLowerCase().includes("precio"),
        html.toLowerCase().includes("venta"),
        html.toLowerCase().includes("hectárea"),
        html.toLowerCase().includes("parcela"),
        html.toLowerCase().includes("terreno"),
        html.toLowerCase().includes("casa"),
      ]

      const indicatorCount = propertyIndicators.filter(Boolean).length
      console.log(`[v0] Property indicators found: ${indicatorCount}/8`)
      console.log(`[v0] Indicators:`, {
        propiedad: html.toLowerCase().includes("propiedad"),
        precio: html.includes("$") || html.toLowerCase().includes("precio"),
        venta: html.toLowerCase().includes("venta"),
        hectarea: html.toLowerCase().includes("hectárea"),
        parcela: html.toLowerCase().includes("parcela"),
        terreno: html.toLowerCase().includes("terreno"),
        casa: html.toLowerCase().includes("casa"),
      })

      if (indicatorCount < 3) {
        throw new Error(`Sitio no parece contener propiedades (solo ${indicatorCount}/8 indicadores encontrados)`)
      }

      const cardSelectors = [
        // WordPress post structures
        /<article[^>]*class="[^"]*(?:post|property|listing)[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
        // Generic property cards
        /<div[^>]*class="[^"]*(?:property|listing|card|item|propiedad)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        // Price-containing divs
        /<div[^>]*>[\s\S]*?\$[\d,]+[\s\S]*?<\/div>/gi,
        // Any container with both price and area
        /<[^>]*>[\s\S]*?\$[\d,]+[\s\S]*?hectárea[\s\S]*?<\/[^>]*>/gi,
      ]

      let totalMatches = 0
      for (const selector of cardSelectors) {
        let match
        while ((match = selector.exec(html)) !== null && totalMatches < 100) {
          totalMatches++
          const cardHtml = match[0]
          console.log(`[v0] Found potential property card ${totalMatches} (${cardHtml.length} chars)`)

          const property = this.extractPropertyFromCard(cardHtml)
          if (property && this.isValidProperty(property)) {
            console.log(`[v0] Valid property extracted: ${property.title}`)
            properties.push(property)
          }
        }
      }

      console.log(`[v0] Found ${totalMatches} potential cards, extracted ${properties.length} valid properties`)

      if (properties.length === 0) {
        console.log(`[v0] No structured properties found, analyzing text content...`)
        return this.extractFromPlainText(html)
      }

      return properties
    } catch (error) {
      console.error(`[v0] Error parsing HTML:`, error)
      throw error
    }
  }

  private async tryDirectFetch(url: string): Promise<IChiloeProperty[]> {
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
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    })

    console.log(`[v0] Direct fetch response status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    console.log(`[v0] Got HTML response (${html.length} characters)`)

    return this.parseRealPropertiesFromHTML(html)
  }

  private async tryWithDelay(url: string): Promise<IChiloeProperty[]> {
    console.log(`[v0] Trying with delay to allow JS loading...`)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    return this.tryDirectFetch(url)
  }

  private async tryAlternativeEndpoints(): Promise<IChiloeProperty[]> {
    console.log(`[v0] Trying alternative endpoints...`)

    const endpoints = [
      `${this.baseUrl}/wp-json/wp/v2/propiedades`,
      `${this.baseUrl}/api/propiedades`,
      `${this.baseUrl}/propiedades/feed/`,
      `${this.baseUrl}/sitemap.xml`,
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`[v0] Trying endpoint: ${endpoint}`)
        const response = await fetch(endpoint)

        if (response.ok) {
          const content = await response.text()
          console.log(`[v0] Got response from ${endpoint} (${content.length} chars)`)

          if (endpoint.includes("json")) {
            const jsonData = JSON.parse(content)
            const properties = this.parseJSONProperties(jsonData)
            if (properties.length > 0) return properties
          } else {
            const properties = this.parseRealPropertiesFromHTML(content)
            if (properties.length > 0) return properties
          }
        }
      } catch (error) {
        console.log(`[v0] Endpoint ${endpoint} failed:`, error)
        continue
      }
    }

    throw new Error("No alternative endpoints worked")
  }

  private extractPropertyFromCard(cardHtml: string): IChiloeProperty | null {
    try {
      console.log(`[v0] Extracting from card HTML sample:`, cardHtml.substring(0, 200))

      const titlePatterns = [
        /<h[1-6][^>]*>(.*?)<\/h[1-6]>/i,
        /<[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/[^>]*>/i,
        /<[^>]*class="[^"]*name[^"]*"[^>]*>(.*?)<\/[^>]*>/i,
        /<a[^>]*title="([^"]*)"[^>]*>/i,
        /<a[^>]*>(.*?)<\/a>/i,
      ]

      let title = ""
      for (const pattern of titlePatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          title = this.cleanText(match[1])
          if (title.length > 5) break
        }
      }

      const pricePatterns = [/\$[\d,]+(?:\.[\d]+)?/i, /[\d,]+(?:\.[\d]+)?\s*pesos/i, /precio[^>]*>[\s\S]*?\$?([\d,]+)/i]

      let price = ""
      for (const pattern of pricePatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          price = match[0].includes("$") ? match[0] : `$${match[0]}`
          break
        }
      }

      const areaPatterns = [
        /([\d,]+(?:\.[\d]+)?)\s*(hectáreas?|has?|m²|metros)/i,
        /superficie[^>]*>[\s\S]*?([\d,]+(?:\.[\d]+)?)\s*(hectáreas?|has?|m²)/i,
        /área[^>]*>[\s\S]*?([\d,]+(?:\.[\d]+)?)\s*(hectáreas?|has?|m²)/i,
      ]

      let area = ""
      for (const pattern of areaPatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          area = `${match[1]} ${match[2]}`
          break
        }
      }

      const locationPatterns = [
        /<[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/[^>]*>/i,
        /<[^>]*class="[^"]*address[^"]*"[^>]*>(.*?)<\/[^>]*>/i,
        /ubicación[^>]*>(.*?)<\/[^>]*>/i,
        /dirección[^>]*>(.*?)<\/[^>]*>/i,
      ]

      let location = ""
      for (const pattern of locationPatterns) {
        const match = cardHtml.match(pattern)
        if (match) {
          location = this.cleanText(match[1])
          if (location.length > 2) break
        }
      }

      console.log(`[v0] Extracted - Title: "${title}", Price: "${price}", Area: "${area}", Location: "${location}"`)

      if (title && price) {
        return {
          title,
          price,
          area,
          location: location || "Chiloé",
          imageUrl: "/placeholder.svg?height=200&width=300",
          propertyUrl: `${this.baseUrl}/propiedades/`,
          propertyType: this.extractPropertyType(title),
          operation: "venta",
          commission: "2.5%",
        }
      }

      return null
    } catch (error) {
      console.error(`[v0] Error extracting from card:`, error)
      return null
    }
  }

  private parseJSONProperties(jsonData: any): IChiloeProperty[] {
    try {
      const properties: IChiloeProperty[] = []
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]

      for (const item of dataArray) {
        if (item && typeof item === "object") {
          const property: IChiloeProperty = {
            title: item.title || item.name || item.titulo || "Propiedad sin título",
            price: this.formatPrice(item.price || item.precio || item.valor || "0"),
            area: this.formatArea(item.area || item.superficie || item.metros || ""),
            location: item.location || item.ubicacion || item.direccion || "Chiloé",
            imageUrl: item.image || item.imagen || item.photo || "/placeholder.svg?height=200&width=300",
            propertyUrl: `${this.baseUrl}${item.url || item.link || "/propiedades/"}`,
            propertyType: this.extractPropertyType(item.type || item.tipo || item.title || ""),
            operation: item.operation || item.operacion || "venta",
            commission: item.commission || item.comision || "2.5%",
          }
          properties.push(property)
        }
      }

      return properties
    } catch (error) {
      console.error(`[v0] Error parsing JSON properties:`, error)
      return []
    }
  }

  private formatPrice(price: any): string {
    if (typeof price === "number") {
      return `$${price.toLocaleString()}`
    }
    if (typeof price === "string") {
      const cleanPrice = price.replace(/[^\d]/g, "")
      if (cleanPrice) {
        return `$${Number(cleanPrice).toLocaleString()}`
      }
    }
    return "$0"
  }

  private formatArea(area: any): string {
    if (!area) return ""
    return String(area)
  }

  private isValidProperty(property: Partial<IChiloeProperty>): boolean {
    const isValid = !!(property.title && property.title.length > 5 && property.price)
    console.log(`[v0] Property validation - Title: "${property.title}", Price: "${property.price}", Valid: ${isValid}`)
    return isValid
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
    if (lowerTitle.includes("casa")) return "Casa"
    if (lowerTitle.includes("construccion") || lowerTitle.includes("comercial")) return "Comercial"
    if (lowerTitle.includes("hectárea")) return "Terreno"
    return "Propiedad"
  }

  async extractAllPages(): Promise<IChiloeProperty[]> {
    console.log("[v0] Starting REAL data extraction from iChiloe...")

    try {
      const properties = await this.extractProperties(1)
      console.log(`[v0] Successfully extracted ${properties.length} REAL properties from iChiloe`)
      return properties
    } catch (error) {
      console.error("[v0] Failed to extract real data from iChiloe:", error)
      throw error // Re-throw the error instead of returning mock data
    }
  }
}
