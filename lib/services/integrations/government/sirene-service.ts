import { createClient } from "@supabase/supabase-js"

export class SIRENEService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  async searchProperty(address: string) {
    try {
      const mockData = {
        address,
        coordinates: {
          lat: -33.4489,
          lng: -70.6693,
        },
        neighborhood: "Barrio Ejemplo",
        zone: "Zona Residencial",
        urbanPlan: "Plan Regulador",
        restrictions: ["Altura máxima 3 pisos"],
        services: ["Agua", "Luz", "Gas", "Alcantarillado"],
        lastUpdate: new Date().toISOString(),
      }

      // Store search result in database
      const { data, error } = await this.supabase
        .from("sirene_searches")
        .insert({
          address,
          search_data: mockData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: mockData,
      }
    } catch (error) {
      console.error("SIRENE Service Error:", error)
      return {
        success: false,
        error: "Error searching SIRENE property data",
      }
    }
  }

  async getUrbanPlanInfo(coordinates: { lat: number; lng: number }) {
    try {
      const mockData = {
        zone: "Zona Residencial R1",
        maxHeight: "3 pisos",
        buildingCoefficient: "1.2",
        occupancyCoefficient: "0.6",
        minSetback: "3 metros",
        restrictions: ["No comercio", "Solo residencial"],
      }

      return {
        success: true,
        data: mockData,
      }
    } catch (error) {
      console.error("SIRENE Urban Plan Error:", error)
      return {
        success: false,
        error: "Error fetching urban plan information",
      }
    }
  }
}
