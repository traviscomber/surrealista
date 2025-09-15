import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const coordinateData = await request.json()

    if (!coordinateData.rollNumber || !coordinateData.coordinates) {
      return NextResponse.json({ success: false, error: "Datos de coordenadas incompletos" }, { status: 400 })
    }

    const { data: existingProperty } = await supabase
      .from("properties")
      .select("*")
      .eq("roll_number", coordinateData.rollNumber)
      .single()

    let property
    if (existingProperty) {
      // Update existing property
      const { data: updatedProperty, error: updateError } = await supabase
        .from("properties")
        .update({
          latitude: coordinateData.coordinates.lat,
          longitude: coordinateData.coordinates.lng,
          address: coordinateData.address,
          city: coordinateData.city,
          region: coordinateData.region,
          coordinate_source: coordinateData.source,
          coordinate_extracted_at: coordinateData.extractedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("roll_number", coordinateData.rollNumber)
        .select()

      if (updateError) {
        console.error("Property update error:", updateError)
        return NextResponse.json({ success: false, error: "Error al actualizar propiedad" }, { status: 500 })
      }
      property = updatedProperty
    } else {
      const propertyTitle = coordinateData.address
        ? `Propiedad en ${coordinateData.address}`
        : `Propiedad ROL ${coordinateData.rollNumber}`

      // Insert new property
      const { data: newProperty, error: insertError } = await supabase
        .from("properties")
        .insert({
          roll_number: coordinateData.rollNumber,
          title: propertyTitle, // Added required title field
          price: 0, // Added default price value to satisfy NOT NULL constraint
          property_type: "RESIDENTIAL", // Added default property_type to satisfy NOT NULL constraint
          latitude: coordinateData.coordinates.lat,
          longitude: coordinateData.coordinates.lng,
          address: coordinateData.address,
          city: coordinateData.city,
          region: coordinateData.region,
          coordinate_source: coordinateData.source,
          coordinate_extracted_at: coordinateData.extractedAt,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error("Property insert error:", insertError)
        return NextResponse.json({ success: false, error: "Error al guardar propiedad" }, { status: 500 })
      }
      property = newProperty
    }

    const { error: logError } = await supabase.from("coordinate_extraction_log").insert({
      roll_number: coordinateData.rollNumber,
      coordinates: coordinateData.coordinates,
      source: coordinateData.source,
      extracted_at: coordinateData.extractedAt,
      saved_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("Log error:", logError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Coordenadas guardadas exitosamente",
        property: property?.[0],
      },
    })
  } catch (error) {
    console.error("Save coordinates error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
