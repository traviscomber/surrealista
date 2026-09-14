import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function displayName(row: Record<string, unknown>) {
  const person = [row.first_name, row.last_name].map((value) => String(value || "").trim()).filter(Boolean).join(" ")
  return person || String(row.company_name || row.email || "Cliente sin nombre")
}

export async function GET() {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const { data, error } = await supabase
    .from("clients")
    .select("id,first_name,last_name,company_name,email,client_type,status,main_interest,locations_of_interest,region,comuna,desired_surface_area_min,desired_surface_area_max,budget_min,budget_max")
    .in("client_type", ["buyer", "investor", "both"])
    .not("status", "eq", "archived")
    .order("updated_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clients = (data ?? []).map((row) => {
    const locations = Array.isArray(row.locations_of_interest) ? row.locations_of_interest.filter(Boolean) : []
    const region = row.region || locations[0] || null
    return {
      id: row.id,
      name: displayName(row),
      email: row.email,
      clientType: row.client_type,
      status: row.status,
      mainInterest: row.main_interest,
      criteria: {
        region,
        commune: row.comuna || null,
        minHa: row.desired_surface_area_min == null ? null : Number(row.desired_surface_area_min),
        maxHa: row.desired_surface_area_max == null ? null : Number(row.desired_surface_area_max),
        budgetMin: row.budget_min == null ? null : Number(row.budget_min),
        budgetMax: row.budget_max == null ? null : Number(row.budget_max),
        locations,
      },
    }
  })

  return NextResponse.json({ clients, count: clients.length })
}
