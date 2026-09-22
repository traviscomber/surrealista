import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { derivePersistentSentinelAnomaly, normalizeRolKey } from "@/lib/prospeccion/sentinel-memory"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SentinelRow = {
  geometry_mode: string
  geometry_fingerprint: string
  period_from: string
  period_to: string
  ndvi: number | string | null
  ndre: number | string | null
  ndmi: number | string | null
  sample_count: number
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createAdminClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function clean(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function resolvedRol(collection: { rol_numbers: string[] | null; metadata: unknown }) {
  const metadata = recordOf(collection.metadata)
  const sii = recordOf(recordOf(recordOf(metadata.sii_point_resolution).record))
  const siiRol = clean(sii.rol)
  if (siiRol) return siiRol
  return Array.isArray(collection.rol_numbers) ? clean(collection.rol_numbers.find(Boolean)) : null
}

function ownerContext(collection: { owner: string | null; metadata: unknown }) {
  const metadata = recordOf(collection.metadata)
  const candidate = recordOf(metadata.public_owner_candidate)
  const evidence = recordOf(metadata.latest_owner_evidence)
  const confirmedOwner = clean(metadata.confirmed_owner) || clean(collection.owner)
  const candidateOwner = clean(candidate.owner) || clean(evidence.ownerLabel)

  if (confirmedOwner) {
    return {
      status: "confirmed" as const,
      name: confirmedOwner,
      source: clean(metadata.owner_source),
      note: "Identidad de propietario registrada en el expediente interno.",
    }
  }

  if (candidateOwner) {
    return {
      status: "candidate" as const,
      name: candidateOwner,
      source: clean(candidate.sourceType) || clean(evidence.sourceType),
      note: clean(candidate.notes) || clean(evidence.notes) || "Candidato público; requiere validación registral antes de contacto.",
    }
  }

  return {
    status: "missing" as const,
    name: null,
    source: null,
    note: "Propietario aún no validado.",
  }
}

function chooseSentinelSeries(rows: SentinelRow[]) {
  if (!rows.length) return null

  const groups = new Map<string, SentinelRow[]>()
  for (const row of rows) {
    const key = row.geometry_fingerprint || "unknown"
    const current = groups.get(key) ?? []
    current.push(row)
    groups.set(key, current)
  }

  const candidates = [...groups.values()].map((group) => {
    const ordered = [...group].sort((a, b) => a.period_from.localeCompare(b.period_from))
    const latest = ordered.at(-1) ?? null
    return {
      ordered,
      latest,
      geometryMode: latest?.geometry_mode || ordered[0]?.geometry_mode || "unknown",
      anomaly: derivePersistentSentinelAnomaly(ordered),
    }
  }).filter((candidate) => candidate.latest)

  candidates.sort((a, b) => {
    const aPolygon = a.geometryMode === "ciren_polygon" ? 1 : 0
    const bPolygon = b.geometryMode === "ciren_polygon" ? 1 : 0
    if (aPolygon !== bPolygon) return bPolygon - aPolygon
    return String(b.latest?.period_from || "").localeCompare(String(a.latest?.period_from || ""))
  })

  const selected = candidates[0]
  if (!selected?.latest) return null

  const latest = selected.latest
  const numeric = (value: number | string | null) => {
    if (value == null) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return {
    observationCount: selected.ordered.length,
    geometryMode: selected.geometryMode,
    latestPeriod: latest.period_from,
    latest: {
      ndvi: numeric(latest.ndvi),
      ndre: numeric(latest.ndre),
      ndmi: numeric(latest.ndmi),
    },
    anomaly: selected.anomaly,
  }
}

export async function GET(request: NextRequest) {
  const kmzId = request.nextUrl.searchParams.get("kmzId")?.trim() || ""
  if (!UUID_PATTERN.test(kmzId)) {
    return NextResponse.json({ error: "kmzId inválido" }, { status: 400 })
  }

  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (!(await verifyInternalAccessToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })
  }

  try {
    const { data: collection, error: collectionError } = await admin
      .from("kmz_collection")
      .select("id,region,owner,pic,pic_phone,pic_email,rol_numbers,metadata,updated_at")
      .eq("id", kmzId)
      .eq("is_active", true)
      .maybeSingle()

    if (collectionError) throw collectionError
    if (!collection) return NextResponse.json({ error: "KMZ no encontrado" }, { status: 404 })

    const canonicalRegion = String(collection.region || "").trim()
    const rol = resolvedRol(collection)

    const sentinelPromise = rol
      ? admin
          .from("prospecting_sentinel_observations")
          .select("geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count")
          .eq("rol_key", normalizeRolKey(rol))
          .order("period_from", { ascending: true })
          .limit(160)
      : Promise.resolve({ data: [], error: null })

    const [nearbyResult, marketResult, publicResult, sentinelResult] = await Promise.all([
      canonicalRegion
        ? admin
            .from("kmz_nearby_features")
            .select("feature_group,feature_type,feature_name,distance_m,proximity_class")
            .eq("kmz_id", kmzId)
            .order("distance_m", { ascending: true })
            .limit(40)
        : Promise.resolve({ data: [], error: null }),
      canonicalRegion
        ? admin
            .from("market_comparable_data")
            .select("commune,property_type,operation,sample_count,median_price_m2_clp,absorption_rate,price_trend_30d,computed_at")
            .eq("region", canonicalRegion)
            .order("computed_at", { ascending: false })
            .limit(24)
        : Promise.resolve({ data: [], error: null }),
      canonicalRegion
        ? admin
            .from("market_public_metrics")
            .select("source,metric,value,unit,period,scraped_at")
            .eq("region", canonicalRegion)
            .order("scraped_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null }),
      sentinelPromise,
    ])

    const errors = [nearbyResult.error, marketResult.error, publicResult.error, sentinelResult.error].filter(Boolean)
    if (errors.length) {
      console.warn("[CAMPOS field intelligence] partial evidence failure", errors.map((error) => error?.message))
    }

    return NextResponse.json({
      kmzId,
      region: canonicalRegion || null,
      rol,
      nearby: nearbyResult.data || [],
      comparables: marketResult.data || [],
      publicMetrics: publicResult.data || [],
      contact: {
        pic: collection.pic,
        pic_phone: collection.pic_phone,
        pic_email: collection.pic_email,
        updated_at: collection.updated_at,
      },
      owner: ownerContext(collection),
      satellite: chooseSentinelSeries((sentinelResult.data || []) as SentinelRow[]),
      partial: errors.length > 0,
    })
  } catch (error) {
    console.error("[CAMPOS field intelligence] failed", error)
    return NextResponse.json({ error: "No se pudo cargar la inteligencia del campo" }, { status: 500 })
  }
}
