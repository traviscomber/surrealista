import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { createClient } from "@/lib/supabase/server"

const createSchema = z.object({
  document_name: z.string().trim().min(1).max(180),
  document_data: z.record(z.string(), z.unknown()),
})

async function requireInternalAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get(INTERNAL_ACCESS_COOKIE)?.value
  return verifyInternalAccessToken(token)
}

export async function GET(request: Request) {
  if (!(await requireInternalAccess())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = await createClient()
  const url = new URL(request.url)
  const kmzId = url.searchParams.get("kmzId")

  if (kmzId) {
    const { data: kmz, error: kmzError } = await supabase
      .from("kmz_collection")
      .select("id,file_name,description,metadata,rol_numbers,tags,region,owner,pic,pic_phone,pic_email,google_docs_link")
      .eq("id", kmzId)
      .eq("is_active", true)
      .single()

    if (kmzError || !kmz) {
      return NextResponse.json({ error: "Predio no encontrado" }, { status: 404 })
    }

    const [{ data: nearby }, { data: market }] = await Promise.all([
      supabase
        .from("kmz_nearby_features")
        .select("feature_group,feature_type,feature_name,distance_m")
        .eq("kmz_id", kmzId)
        .order("distance_m", { ascending: true })
        .limit(12),
      kmz.region
        ? supabase
            .from("market_comparable_data")
            .select("sample_count,avg_price_clp,median_price_clp,avg_price_m2_clp,avg_days_active,price_trend_30d")
            .eq("region", kmz.region)
            .order("computed_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    return NextResponse.json({ kmz, nearby: nearby || [], market: market || null })
  }

  const [{ data: inventory, error: inventoryError }, { data: documents, error: documentsError }] = await Promise.all([
    supabase
      .from("kmz_collection")
      .select("id,file_name,region")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("generated_corporate_documents")
      .select("id,document_name,created_at,document_data")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (inventoryError || documentsError) {
    console.error("Commercial presentations GET failed", { inventoryError, documentsError })
    return NextResponse.json({ error: "No se pudo cargar el módulo" }, { status: 500 })
  }

  return NextResponse.json({ inventory: inventory || [], documents: documents || [] })
}

export async function POST(request: Request) {
  if (!(await requireInternalAccess())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de presentación inválidos" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("generated_corporate_documents")
    .insert({
      property_id: null,
      document_name: parsed.data.document_name,
      document_data: parsed.data.document_data,
      status: "generated",
      created_by: "internal-operator",
    })
    .select("id,document_name,created_at,document_data")
    .single()

  if (error) {
    console.error("Commercial presentation insert failed", error)
    return NextResponse.json({ error: "No se pudo guardar la presentación" }, { status: 500 })
  }

  return NextResponse.json({ document: data }, { status: 201 })
}
