import type { KMZData } from "./kmz-reader"

export interface NeighboringProperty {
  rol: string
  distance: number // km
  coordinates: {
    lat: number
    lng: number
  }
  source: string // SII, CONAF, INDAP, etc.
  additionalInfo?: string
}

export interface AccessRoute {
  from: string
  to: string
  type: "land" | "air"
  distance: number // km
  duration: string
  description?: string
}

export interface DistanceInfo {
  name: string
  type: "provincial_capital" | "commune_capital" | "nearest_town" | "airport"
  typeLabel: string
  distance: number // km
  description?: string
}

export interface NeighborhoodAnalysis {
  centerPoint: {
    lat: number
    lng: number
  }
  searchRadius: number // km
  neighboringProperties: NeighboringProperty[]
  accessRoutes: AccessRoute[]
  distances: DistanceInfo[]
  dataSources: string[]
}

class NeighborhoodAnalyzer {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Get center point from KMZ files
   */
  private getCenterPoint(kmzFiles: KMZData[]): { lat: number; lng: number } {
    let totalLat = 0
    let totalLng = 0
    let count = 0

    for (const kmz of kmzFiles) {
      for (const placemark of kmz.placemarks) {
        for (const coord of placemark.coordinates) {
          totalLat += coord[1] // lat
          totalLng += coord[0] // lng
          count++
        }
      }
    }

    return {
      lat: totalLat / count,
      lng: totalLng / count,
    }
  }

  /**
   * Find neighboring properties within radius
   * In production, this would query SII, CONAF, INDAP, CIREN, ODEPA, FAO APIs
   */
  private async findNeighboringProperties(
    centerPoint: { lat: number; lng: number },
    radius: number,
  ): Promise<NeighboringProperty[]> {
    const dataSources = [
      this.querySII(centerPoint, radius),
      this.queryCONAF(centerPoint, radius),
      this.queryINDAP(centerPoint, radius),
    ]

    const results = await Promise.all(dataSources)
    return results.flat().filter((prop) => prop.distance <= radius)
  }

  private async querySII(centerPoint: { lat: number; lng: number }, radius: number): Promise<NeighboringProperty[]> {
    // Mock SII data - In production, query real SII API
    return [
      {
        rol: "1234-567",
        distance: 1.2,
        coordinates: { lat: centerPoint.lat + 0.01, lng: centerPoint.lng + 0.01 },
        source: "SII",
        additionalInfo: "Propiedad agrícola, 50 hectáreas",
      },
      {
        rol: "1234-568",
        distance: 2.5,
        coordinates: { lat: centerPoint.lat - 0.02, lng: centerPoint.lng + 0.015 },
        source: "SII",
        additionalInfo: "Propiedad forestal, 120 hectáreas",
      },
    ]
  }

  private async queryCONAF(centerPoint: { lat: number; lng: number }, radius: number): Promise<NeighboringProperty[]> {
    // Mock CONAF data
    return [
      {
        rol: "1234-569",
        distance: 3.8,
        coordinates: { lat: centerPoint.lat + 0.03, lng: centerPoint.lng - 0.02 },
        source: "CONAF",
        additionalInfo: "Área protegida, bosque nativo",
      },
    ]
  }

  private async queryINDAP(centerPoint: { lat: number; lng: number }, radius: number): Promise<NeighboringProperty[]> {
    // Mock INDAP data
    return [
      {
        rol: "1234-570",
        distance: 4.2,
        coordinates: { lat: centerPoint.lat - 0.035, lng: centerPoint.lng - 0.025 },
        source: "INDAP",
        additionalInfo: "Pequeño productor agrícola",
      },
    ]
  }

  /**
   * Calculate access routes from Santiago and nearby cities
   */
  private calculateAccessRoutes(centerPoint: { lat: number; lng: number }): AccessRoute[] {
    // Santiago coordinates
    const santiagoLat = -33.4489
    const santiagoLng = -70.6693

    const distanceFromSantiago = this.calculateDistance(santiagoLat, santiagoLng, centerPoint.lat, centerPoint.lng)

    const routes: AccessRoute[] = [
      {
        from: "Santiago",
        to: "Propiedad",
        type: "land",
        distance: Math.round(distanceFromSantiago),
        duration: `${Math.round(distanceFromSantiago / 80)} horas`,
        description: "Ruta 5 Sur, luego camino rural",
      },
      {
        from: "Santiago",
        to: "Aeropuerto más cercano",
        type: "air",
        distance: Math.round(distanceFromSantiago * 0.8),
        duration: "1.5 horas",
        description: "Vuelo directo a aeropuerto regional",
      },
    ]

    return routes
  }

  /**
   * Calculate distances to key locations
   */
  private calculateDistances(centerPoint: { lat: number; lng: number }): DistanceInfo[] {
    // Mock data - In production, use real coordinates from Chilean cities database
    return [
      {
        name: "Capital Provincial",
        type: "provincial_capital",
        typeLabel: "Capital Provincial",
        distance: 45,
        description: "Ciudad principal de la provincia",
      },
      {
        name: "Capital Comunal",
        type: "commune_capital",
        typeLabel: "Capital de la Comuna",
        distance: 18,
        description: "Centro administrativo de la comuna",
      },
      {
        name: "Pueblo más cercano",
        type: "nearest_town",
        typeLabel: "Pueblo con Servicios Básicos",
        distance: 8,
        description: "Supermercado, farmacia, servicios básicos",
      },
      {
        name: "Aeropuerto Regional",
        type: "airport",
        typeLabel: "Aeropuerto",
        distance: 52,
        description: "Vuelos diarios a Santiago",
      },
      {
        name: "Aeropuerto Internacional SCL",
        type: "airport",
        typeLabel: "Aeropuerto Internacional",
        distance: 680,
        description: "Aeropuerto Arturo Merino Benítez, Santiago",
      },
    ]
  }

  /**
   * Main analysis function
   */
  async analyzeNeighborhood(kmzFiles: KMZData[], searchRadius: number): Promise<NeighborhoodAnalysis> {
    const centerPoint = this.getCenterPoint(kmzFiles)

    const [neighboringProperties, accessRoutes, distances] = await Promise.all([
      this.findNeighboringProperties(centerPoint, searchRadius),
      Promise.resolve(this.calculateAccessRoutes(centerPoint)),
      Promise.resolve(this.calculateDistances(centerPoint)),
    ])

    const dataSources = ["SII", "CONAF", "INDAP", "CIREN", "ODEPA", "FAO"]

    return {
      centerPoint,
      searchRadius,
      neighboringProperties,
      accessRoutes,
      distances,
      dataSources,
    }
  }
}

export const neighborhoodAnalyzer = new NeighborhoodAnalyzer()
