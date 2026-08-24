import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase server environment variables")
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const hectares = Number.parseFloat(String(body.hectares ?? ""))
    const askingPrice = body.asking_price == null || body.asking_price === "" ? null : Number.parseFloat(String(body.asking_price))

    if (!body.contact_name || !body.phone_number || !body.location || !body.property_type || !Number.isFinite(hectares)) {
      return NextResponse.json({ error: "Faltan campos requeridos o hectáreas inválidas" }, { status: 400 })
    }
    if (askingPrice !== null && !Number.isFinite(askingPrice)) {
      return NextResponse.json({ error: "Precio solicitado inválido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("quick_opportunities")
      .insert([
        {
          contact_name: body.contact_name,
          phone_number: body.phone_number,
          location: body.location,
          hectares,
          property_type: body.property_type,
          asking_price: askingPrice,
          notes: body.notes || null,
          status: "new",
        },
      ])
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[quick-wins] Error creating opportunity:", error)
    return NextResponse.json({ error: "Error al crear la oportunidad" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("quick_opportunities")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error("[quick-wins] Error fetching opportunities:", error)
    return NextResponse.json({ error: "Error al obtener oportunidades" }, { status: 500 })
  }
}
