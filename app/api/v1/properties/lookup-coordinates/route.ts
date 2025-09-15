import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
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
  const regions = [
    { name: "Región Metropolitana", lat: -33.4489, lng: -70.6693, cities: ["Santiago", "Las Condes", "Providencia"] },
    { name: "Valparaíso", lat: -33.0472, lng: -71.6127, cities: ["Valparaíso", "Viña del Mar", "Quilpué"] },
    { name: "Los Lagos", lat: -41.4693, lng: -72.9424, cities: ["Puerto Varas", "Puerto Montt", "Osorno"] },
    { name: "Biobío", lat: -36.8201, lng: -73.0444, cities: ["Concepción", "Talcahuano", "Chillán"] },
  ]

  // Use roll number to deterministically select region
  const regionIndex = Number.parseInt(rollNumber.replace(/\D/g, "")) % regions.length
  const selectedRegion = regions[regionIndex]

  // Add some random variation to coordinates (within ~5km)
  const latVariation = (Math.random() - 0.5) * 0.05
  const lngVariation = (Math.random() - 0.5) * 0.05

  const cityIndex = Number.parseInt(rollNumber.slice(-1)) % selectedRegion.cities.length

  return {
    coordinates: {
      lat: selectedRegion.lat + latVariation,
      lng: selectedRegion.lng + lngVariation,
    },
    address: `Calle Ejemplo ${Math.floor(Math.random() * 9999) + 1}`,
    city: selectedRegion.cities[cityIndex],
    region: selectedRegion.name,
    rollNumber: rollNumber,
    source: "mock_government_api",
  }
}
