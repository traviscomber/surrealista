import { NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { normalizeSearchText } from "@/lib/prospeccion/normalization"
import { ownerResearchCacheKey, readOwnerResearchCaches } from "@/lib/prospeccion/owner-research-cache"
import { isReliableSpectralProspectingSignal, scoreProspectingSignal, type CirenSignalStatus } from "@/lib/prospeccion/prospecting-signal"
import { deriveSentinelAttentionQueue } from "@/lib/prospeccion/sentinel-attention"
import { readAllSentinelAttentionRows } from "@/lib/prospeccion/sentinel-repository"
import { canonicalRegionKey } from "@/lib/territory/chile-regions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 30

const PAGE_SIZE = 1000

type KmzContext = {
  id: string
  region: string | null
  owner: string | null
  pic: string | null
  pic_phone: string | null
  pic_email: string | null
  rol_numbers: string[] | null
  metadata: unknown
  updated_at: string | null
}

type CirenEvidence = {
  kmz_id: string
  status: string
  observed_at: string
}

type MarketRow = {
  region: string | null
  commune: string | null
  sample_count: number | null
  computed_at: string | null
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function clean(value: unknown) {
  const text = String(value ?? "").trim()
  return text || null
}

function rolKey(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "")
}

function siiRecord(metadata: unknown) {
  return asRecord(asRecord(asRecord(metadata).sii_point_resolution).record)
}

function contextRol(row: KmzContext) {
  const sii = siiRecord(row.metadata)
  const preferred = rolKey(sii.rol)
  if (preferred) return preferred
  const first = Array.isArray(row.rol_numbers) ? row.rol_numbers.find(Boolean) : null
  return rolKey(first)
}

function contextCommune(row: KmzContext) {
  const sii = siiRecord(row.metadata)
  const raw = asRecord(sii.raw)
  return clean(sii.comuna) || clean(raw.nombreComuna)
}

function contextConfirmedOwner(row: KmzContext) {
  const metadata = asRecord(row.metadata)
  return clean(metadata.confirmed_owner)
}

function contextRank(row: KmzContext) {
  const confirmedOwner = contextConfirmedOwner(row)
  const location = Boolean(contextCommune(row) && row.region)
  return Number(Boolean(confirmedOwner)) * 30 + Number(location) * 10 + (Date.parse(row.updated_at || "") || 0) / 1e15
}

function cachedOwner(result: Record<string, unknown> | undefined) {
  const owner = asRecord(result?.owner)
  const name = clean(owner.name)
  return name ? { name, confidence: Number(owner.confidence) || 0 } : null
}

function cachedContactAvailable(result: Record<string, unknown> | undefined) {
  const contact = asRecord(result?.contact)
  return Boolean(clean(contact.phone) || clean(contact.email))
}

function cirenStatus(value: string | undefined): CirenSignalStatus {
  if (value === "matched" || value === "partial" || value === "ambiguous" || value === "not_found") return value
  return "unknown"
}

function marketKey(region: string | null, commune: string | null) {
  return `${canonicalRegionKey(region || "")}::${normalizeSearchText(commune || "")}`
}

async function readAllKmz(client: SupabaseClient) {
  const rows: KmzContext[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("kmz_collection")
      .select("id,region,owner,pic,pic_phone,pic_email,rol_numbers,metadata,updated_at")
      .eq("is_active", true)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const page = (data ?? []) as KmzContext[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

async function readAllCirenEvidence(client: SupabaseClient) {
  const rows: CirenEvidence[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("kmz_enrichment_evidence")
      .select("kmz_id,status,observed_at")
      .eq("source", "CIREN IDE MINAGRI")
      .eq("field_name", "ciren_parcel_match")
      .order("observed_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const page = (data ?? []) as CirenEvidence[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

async function readAllMarketRows(client: SupabaseClient) {
  const rows: MarketRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("market_comparable_data")
      .select("region,commune,sample_count,computed_at")
      .eq("operation", "venta")
      .order("computed_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const page = (data ?? []) as MarketRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return rows
}

export async function GET() {
  const client = db()
  if (!client) {
    return NextResponse.json({ error: "Señales no disponibles: faltan variables server-side de Supabase." }, { status: 503 })
  }

  try {
    const [sentinelRows, kmzRows, cirenRows, marketRows] = await Promise.all([
      readAllSentinelAttentionRows(client),
      readAllKmz(client),
      readAllCirenEvidence(client),
      readAllMarketRows(client),
    ])

    const attention = deriveSentinelAttentionQueue(sentinelRows)

    const kmzByRol = new Map<string, KmzContext>()
    for (const row of kmzRows) {
      const key = contextRol(row)
      if (!key) continue
      const current = kmzByRol.get(key)
      if (!current || contextRank(row) > contextRank(current)) kmzByRol.set(key, row)
    }

    const latestCirenByKmz = new Map<string, CirenEvidence>()
    for (const row of cirenRows) {
      if (!latestCirenByKmz.has(row.kmz_id)) latestCirenByKmz.set(row.kmz_id, row)
    }

    const marketByLocation = new Map<string, { computedAt: string; sampleCount: number }>()
    for (const row of marketRows) {
      const key = marketKey(row.region, row.commune)
      if (key.endsWith("::")) continue
      const computedAt = row.computed_at || ""
      const sampleCount = Math.max(0, Number(row.sample_count) || 0)
      const current = marketByLocation.get(key)
      if (!current || computedAt > current.computedAt) {
        marketByLocation.set(key, { computedAt, sampleCount })
      } else if (computedAt && computedAt === current.computedAt) {
        current.sampleCount += sampleCount
      }
    }

    const reliableAttentionItems = attention.items.filter((item) => isReliableSpectralProspectingSignal({
      latestNdvi: item.anomaly.latestNdvi,
      seasonalBaselineNdvi: item.anomaly.seasonalBaselineNdvi,
      baselineCount: item.anomaly.baselineCount,
    }))
    const excludedLowConfidenceCount = attention.items.length - reliableAttentionItems.length

    const ownerResearchInputs = reliableAttentionItems.map((item) => {
      const context = kmzByRol.get(rolKey(item.rol))
      return {
        rol: item.rol,
        commune: context ? contextCommune(context) || clean(item.commune) : clean(item.commune),
      }
    })
    const ownerResearch = await readOwnerResearchCaches(ownerResearchInputs)

    const items = reliableAttentionItems.map((item) => {
      const context = kmzByRol.get(rolKey(item.rol))
      const region = clean(context?.region)
      const commune = context ? contextCommune(context) || clean(item.commune) : clean(item.commune)
      const ownerEntry = ownerResearch.get(ownerResearchCacheKey({ rol: item.rol, commune }))
      const researchedOwner = cachedOwner(ownerEntry?.result)
      const ownerName = researchedOwner?.name || (context ? contextConfirmedOwner(context) : null)
      const contactAvailable = cachedContactAvailable(ownerEntry?.result)
      const ciren = context ? latestCirenByKmz.get(context.id) : undefined
      const market = marketByLocation.get(marketKey(region, commune))
      const signal = scoreProspectingSignal({
        rol: item.rol,
        commune,
        region,
        ownerName,
        contactAvailable,
        cirenStatus: cirenStatus(ciren?.status),
        marketSampleCount: market?.sampleCount ?? 0,
        anomaly: {
          level: item.anomaly.level === "strong" ? "strong" : "watch",
          ndviDelta: item.anomaly.ndviDelta,
          ndmiDelta: item.anomaly.ndmiDelta,
          interpretation: item.anomaly.interpretation,
          observationCount: item.observationCount,
        },
      })

      return {
        rol: item.rol,
        kmzId: context?.id ?? null,
        commune,
        region,
        ownerName,
        contactAvailable,
        cirenStatus: cirenStatus(ciren?.status),
        marketSampleCount: market?.sampleCount ?? 0,
        marketComputedAt: market?.computedAt || null,
        latestPeriod: item.latestPeriod,
        latest: item.latest,
        anomaly: item.anomaly,
        observationCount: item.observationCount,
        ...signal,
      }
    }).sort((a, b) => b.score - a.score || b.anomaly.level.localeCompare(a.anomaly.level) || a.rol.localeCompare(b.rol, "es-CL"))

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      monitoredRols: attention.monitoredRols,
      actionableCount: items.length,
      highPriorityCount: items.filter((item) => item.level === "alta").length,
      mediumPriorityCount: items.filter((item) => item.level === "media").length,
      excludedLowConfidenceCount,
      items: items.slice(0, 50),
      methodology: {
        name: "cross-layer-evidence-convergence-v1",
        dimensions: {
          rolIdentity: 10,
          location: 10,
          ownerAndContact: 20,
          ciren: 15,
          temporalSatelliteSignal: 30,
          marketCoverage: 15,
        },
        qualityGate: "Requiere al menos 2 referencias estacionales y excluye NDVI saturado en ±1 de la priorización comercial.",
        guardrail: "Prioriza convergencia de evidencia; no predice intención de venta ni diagnostica causas agronómicas.",
      },
    })
  } catch (error) {
    console.error("[Prospeccion Signals] failed", error)
    return NextResponse.json({ error: "No se pudieron construir las señales de prospección." }, { status: 500 })
  }
}
