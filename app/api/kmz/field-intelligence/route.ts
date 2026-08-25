import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createAdminClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET(request: NextRequest) {
  const kmzId = request.nextUrl.searchParams.get("kmzId")?.trim() || ""
  if (!UUID_PATTERN.test(kmzId)) {
    return NextResponse.json({ error: "kmzId inválido" }, { status: 400 })
  }

  const sessionClient = await createServerClient()
  const { data: { user }, error: userError } = await sessionClient.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })
  }

  try {
    const { data: collection, error: collectionError } = await admin
      .from("kmz_collection")
      .select("id,region,pic,pic_phone,pic_email,updated_at")
      .eq("id", kmzId)
      .eq("is_active", true)
      .maybeSingle()

    if (collectionError) throw collectionError
    if (!collection) return NextResponse.json({ error: "KMZ no encontrado" }, { status: 404 })

    const canonicalRegion = String(collection.region || "").trim()
    if (!canonicalRegion) {
      return NextResponse.json({
        kmzId,
        region: null,
        nearby: [],
        comparables: [],
        publicMetrics: [],
        contact: {
          pic: collection.pic,
          pic_phone: collection.pic_phone,
          pic_email: collection.pic_email,
          updated_at: collection.updated_at,
        },
      })
    }

    const [nearbyResult, marketResult, publicResult] = await Promise.all([
      admin
        .from("kmz_nearby_features")
        .select("feature_group,feature_type,feature_name,distance_m,proximity_class")
        .eq("kmz_id", kmzId)
        .order("distance_m", { ascending: true })
        .limit(40),
      admin
        .from("market_comparable_data")
        .select("commune,property_type,operation,sample_count,median_price_m2_clp,absorption_rate,price_trend_30d,computed_at")
        .eq("region", canonicalRegion)
        .order("computed_at", { ascending: false })
        .limit(24),
      admin
        .from("market_public_metrics")
        .select("source,metric,value,unit,period,scraped_at")
        .eq("region", canonicalRegion)
        .order("scraped_at", { ascending: false })
        .limit(20),
    ])

    const errors = [nearbyResult.error, marketResult.error, publicResult.error].filter(Boolean)
    if (errors.length) {
      console.warn("[CAMPOS field intelligence] partial evidence failure", errors.map((error) => error?.message))
    }

    return NextResponse.json({
      kmzId,
      region: canonicalRegion,
      nearby: nearbyResult.data || [],
      comparables: marketResult.data || [],
      publicMetrics: publicResult.data || [],
      contact: {
        pic: collection.pic,
        pic_phone: collection.pic_phone,
        pic_email: collection.pic_email,
        updated_at: collection.updated_at,
      },
      partial: errors.length > 0,
    })
  } catch (error) {
    console.error("[CAMPOS field intelligence] failed", error)
    return NextResponse.json({ error: "No se pudo cargar la inteligencia del campo" }, { status: 500 })
  }
}
