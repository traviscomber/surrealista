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
    console.log(requestId, "[v0] Starting KMZ region mapping update")

    const supabase = await createClient()

    // IMPORTANT: Update KMZ_COLLECTION table (the actual KMZ files), not just locations
    // Get all KMZ files without region assignment
    const { data: unassignedKMZ, error: getKMZError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region")
      .is("region", null)
      .limit(5000)

    if (getKMZError) {
      console.error(requestId, "[v0] Error fetching unassigned KMZ files:", getKMZError)
      return NextResponse.json({ error: getKMZError.message }, { status: 500 })
    }

    if (!unassignedKMZ || unassignedKMZ.length === 0) {
      console.log(requestId, "[v0] No KMZ files to update")
      return NextResponse.json({ message: "No KMZ files to update", updated: 0, kmzUpdated: 0 })
    }

    console.log(requestId, "[v0] Found", unassignedKMZ.length, "unassigned KMZ files to process")

    // Process each KMZ file and assign region based on file name
    const kmzUpdates: Array<{ id: string; region: string }> = []

    unassignedKMZ.forEach((kmz: any) => {
      let region: string | null = null
      const fileNameLower = (kmz.file_name || "").toLowerCase()

      // Try to find region from file name
      for (const [city, foundRegion] of Object.entries(CITY_REGION_MAP)) {
        if (fileNameLower.includes(city)) {
          region = foundRegion as string
          break
        }
      }

      // If still no region found, default to Los Lagos (largest dataset)
      if (!region) {
        region = "Los Lagos"
      }

      kmzUpdates.push({ id: kmz.id, region })
    })

    // Batch update all KMZ files with assigned regions
    let kmzUpdateCount = 0
    for (const update of kmzUpdates) {
      const { error: updateError } = await supabase
        .from("kmz_collection")
        .update({ region: update.region })
        .eq("id", update.id)

      if (!updateError) {
        kmzUpdateCount++
      } else {
        console.error(requestId, "[v0] Error updating KMZ", update.id, ":", updateError)
      }
    }

    console.log(requestId, "[v0] Updated", kmzUpdateCount, "KMZ files with regions")

    // ALSO update kmz_location_index for consistency
    const { data: allLocations, error: getLocError } = await supabase
      .from("kmz_location_index")
      .select("id, name, city, region")
      .is("region", null)
      .limit(5000)

    if (getLocError) {
      console.warn(requestId, "[v0] Warning: Could not fetch locations for update:", getLocError)
    } else if (allLocations && allLocations.length > 0) {
      console.log(requestId, "[v0] Found", allLocations.length, "locations to update")

      const locUpdates: Array<{ id: string; region: string }> = []
      allLocations.forEach((loc: any) => {
        let region = loc.region

        if (!region && loc.city) {
          const cityLower = (loc.city || "").toLowerCase()
          region = CITY_REGION_MAP[cityLower] as string | undefined || "Los Lagos"
        }

        if (!region && loc.name) {
          const nameLower = (loc.name || "").toLowerCase()
          for (const [city, foundRegion] of Object.entries(CITY_REGION_MAP)) {
            if (nameLower.includes(city)) {
              region = foundRegion as string
              break
            }
          }
        }

        if (!region) {
          region = "Los Lagos"
        }

        locUpdates.push({ id: loc.id, region })
      })

      let locUpdateCount = 0
      for (const update of locUpdates) {
        const { error: updateError } = await supabase
          .from("kmz_location_index")
          .update({ region: update.region })
          .eq("id", update.id)

        if (!updateError) {
          locUpdateCount++
        }
      }

      console.log(requestId, "[v0] Updated", locUpdateCount, "location regions")
    }

    return NextResponse.json({
      success: true,
      kmzUpdated: kmzUpdateCount,
      kmzTotal: unassignedKMZ.length,
      message: `Updated ${kmzUpdateCount} KMZ files with region assignments`,
    })
  } catch (error: any) {
    console.error(requestId, "[v0] Error:", error.message)
    return NextResponse.json(
      { error: "Error updating regions" },
      { status: 500 }
    )
  }
}
