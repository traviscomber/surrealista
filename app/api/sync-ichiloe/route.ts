import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { IChiloeExtractor } from "@/lib/scrapers/ichiloe-extractor"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const extractor = new IChiloeExtractor()

    console.log("[v0] Starting REAL iChiloe data extraction...")

    let iChiloeProperties: any[] = []

    try {
      iChiloeProperties = await extractor.extractAllPages()
    } catch (extractionError) {
      console.error("[v0] Extraction failed:", extractionError)
      return NextResponse.json(
        {
          success: false,
          error: `Error extrayendo datos reales de iChiloe: ${extractionError instanceof Error ? extractionError.message : "Error desconocido"}`,
          imported: 0,
          properties: [],
          details:
            "No se pudieron obtener datos reales del sitio web. Verifique que iChiloe.cl esté funcionando correctamente.",
        },
        { status: 500 },
      )
    }

    console.log(`[v0] Extracted ${iChiloeProperties.length} REAL properties from iChiloe`)

    if (iChiloeProperties.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No se encontraron propiedades reales en iChiloe.cl",
        imported: 0,
        properties: [],
        details: "El sitio está accesible pero no contiene propiedades en el formato esperado.",
      })
    }

    // Clean existing iChiloe properties from database...
    console.log("[v0] Cleaning existing iChiloe properties from database...")
    const { error: deleteError } = await supabase.from("properties_enhanced").delete().eq("import_source", "ichiloe")

    if (deleteError) {
      console.error("[v0] Error deleting existing properties:", deleteError)
    }

    const propertiesToInsert = iChiloeProperties.map((prop, index) => {
      const cleanPrice = Number.parseFloat(prop.price.replace(/[$,]/g, "")) || 0
      const lotSize = parseArea(prop.area)

      return {
        title: prop.title,
        description: `${prop.title}. Ubicación: ${prop.location}. ${prop.commission ? `Comisión: ${prop.commission}` : ""}`,
        price: cleanPrice,
        location: prop.location,
        address: prop.location,
        city: extractCity(prop.location),
        region: "Los Lagos",
        country: "Chile",
        property_type: prop.propertyType,
        status: "active",
        lot_size: lotSize,
        images: prop.imageUrl ? [prop.imageUrl] : [],
        amenities: [],
        import_source: "ichiloe",
        import_batch_id: `ichiloe_real_${new Date().toISOString().split("T")[0]}_${Date.now()}`,
        data_quality_score: 95, // High score for real extracted data
        featured: cleanPrice > 100000000, // Feature expensive properties
      }
    })

    console.log(`[v0] Inserting ${propertiesToInsert.length} REAL properties into database...`)

    const { data, error } = await supabase.from("properties_enhanced").insert(propertiesToInsert).select()

    if (error) {
      console.error("[v0] Database error inserting properties:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Error de base de datos: ${error.message}`,
          imported: 0,
          properties: [],
          details: error.details || "Error al insertar propiedades en la base de datos",
        },
        { status: 500 },
      )
    }

    console.log(`[v0] Successfully imported ${propertiesToInsert.length} REAL properties from iChiloe`)

    return NextResponse.json({
      success: true,
      imported: propertiesToInsert.length,
      properties: iChiloeProperties,
      message: `Se importaron ${propertiesToInsert.length} propiedades REALES de iChiloe.cl`,
      batch_id: propertiesToInsert[0]?.import_batch_id,
      source: "real_data_extraction",
    })
  } catch (error) {
    console.error("[v0] Critical error in iChiloe sync:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        imported: 0,
        properties: [],
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

function parseArea(areaString: string): number {
  if (!areaString) return 0

  const match = areaString.match(/([\d,]+\.?\d*)/)
  if (match) {
    const value = Number.parseFloat(match[1].replace(",", ""))
    if (areaString.toLowerCase().includes("hectárea") || areaString.toLowerCase().includes("has")) {
      return value * 10000 // Convert hectares to square meters
    }
    return value
  }
  return 0
}

function extractCity(location: string): string {
  if (!location) return "Chiloé"

  const parts = location.split(",")
  if (parts.length > 1) {
    return parts[1].trim()
  }

  // Common cities in Chiloé
  const cities = ["Castro", "Ancud", "Quellón", "Dalcahue", "Chonchi", "Curaco de Vélez"]
  for (const city of cities) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return city
    }
  }

  return parts[0].trim() || "Chiloé"
}

export async function GET() {
  return NextResponse.json({
    message: "iChiloe sync endpoint. Use POST to start sync.",
    status: "ready",
    endpoint: "/api/sync-ichiloe",
  })
}
