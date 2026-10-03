import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  const authorized = await verifyInternalAccessToken(token)
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 1000)
  const limit = Number.isFinite(rawLimit) ? Math.min(1000, Math.max(1, Math.floor(rawLimit))) : 1000

  const { data, error, count } = await admin
    .from("properties_external")
    .select(
      "id, external_id, title, description, location, address, city, region, price, price_clp, price_uf, area, area_m2, property_type, images, source, source_url, scraped_at, is_active",
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[market-properties] load failed", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    properties: data || [],
    total: count ?? (data?.length || 0),
    limit,
  })
}
