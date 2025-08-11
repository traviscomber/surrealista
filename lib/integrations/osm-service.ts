/**
 * Servicio para integración con OpenStreetMap
 */

export interface OSMAmenity {
  id: string
  name: string
  type: string
  category: string
  distance: number
  rating?: number
  coordinates: {
    lat: number
    lng: number
  }
}

export interface OSMNeighborhoodData {
  coordinates: {
    lat: number
    lng: number
  }
  amenities: {
    education: OSMAmenity[]
    healthcare: OSMAmenity[]
    shopping: OSMAmenity[]
    restaurants: OSMAmenity[]
    transport: OSMAmenity[]
    recreation: OSMAmenity[]
  }
  walkScore: number
  transitScore: number
  bikeScore: number
}

export class OSMService {
  private baseUrl = "https://overpass-api.de/api/interpreter"

  async getNeighborhoodData(lat: number, lng: number, radius = 1000): Promise<OSMNeighborhoodData> {
    // Simulación de datos de OSM para Puerto Varas
    return {
      coordinates: { lat, lng },
      amenities: {
        education: [
          {
            id: "school_1",
            name: "Colegio San Francisco",
            type: "school",
            category: "education",
            distance: 450,
            rating: 4.2,
            coordinates: { lat: lat + 0.004, lng: lng + 0.002 },
          },
          {
            id: "university_1",
            name: "Universidad Austral - Sede Puerto Varas",
            type: "university",
            category: "education",
            distance: 1200,
            rating: 4.5,
            coordinates: { lat: lat + 0.008, lng: lng + 0.005 },
          },
        ],
        healthcare: [
          {
            id: "hospital_1",
            name: "Hospital Puerto Varas",
            type: "hospital",
            category: "healthcare",
            distance: 800,
            rating: 4.0,
            coordinates: { lat: lat + 0.006, lng: lng + 0.003 },
          },
          {
            id: "pharmacy_1",
            name: "Farmacia Cruz Verde",
            type: "pharmacy",
            category: "healthcare",
            distance: 300,
            rating: 4.1,
            coordinates: { lat: lat + 0.002, lng: lng + 0.001 },
          },
        ],
        shopping: [
          {
            id: "mall_1",
            name: "Paseo Costanera",
            type: "shopping_centre",
            category: "shopping",
            distance: 600,
            rating: 4.3,
            coordinates: { lat: lat + 0.005, lng: lng + 0.002 },
          },
          {
            id: "supermarket_1",
            name: "Líder Puerto Varas",
            type: "supermarket",
            category: "shopping",
            distance: 400,
            rating: 4.0,
            coordinates: { lat: lat + 0.003, lng: lng + 0.002 },
          },
        ],
        restaurants: [
          {
            id: "restaurant_1",
            name: "La Marca Restaurant",
            type: "restaurant",
            category: "restaurants",
            distance: 250,
            rating: 4.6,
            coordinates: { lat: lat + 0.002, lng: lng + 0.001 },
          },
          {
            id: "cafe_1",
            name: "Café Danes",
            type: "cafe",
            category: "restaurants",
            distance: 180,
            rating: 4.4,
            coordinates: { lat: lat + 0.001, lng: lng + 0.001 },
          },
        ],
        transport: [
          {
            id: "bus_stop_1",
            name: "Paradero Costanera",
            type: "bus_stop",
            category: "transport",
            distance: 150,
            coordinates: { lat: lat + 0.001, lng: lng + 0.0005 },
          },
          {
            id: "airport_1",
            name: "Aeropuerto El Tepual",
            type: "aerodrome",
            category: "transport",
            distance: 25000,
            coordinates: { lat: lat - 0.2, lng: lng - 0.1 },
          },
        ],
        recreation: [
          {
            id: "park_1",
            name: "Parque Philippi",
            type: "park",
            category: "recreation",
            distance: 500,
            rating: 4.5,
            coordinates: { lat: lat + 0.004, lng: lng + 0.003 },
          },
          {
            id: "beach_1",
            name: "Playa Puerto Varas",
            type: "beach",
            category: "recreation",
            distance: 800,
            rating: 4.7,
            coordinates: { lat: lat + 0.006, lng: lng + 0.004 },
          },
        ],
      },
      walkScore: 78,
      transitScore: 65,
      bikeScore: 72,
    }
  }

  async calculateWalkScore(amenities: OSMAmenity[]): Promise<number> {
    // Algoritmo simplificado para calcular walk score
    const weights = {
      education: 0.2,
      healthcare: 0.15,
      shopping: 0.25,
      restaurants: 0.15,
      transport: 0.15,
      recreation: 0.1,
    }

    let score = 0
    Object.entries(weights).forEach(([category, weight]) => {
      const categoryAmenities = amenities.filter((a) => a.category === category)
      const nearbyCount = categoryAmenities.filter((a) => a.distance <= 500).length
      score += Math.min(nearbyCount * 20, 100) * weight
    })

    return Math.round(score)
  }
}

export const osmService = new OSMService()
