import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAllRegions } from "@/lib/chile-locations"

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return NextResponse.json({ success: false, error: "Número de rol requerido" }, { status: 400 })
    }

    // In production, this would integrate with SII or other government APIs
    const mockCoordinates = generateMockCoordinates(rollNumber)

    // Store the lookup in database for tracking
    const { data: lookupRecord, error: dbError } = await supabase
      .from("roll_number_lookups")
      .insert({
        roll_number: rollNumber,
        coordinates: mockCoordinates.coordinates,
        address: mockCoordinates.address,
        city: mockCoordinates.city,
        region: mockCoordinates.region,
        provincia: mockCoordinates.provincia,
        comuna: mockCoordinates.comuna,
        lookup_date: new Date().toISOString(),
        source: "mock_service",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Continue even if DB insert fails
    }

    return NextResponse.json({
      success: true,
      data: mockCoordinates,
    })
  } catch (error) {
    console.error("Coordinate lookup error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

function generateMockCoordinates(rollNumber: string) {
  const allRegions = getAllRegions()

  // Detailed region data with provincias and comunas
  const regionData = [
    {
      region: allRegions.find((r) => r.code === "10")!,
      provincia: "Llanquihue",
      comunas: ["Puerto Varas", "Puerto Montt", "Frutillar", "Llanquihue"],
      lat: -41.4693,
      lng: -72.9424,
    },
    {
      region: allRegions.find((r) => r.code === "14")!,
      provincia: "Valdivia",
      comunas: ["Valdivia", "Panguipulli", "Mariquina", "Lanco"],
      lat: -39.8142,
      lng: -73.2459,
    },
    {
      region: allRegions.find((r) => r.code === "09")!,
      provincia: "Cautín",
      comunas: ["Pucón", "Villarrica", "Temuco", "Curarrehue"],
      lat: -39.2819,
      lng: -71.9722,
    },
    {
      region: allRegions.find((r) => r.code === "10")!,
      provincia: "Osorno",
      comunas: ["Osorno", "Puerto Octay", "Puyehue", "Purranque"],
      lat: -40.5736,
      lng: -73.1353,
    },
  ]

  // Use roll number to deterministically select region
  const regionIndex = Number.parseInt(rollNumber.replace(/\D/g, "")) % regionData.length
  const selectedData = regionData[regionIndex]

  // Select comuna
  const comunaIndex = Number.parseInt(rollNumber.slice(-1)) % selectedData.comunas.length
  const selectedComuna = selectedData.comunas[comunaIndex]

  // Add some random variation to coordinates (within ~5km)
  const latVariation = (Math.random() - 0.5) * 0.05
  const lngVariation = (Math.random() - 0.5) * 0.05

  return {
    coordinates: {
      lat: selectedData.lat + latVariation,
      lng: selectedData.lng + lngVariation,
    },
    address: `Calle Ejemplo ${Math.floor(Math.random() * 9999) + 1}`,
    city: selectedComuna,
    region: selectedData.region.shortName,
    provincia: selectedData.provincia,
    comuna: selectedComuna,
    rollNumber: rollNumber,
    source: "mock_government_api",
  }
}
