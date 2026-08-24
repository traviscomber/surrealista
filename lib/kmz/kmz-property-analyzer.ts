export interface PropertyAnalysis {
  region: string
  commune: string
  sector: string
  confidence: number
  hectares: number
  area_m2: number
  features: {
    hasRiver: boolean
    hasLake: boolean
    hasSeaAccess: boolean
    nearbyRoad: boolean
    roadDistance?: number
  }
  neighboringProperties: Array<{
    direction: string
    distance: number
  }>
  marketAnalysis: {
    pricePerHectare: number
    estimatedValue: number
    demandLevel: "high" | "medium" | "low"
    marketAlert: string
  }
  processedAt: string
}
