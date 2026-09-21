import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import {
  deriveProspectingSignals,
  type ProspectingMarketContext,
  type ProspectingOwnerContext,
  type ProspectingSignalIdentity,
} from "@/lib/prospeccion/signal-engine"
import type { SentinelAttentionRow } from "@/lib/prospeccion/sentinel-attention"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function readAll<T>(
  load: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
) {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await load(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    const page = data ?? []
    rows.push(...page)
    if (page.length < pageSize) break
  }
  return rows
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function rolKey(value: unknown) {
  return text(value).toUpperCase().replace(/\s+/g, "")
}

function cirenRank(status: string | null) {
  if (status === "matched") return 4
  if (status === "partial") return 3
  if (status === "ambiguous") return 2
  if (status === "not_found") return 1
  return 0
}

export async function GET() {
  const client = db()
  if (!client) {
    return NextResponse.json({ error: "Señales no disponibles: faltan variables server-side de Supabase." }, { status: 503 })
  }

  try {
    const marketSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const [observations, kmzRows, cirenRows, marketRows, ownerRows] = await Promise.all([
      readAll<SentinelAttentionRow>((from, to) =>
        client
          .from("prospecting_sentinel_observations")
          .select("rol,rol_key,commune,geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count,fetched_at")
          .order("period_from", { ascending: true })
          .range(from, to) as any,
      ),
      readAll<any>((from, to) =>
        client
          .from("kmz_collection")
          .select("id,region,metadata,is_active")
          .eq("is_active", true)
          .range(from, to) as any,
      ),
      readAll<any>((from, to) =>
        client
          .from("kmz_enrichment_evidence")
          .select("kmz_id,status,observed_at")
          .eq("source", "CIREN IDE MINAGRI")
          .eq("field_name", "ciren_parcel_match")
          .order("observed_at", { ascending: false })
          .range(from, to) as any,
      ),
      readAll<any>((from, to) =>
        client
          .from("market_comparable_data")
          .select("region,commune,period_date,sample_count,sources,property_type,operation")
          .gte("period_date", marketSince)
          .eq("property_type", "terreno")
          .eq("operation", "venta")
          .order("period_date", { ascending: false })
          .range(from, to) as any,
      ),
      readAll<any>((from, to) =>
        client
          .from("prospecting_owner_research")
          .select("rol_key,commune,decision,result,researched_at")
          .order("researched_at", { ascending: false })
          .range(from, to) as any,
      ),
    ])

    const latestCirenByKmz = new Map<string, string>()
    for (const row of cirenRows) {
      const kmzId = text(row.kmz_id)
      const status = text(row.status)
      if (!kmzId || latestCirenByKmz.has(kmzId)) continue
      latestCirenByKmz.set(kmzId, status)
    }

    const identities: ProspectingSignalIdentity[] = kmzRows.flatMap((row) => {
      const record = row?.metadata?.sii_point_resolution?.record
      const rol = text(record?.rol)
      const commune = text(record?.comuna || record?.raw?.nombreComuna)
      if (!rol || !commune) return []
      const coordinates = record?.coordinates
      const rawCiren = latestCirenByKmz.get(String(row.id)) ?? null
      const cirenStatus =
        rawCiren === "matched" || rawCiren === "partial" || rawCiren === "ambiguous" || rawCiren === "not_found"
          ? rawCiren
          : null
      return [{
        kmzId: String(row.id),
        rol,
        rolKey: rolKey(rol),
        commune,
        region: text(row.region),
        address: text(record?.direccion || record?.raw?.direccion) || null,
        destination: text(record?.destino || record?.raw?.destinoDescripcion) || null,
        hasCoordinates: Number.isFinite(Number(coordinates?.lat)) && Number.isFinite(Number(coordinates?.lng)),
        cirenStatus,
      }]
    })

    const markets: ProspectingMarketContext[] = marketRows.map((row) => ({
      region: text(row.region),
      commune: text(row.commune),
      periodDate: text(row.period_date),
      sampleCount: Number(row.sample_count || 0),
      sourceCount: Array.isArray(row.sources) ? new Set(row.sources.map(String)).size : 0,
    }))

    const owners: ProspectingOwnerContext[] = ownerRows.map((row) => ({
      rolKey: rolKey(row.rol_key),
      commune: text(row.commune),
      decision: text(row.decision),
      ownerName: text(row?.result?.owner?.name) || null,
      ownerConfidence: Number.isFinite(Number(row?.result?.owner?.confidence))
        ? Number(row.result.owner.confidence)
        : null,
      researchedAt: text(row.researched_at) || null,
    }))

    const result = deriveProspectingSignals({
      observations,
      identities,
      markets,
      owners,
    })

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=300, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[Prospeccion Signals] failed", error)
    return NextResponse.json({ error: "No se pudo construir la cola de señales de prospección." }, { status: 500 })
  }
}
