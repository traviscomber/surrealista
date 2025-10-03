import type { KMZData } from "./kmz-reader"
import {
  calculateDistance,
  findNearestAirport,
  findNearestInternationalAirport,
  findLocationDetails,
} from "@/lib/chile-geographic-data"

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
   * Calculate access routes from Santiago and nearby cities with REAL data
   */
  private calculateAccessRoutes(centerPoint: { lat: number; lng: number }): AccessRoute[] {
    const routes: AccessRoute[] = []

    const santiagoLat = -33.4489
    const santiagoLng = -70.6693

    const distanceFromSantiago = calculateDistance(santiagoLat, santiagoLng, centerPoint.lat, centerPoint.lng)

    // Land route from Santiago
    routes.push({
      from: "Santiago",
      to: "Propiedad",
      type: "land",
      distance: Math.round(distanceFromSantiago),
      duration: `${Math.round(distanceFromSantiago / 80)} horas aprox.`,
      description: "Ruta 5 Sur, luego caminos regionales",
    })

    const nearestAirport = findNearestAirport(centerPoint.lat, centerPoint.lng)
    const distanceToAirport = calculateDistance(
      centerPoint.lat,
      centerPoint.lng,
      nearestAirport.lat,
      nearestAirport.lng,
    )

    if (nearestAirport.code !== "SCL") {
      routes.push({
        from: "Santiago (SCL)",
        to: `${nearestAirport.city} (${nearestAirport.code})`,
        type: "air",
        distance: Math.round(calculateDistance(santiagoLat, santiagoLng, nearestAirport.lat, nearestAirport.lng)),
        duration: "1-2 horas",
        description: `Vuelo a ${nearestAirport.name}, luego ${Math.round(distanceToAirport)} km por tierra`,
      })
    }

    const locationDetails = findLocationDetails(centerPoint.lat, centerPoint.lng)
    if (locationDetails.nearestRegionalCapital && locationDetails.region) {
      const regionalCapitalDistance = locationDetails.nearestRegionalCapital.distance

      if (regionalCapitalDistance > 10) {
        // Only add if more than 10km away
        routes.push({
          from: locationDetails.nearestRegionalCapital.name,
          to: "Propiedad",
          type: "land",
          distance: Math.round(regionalCapitalDistance),
          duration: `${Math.round(regionalCapitalDistance / 60)} horas aprox.`,
          description: `Desde capital regional por caminos locales`,
        })
      }
    }

    return routes
  }

  /**
   * Calculate distances to key locations with REAL Chilean data
   */
  private calculateDistances(centerPoint: { lat: number; lng: number }): DistanceInfo[] {
    const distances: DistanceInfo[] = []

    const locationDetails = findLocationDetails(centerPoint.lat, centerPoint.lng)

    // Add regional capital
    if (locationDetails.nearestRegionalCapital && locationDetails.region) {
      distances.push({
        name: locationDetails.nearestRegionalCapital.name,
        type: "provincial_capital",
        typeLabel: `Capital Regional (${locationDetails.region.name})`,
        distance: Math.round(locationDetails.nearestRegionalCapital.distance),
        description: `Capital de ${locationDetails.region.name}`,
      })
    }

    // Add provincial capital
    if (locationDetails.nearestProvincialCapital && locationDetails.province) {
      distances.push({
        name: locationDetails.nearestProvincialCapital.name,
        type: "provincial_capital",
        typeLabel: `Capital Provincial (${locationDetails.province.name})`,
        distance: Math.round(locationDetails.nearestProvincialCapital.distance),
        description: `Capital de la Provincia de ${locationDetails.province.name}`,
      })
    }

    // Add commune capital
    if (locationDetails.nearestCommuneCapital && locationDetails.comuna) {
      distances.push({
        name: locationDetails.nearestCommuneCapital.name,
        type: "commune_capital",
        typeLabel: `Capital Comunal (${locationDetails.comuna.name})`,
        distance: Math.round(locationDetails.nearestCommuneCapital.distance),
        description: `Centro administrativo de la comuna de ${locationDetails.comuna.name}`,
      })
    }

    const nearestRegionalAirport = findNearestAirport(centerPoint.lat, centerPoint.lng)
    const distanceToRegional = calculateDistance(
      centerPoint.lat,
      centerPoint.lng,
      nearestRegionalAirport.lat,
      nearestRegionalAirport.lng,
    )

    distances.push({
      name: `${nearestRegionalAirport.name} (${nearestRegionalAirport.code})`,
      type: "airport",
      typeLabel: nearestRegionalAirport.type === "international" ? "Aeropuerto Internacional" : "Aeropuerto Regional",
      distance: Math.round(distanceToRegional),
      description: `${nearestRegionalAirport.description} - ${nearestRegionalAirport.city}`,
    })

    const nearestInternational = findNearestInternationalAirport(centerPoint.lat, centerPoint.lng)
    const distanceToInternational = calculateDistance(
      centerPoint.lat,
      centerPoint.lng,
      nearestInternational.lat,
      nearestInternational.lng,
    )

    // Only add if different from regional airport
    if (nearestInternational.code !== nearestRegionalAirport.code) {
      distances.push({
        name: `${nearestInternational.name} (${nearestInternational.code})`,
        type: "airport",
        typeLabel: "Aeropuerto Internacional",
        distance: Math.round(distanceToInternational),
        description: `${nearestInternational.description} - ${nearestInternational.city}`,
      })
    }

    return distances
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
