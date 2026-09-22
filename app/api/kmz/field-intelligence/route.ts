import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { normalizeSearchText } from "@/lib/prospeccion/normalization"
import { isReliableSpectralProspectingSignal, scoreProspectingSignal, type CirenSignalStatus } from "@/lib/prospeccion/prospecting-signal"
import { derivePersistentSentinelAnomaly } from "@/lib/prospeccion/sentinel-memory"
import { normalizeOwnerResearchRol } from "@/lib/prospeccion/owner-research-cache"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 30

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SentinelRow = {
  rol: string
  rol_key: string
  commune: string
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function clean(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function normalizeCirenStatus(value: unknown): CirenSignalStatus {
  const status = String(value ?? "")
  if (status === "matched" || status === "partial" || status === "ambiguous" || status === "not_found") return status
  return "unknown"
}

function metadataContext(metadata: unknown) {
  const root = asRecord(metadata)
  const resolution = asRecord(root.sii_point_resolution)
  const record = asRecord(resolution.record)
  const raw = asRecord(record.raw)

  return {
    rol: clean(record.rol),
    commune: clean(record.comuna) || clean(raw.nombreComuna),
    confirmedOwner: clean(root.confirmed_owner),
  }
}

function latestDate(rows: SentinelRow[]) {
  return rows.reduce((latest, row) => Math.max(latest, Date.parse(row.period_from) || 0), 0)
}

function selectSentinelHistory(rows: SentinelRow[]) {
  const groups = new Map<string, SentinelRow[]>()
  for (const row of rows) {
    const key = row.geometry_fingerprint || "unknown"
    const group = groups.get(key) ?? []
    group.push(row)
    groups.set(key, group)
  }

  return [...groups.values()].sort((left, right) => {
    const leftMode = left[0]?.geometry_mode === "ciren_polygon" ? 1 : 0
    const rightMode = right[0]?.geometry_mode === "ciren_polygon" ? 1 : 0
    if (rightMode !== leftMode) return rightMode - leftMode
    const latest = latestDate(right) - latestDate(left)
    if (latest) return latest
    return right.length - left.length
  })[0] ?? []
}

async function hasAuthorizedSession(request: NextRequest) {
  const internalToken = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (await verifyInternalAccessToken(internalToken)) return true

  const sessionClient = await createServerClient()
  const { data: { user }, error } = await sessionClient.auth.getUser()
  return !error && Boolean(user)
}

export async function GET(request: NextRequest) {
  const kmzId = request.nextUrl.searchParams.get("kmzId")?.trim() || ""
  if (!UUID_PATTERN.test(kmzId)) {
    return NextResponse.json({ error: "kmzId inválido" }, { status: 400 })
  }

  if (!(await hasAuthorizedSession(request))) {
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

    const canonicalRegion = clean(collection.region)
    const metadata = metadataContext(collection.metadata)
    const rol = metadata.rol || clean(Array.isArray(collection.rol_numbers) ? collection.rol_numbers[0] : null)
    const rolKey = rol ? normalizeOwnerResearchRol(rol) : ""
    const commune = metadata.commune
    const communeKey = normalizeSearchText(commune || "")

    const nearbyPromise = admin
      .from("kmz_nearby_features")
      .select("feature_group,feature_type,feature_name,distance_m,proximity_class")
      .eq("kmz_id", kmzId)
      .order("distance_m", { ascending: true })
      .limit(40)

    const marketPromise = canonicalRegion
      ? admin
          .from("market_comparable_data")
          .select("region,commune,property_type,operation,sample_count,median_price_m2_clp,absorption_rate,price_trend_30d,computed_at")
          .eq("region", canonicalRegion)
          .eq("operation", "venta")
          .order("computed_at", { ascending: false })
          .limit(80)
      : Promise.resolve({ data: [], error: null })

    const publicPromise = canonicalRegion
      ? admin
          .from("market_public_metrics")
          .select("source,metric,value,unit,period,scraped_at")
          .eq("region", canonicalRegion)
          .order("scraped_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null })

    const sentinelPromise = rolKey
      ? admin
          .from("prospecting_sentinel_observations")
          .select("rol,rol_key,commune,geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count")
          .eq("rol_key", rolKey)
          .order("period_from", { ascending: true })
          .limit(120)
      : Promise.resolve({ data: [], error: null })

    const cirenPromise = admin
      .from("kmz_enrichment_evidence")
      .select("status,observed_at")
      .eq("kmz_id", kmzId)
      .eq("source", "CIREN IDE MINAGRI")
      .eq("field_name", "ciren_parcel_match")
      .order("observed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let ownerQuery = admin
      .from("prospecting_owner_research")
      .select("result,decision,researched_at,next_refresh_at")
      .eq("rol_key", rolKey || "__missing__")
      .order("researched_at", { ascending: false })
      .limit(1)

    if (communeKey) ownerQuery = ownerQuery.eq("commune_key", communeKey)

    const [nearbyResult, marketResult, publicResult, sentinelResult, cirenResult, ownerResult] = await Promise.all([
      nearbyPromise,
      marketPromise,
      publicPromise,
      sentinelPromise,
      cirenPromise,
      ownerQuery.maybeSingle(),
    ])

    const errors = [
      nearbyResult.error,
      marketResult.error,
      publicResult.error,
      sentinelResult.error,
      cirenResult.error,
      ownerResult.error,
    ].filter(Boolean)

    if (errors.length) {
      console.warn("[CAMPOS field intelligence] partial evidence failure", errors.map((error) => error?.message))
    }

    const marketRows = (marketResult.data ?? []) as Array<{
      region: string | null
      commune: string | null
      property_type: string | null
      operation: string | null
      sample_count: number | null
      median_price_m2_clp: number | null
      absorption_rate: number | null
      price_trend_30d: number | null
      computed_at: string | null
    }>

    const communeRows = communeKey
      ? marketRows.filter((row) => normalizeSearchText(row.commune || "") === communeKey)
      : []
    const scopedMarketRows = communeRows.length ? communeRows : marketRows
    const marketScope = communeRows.length ? "commune" : scopedMarketRows.length ? "region" : "none"
    const freshestComputedAt = scopedMarketRows.find((row) => row.computed_at)?.computed_at ?? null
    const latestMarketRows = freshestComputedAt
      ? scopedMarketRows.filter((row) => row.computed_at === freshestComputedAt)
      : scopedMarketRows
    const marketSampleCount = latestMarketRows.reduce((sum, row) => sum + Math.max(0, Number(row.sample_count) || 0), 0)

    const selectedSentinelRows = selectSentinelHistory((sentinelResult.data ?? []) as SentinelRow[])
    const sentinelAnomaly = derivePersistentSentinelAnomaly(selectedSentinelRows)
    const latestSentinel = selectedSentinelRows.at(-1) ?? null
    const sentinelReliable = isReliableSpectralProspectingSignal({
      latestNdvi: sentinelAnomaly.latestNdvi,
      seasonalBaselineNdvi: sentinelAnomaly.seasonalBaselineNdvi,
      baselineCount: sentinelAnomaly.baselineCount,
    })

    const ownerResearchRow = ownerResult.data
    const ownerResearchResult = asRecord(ownerResearchRow?.result)
    const ownerCandidate = asRecord(ownerResearchResult.owner)
    const ownerContact = asRecord(ownerResearchResult.contact)
    const ownerName = clean(ownerCandidate.name) || metadata.confirmedOwner
    const contactAvailable = Boolean(clean(ownerContact.phone) || clean(ownerContact.email))
    const cirenStatus = normalizeCirenStatus(cirenResult.data?.status)

    const actionableLevel = sentinelAnomaly.level === "strong"
      ? "strong"
      : sentinelAnomaly.level === "watch"
        ? "watch"
        : null
    const prospecting = sentinelReliable && actionableLevel && rol
      ? scoreProspectingSignal({
          rol,
          commune,
          region: canonicalRegion,
          ownerName,
          contactAvailable,
          cirenStatus,
          marketSampleCount,
          anomaly: {
            level: actionableLevel,
            ndviDelta: sentinelAnomaly.ndviDelta,
            ndmiDelta: sentinelAnomaly.ndmiDelta,
            interpretation: sentinelAnomaly.interpretation,
            observationCount: selectedSentinelRows.length,
          },
        })
      : null

    return NextResponse.json({
      kmzId,
      region: canonicalRegion,
      commune,
      rol,
      nearby: nearbyResult.data || [],
      comparables: scopedMarketRows.slice(0, 24),
      publicMetrics: publicResult.data || [],
      contact: {
        pic: collection.pic,
        pic_phone: collection.pic_phone,
        pic_email: collection.pic_email,
        updated_at: collection.updated_at,
      },
      ciren: {
        status: cirenStatus,
        observedAt: cirenResult.data?.observed_at ?? null,
      },
      sentinel: {
        available: selectedSentinelRows.length > 0,
        observationCount: selectedSentinelRows.length,
        geometryMode: selectedSentinelRows[0]?.geometry_mode ?? null,
        latestPeriod: latestSentinel?.period_from ?? null,
        latest: {
          ndvi: latestSentinel?.ndvi == null ? null : Number(latestSentinel.ndvi),
          ndre: latestSentinel?.ndre == null ? null : Number(latestSentinel.ndre),
          ndmi: latestSentinel?.ndmi == null ? null : Number(latestSentinel.ndmi),
        },
        anomaly: sentinelAnomaly,
        reliable: sentinelReliable,
      },
      marketContext: {
        scope: marketScope,
        sampleCount: marketSampleCount,
        computedAt: freshestComputedAt,
      },
      ownerResearch: ownerResearchRow ? {
        name: clean(ownerCandidate.name),
        confidence: Number.isFinite(Number(ownerCandidate.confidence)) ? Number(ownerCandidate.confidence) : null,
        contactAvailable,
        decision: clean(ownerResearchRow.decision),
        researchedAt: ownerResearchRow.researched_at ?? null,
        nextRefreshAt: ownerResearchRow.next_refresh_at ?? null,
      } : null,
      prospecting,
      partial: errors.length > 0,
    }, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=120, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("[CAMPOS field intelligence] failed", error)
    return NextResponse.json({ error: "No se pudo cargar la inteligencia del campo" }, { status: 500 })
  }
}
