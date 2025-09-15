import { createClient } from "@supabase/supabase-js"

export class SIIService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  async searchProperty(rol: string) {
    try {
      const mockData = {
        rol,
        owner: "Propietario Ejemplo",
        address: "Dirección de ejemplo",
        commune: "Comuna",
        region: "Región",
        propertyType: "Casa",
        landArea: "500 m²",
        builtArea: "200 m²",
        taxValue: "$50.000.000",
        lastUpdate: new Date().toISOString(),
      }

      // Store search result in database
      const { data, error } = await this.supabase
        .from("sii_searches")
        .insert({
          rol,
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
      console.error("SII Service Error:", error)
      return {
        success: false,
        error: "Error searching SII property data",
      }
    }
  }

  async getPropertyHistory(rol: string) {
    try {
      const { data, error } = await this.supabase
        .from("sii_searches")
        .select("*")
        .eq("rol", rol)
        .order("created_at", { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || [],
      }
    } catch (error) {
      console.error("SII History Error:", error)
      return {
        success: false,
        error: "Error fetching property history",
      }
    }
  }
}
