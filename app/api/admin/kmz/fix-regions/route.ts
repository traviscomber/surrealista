import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Chilean city to region mapping
const CITY_REGION_MAP: Record<string, string> = {
  "temuco": "La Araucanía",
  "villarrica": "La Araucanía",
  "pucón": "La Araucanía",
  "angol": "La Araucanía",
  "traiguén": "La Araucanía",
  "collipulli": "La Araucanía",
  
  "santiago": "Metropolitana",
  "maipú": "Metropolitana",
  "ñuñoa": "Metropolitana",
  "providencia": "Metropolitana",
  "las condes": "Metropolitana",
  "vitacura": "Metropolitana",
  "puente alto": "Metropolitana",
  "san bernardo": "Metropolitana",
  
  "osorno": "Los Lagos",
  "puerto montt": "Los Lagos",
  "puerto varas": "Los Lagos",
  "ancud": "Los Lagos",
  "castro": "Los Lagos",
  "puerto occidente": "Los Lagos",
  "entre lagos": "Los Lagos",
  
  "aysén": "Aysén",
  "coyhaique": "Aysén",
  "villa santa lucía": "Aysén",
  
  "punta arenas": "Magallanes",
  "puerto natales": "Magallanes",
  "porvenir": "Magallanes",
  
  "valdivia": "Los Ríos",
  "la unión": "Los Ríos",
  "corral": "Los Ríos",
  
  "puerto varas": "Los Lagos",
  "puerto montt": "Los Lagos",
  "frutillar": "Los Lagos",
  
  "valparaíso": "Valparaíso",
  "viña del mar": "Valparaíso",
  "quintero": "Valparaíso",
  "concón": "Valparaíso",
  
  "antofagasta": "Antofagasta",
  "calama": "Antofagasta",
  "tocopilla": "Antofagasta",
  
  "la serena": "Coquimbo",
  "coquimbo": "Coquimbo",
  "ovalle": "Coquimbo",
  
  "copiapó": "Atacama",
  "caldera": "Atacama",
  "chañaral": "Atacama",
  
  "iquique": "Tarapacá",
  "alto hospicio": "Tarapacá",
  "pozo almonte": "Tarapacá",
  
  "arica": "Arica y Parinacota",
  "putre": "Arica y Parinacota",
  
  "concepción": "Bío Bío",
  "talcahuano": "Bío Bío",
  "los ángeles": "Bío Bío",
  "chillán": "Bío Bío",
  
  "curicó": "Maule",
  "talca": "Maule",
  "linares": "Maule",
  "longaví": "Maule",
  "constitución": "Maule",
}

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] Starting region mapping update")

    const supabase = await createClient()

    // Get all locations
    const { data: allLocations, error: getError } = await supabase
      .from("kmz_location_index")
      .select("id, name, city, region")
      .is("region", null)
      .limit(5000) // Increased from 1000 to process larger KMZ batches

    if (getError) {
      console.error(requestId, "[v0] Error fetching locations:", getError)
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    if (!allLocations || allLocations.length === 0) {
      console.log(requestId, "[v0] No locations to update")
      return NextResponse.json({ message: "No locations to update", updated: 0 })
    }

    console.log(requestId, "[v0] Found", allLocations.length, "locations to update")

    // Process each location and update region
    const updates: Array<{ id: string; region: string }> = []

    allLocations.forEach((loc: any) => {
      let region = loc.region

      // Try to find region from city
      if (!region && loc.city) {
        const cityLower = (loc.city || "").toLowerCase()
        region = CITY_REGION_MAP[cityLower]
      }

      // Try to find region from name
      if (!region && loc.name) {
        const nameLower = (loc.name || "").toLowerCase()
        for (const [city, foundRegion] of Object.entries(CITY_REGION_MAP)) {
          if (nameLower.includes(city)) {
            region = foundRegion
            break
          }
        }
      }

      // Default to Los Lagos if still no region (since most data seems to be from there)
      if (!region) {
        region = "Los Lagos"
      }

      updates.push({ id: loc.id, region })
    })

    // Batch update all locations
    let updateCount = 0
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("kmz_location_index")
        .update({ region: update.region })
        .eq("id", update.id)

      if (!updateError) {
        updateCount++
      }
    }

    console.log(requestId, "[v0] Updated", updateCount, "location regions")

    return NextResponse.json({
      success: true,
      updated: updateCount,
      total: allLocations.length,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Error:", error.message)
    return NextResponse.json(
      { error: "Error updating regions" },
      { status: 500 }
    )
  }
}
