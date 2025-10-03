// Reverse geocoding utility for Chilean locations
// Uses Nominatim (OpenStreetMap) API for detailed location information

export interface ChileanLocationDetails {
  // Administrative divisions
  region?: string
  provincia?: string
  comuna?: string

  // Address components
  city?: string
  town?: string
  village?: string
  suburb?: string
  road?: string

  // Nearby features
  nearbyCities?: string[]
  nearbyTowns?: string[]

  // Raw data
  displayName: string
  addressType?: string

  // Coordinates
  lat: number
  lng: number
}

interface NominatimResponse {
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    suburb?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    province?: string
    country?: string
    road?: string
    house_number?: string
  }
  addresstype?: string
  lat: string
  lon: string
}

export class ReverseGeocoder {
  private cache = new Map<string, ChileanLocationDetails>()
  private requestQueue: Array<() => Promise<void>> = []
  private isProcessing = false
  private readonly RATE_LIMIT_MS = 1000 // 1 request per second for Nominatim

  /**
   * Get detailed location information for coordinates
   */
  async getLocationDetails(lat: number, lng: number): Promise<ChileanLocationDetails> {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const details = await this.fetchLocationDetails(lat, lng)
          this.cache.set(cacheKey, details)
          resolve(details)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.isProcessing) {
        this.processQueue()
      }
    })
  }

  /**
   * Get location details for multiple coordinates
   */
  async getMultipleLocationDetails(
    coordinates: Array<{ lat: number; lng: number }>,
  ): Promise<ChileanLocationDetails[]> {
    const results = await Promise.allSettled(coordinates.map(({ lat, lng }) => this.getLocationDetails(lat, lng)))

    return results
      .filter((result): result is PromiseFulfilledResult<ChileanLocationDetails> => result.status === "fulfilled")
      .map((result) => result.value)
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return

    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      if (request) {
        await request()
        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_MS))
      }
    }

    this.isProcessing = false
  }

  private async fetchLocationDetails(lat: number, lng: number): Promise<ChileanLocationDetails> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "SurRealista/1.0", // Required by Nominatim
        },
      })

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`)
      }

      const data: NominatimResponse = await response.json()

      return this.parseNominatimResponse(data, lat, lng)
    } catch (error) {
      console.error("[v0] Reverse geocoding error:", error)

      // Return basic info if geocoding fails
      return {
        displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
      }
    }
  }

  private parseNominatimResponse(data: NominatimResponse, lat: number, lng: number): ChileanLocationDetails {
    const address = data.address

    // Extract Chilean administrative divisions
    const region = this.normalizeRegion(address.state || address.region)
    const provincia = address.county || address.province
    const comuna = address.municipality || address.city || address.town

    // Extract city/town information
    const city = address.city
    const town = address.town
    const village = address.village
    const suburb = address.suburb

    // Build nearby cities list (from display name)
    const nearbyCities = this.extractNearbyCities(data.display_name)

    return {
      region,
      provincia,
      comuna,
      city,
      town,
      village,
      suburb,
      road: address.road,
      nearbyCities,
      displayName: data.display_name,
      addressType: data.addresstype,
      lat,
      lng,
    }
  }

  private normalizeRegion(region?: string): string | undefined {
    if (!region) return undefined

    // Map common variations to official Chilean region names
    const regionMap: Record<string, string> = {
      "Los Lagos": "Región de Los Lagos",
      "La Araucanía": "Región de La Araucanía",
      Valparaíso: "Región de Valparaíso",
      Metropolitana: "Región Metropolitana de Santiago",
      Biobío: "Región del Biobío",
      Maule: "Región del Maule",
      "O'Higgins": "Región del Libertador General Bernardo O'Higgins",
      Coquimbo: "Región de Coquimbo",
      Atacama: "Región de Atacama",
      Antofagasta: "Región de Antofagasta",
      Tarapacá: "Región de Tarapacá",
      "Arica y Parinacota": "Región de Arica y Parinacota",
      Aysén: "Región de Aysén del General Carlos Ibáñez del Campo",
      Magallanes: "Región de Magallanes y de la Antártica Chilena",
      Ñuble: "Región de Ñuble",
      "Los Ríos": "Región de Los Ríos",
    }

    // Check if region matches any key
    for (const [key, value] of Object.entries(regionMap)) {
      if (region.includes(key)) {
        return value
      }
    }

    // If already in full format, return as is
    if (region.startsWith("Región")) {
      return region
    }

    // Otherwise, add "Región de" prefix
    return `Región de ${region}`
  }

  private extractNearbyCities(displayName: string): string[] {
    // Extract city names from display name (comma-separated)
    const parts = displayName.split(",").map((p) => p.trim())

    // Filter out coordinates, country, and very short names
    return parts
      .filter((part) => {
        return part.length > 3 && !part.includes("Chile") && !part.match(/^-?\d+\.?\d*$/) && !part.match(/Región/)
      })
      .slice(0, 3) // Take first 3 relevant parts
  }

  /**
   * Format location details as a readable string
   */
  formatLocationString(details: ChileanLocationDetails): string {
    const parts: string[] = []

    if (details.road) parts.push(details.road)
    if (details.comuna) parts.push(details.comuna)
    if (details.provincia && details.provincia !== details.comuna) {
      parts.push(details.provincia)
    }
    if (details.region) parts.push(details.region)

    return parts.length > 0 ? parts.join(", ") : details.displayName
  }

  /**
   * Get a short location summary
   */
  getShortSummary(details: ChileanLocationDetails): string {
    if (details.comuna && details.region) {
      return `${details.comuna}, ${details.region.replace("Región de ", "")}`
    }
    if (details.city) {
      return details.city
    }
    if (details.town) {
      return details.town
    }
    return details.displayName.split(",")[0]
  }
}

export const reverseGeocoder = new ReverseGeocoder()
