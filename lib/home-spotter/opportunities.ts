import { createClient } from '@supabase/supabase-js'
import { getNearbyIntelligence } from '@/lib/valuation/nearby-intelligence'

const LAND_TYPES = [
  'terreno','parcela','campo','agrícola','terreno rural','terreno residencial','campo agrícola',
  'campo forestal','fundo agrícola','fundo ganadero','fundo lechero','loteo / parcelación','sitio','lote','fundo','predio',
]

type ExternalProperty = {
  id: string
  title: string | null
  price_clp: number | null
  price_uf: number | null
  area_m2: number | null
  price_per_m2_clp: number | null
  property_type: string | null
  region: string | null
  commune: string | null
  city: string | null
  address: string | null
  lat: number | null
  lng: number | null
  source: string | null
  source_url: string | null
  scraped_at: string | null
  days_active: number | null
  images: string[] | null
  description: string | null
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a,b)=>a-b)
  if (!sorted.length) return null
  const i = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[i] : Math.round((sorted[i-1] + sorted[i]) / 2)
}

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)) }
function key(value: string | null | undefined) { return String(value || '').trim().toLowerCase() }
function ageDays(iso: string | null) {
  if (!iso) return 999
  const t = Date.parse(iso)
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86_400_000)) : 999
}
function freshnessScore(days: number) {
  if (days <= 3) return 100
  if (days <= 7) return 85
  if (days <= 14) return 70
  if (days <= 30) return 50
  if (days <= 60) return 30
  return 10
}
function comparableArea(subjectArea: number, candidateArea: number) {
  if (!Number.isFinite(subjectArea) || subjectArea <= 0 || !Number.isFinite(candidateArea) || candidateArea <= 0) return false
  return candidateArea > subjectArea * 0.4 && candidateArea < subjectArea * 2.5
}

function scoreRow(row: ExternalProperty, peers: ExternalProperty[]) {
  const ppm2 = Number(row.price_per_m2_clp)
  const subjectArea = Number(row.area_m2)
  if (!ppm2 || !subjectArea) return null

  const compatible = (p: ExternalProperty) =>
    p.id !== row.id &&
    key(p.property_type) === key(row.property_type) &&
    Number(p.price_per_m2_clp) > 0 &&
    comparableArea(subjectArea, Number(p.area_m2))

  const sameCommune = peers.filter(p => compatible(p) && key(p.commune || p.city) === key(row.commune || row.city))
  const sameRegion = peers.filter(p => compatible(p) && key(p.region) === key(row.region))
  const benchmarkPeers = sameCommune.length >= 3 ? sameCommune : sameRegion
  const benchmarkBasis = sameCommune.length >= 3 ? 'commune' : 'region'
  const benchmarkPpm2 = median(benchmarkPeers.map(p => Number(p.price_per_m2_clp)))
  if (!benchmarkPpm2 || benchmarkPeers.length < 3) return null

  const discountPct = ((benchmarkPpm2 - ppm2) / benchmarkPpm2) * 100
  if (!Number.isFinite(discountPct) || discountPct < 3 || discountPct > 70) return null

  const discountScore = clamp(((discountPct - 3) / 27) * 100)
  const sourceCount = new Set(benchmarkPeers.map(p => key(p.source)).filter(Boolean)).size
  const evidenceScore = clamp(benchmarkPeers.length * 8 + sourceCount * 6)
  const days = ageDays(row.scraped_at)
  const freshness = freshnessScore(days)
  const dataQuality = clamp((row.lat != null && row.lng != null ? 45 : 0) + (row.address ? 20 : 0) + (row.source_url ? 20 : 0) + (row.images?.length ? 15 : 0))
  const opportunityScore = Math.round(discountScore * .55 + evidenceScore * .25 + freshness * .10 + dataQuality * .10)
  const confidence = Math.round(clamp(35 + Math.min(benchmarkPeers.length, 10) * 4 + Math.min(sourceCount, 5) * 4 + (row.lat != null && row.lng != null ? 8 : 0), 0, 95))
  const benchmarkValue = Math.round(benchmarkPpm2 * subjectArea)

  return {
    id: row.id,
    title: row.title || 'Terreno sin título',
    property_type: row.property_type,
    region: row.region,
    commune: row.commune || row.city,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    source: row.source,
    source_url: row.source_url,
    image: row.images?.[0] || null,
    price_clp: Number(row.price_clp || 0),
    price_uf: row.price_uf,
    area_m2: subjectArea,
    price_per_m2_clp: ppm2,
    scraped_at: row.scraped_at,
    age_days: days,
    opportunity_score: opportunityScore,
    confidence,
    benchmark: {
      basis: benchmarkBasis,
      price_per_m2_clp: benchmarkPpm2,
      estimated_value_clp: benchmarkValue,
      sample_count: benchmarkPeers.length,
      source_count: sourceCount,
      area_window: '0.4x-2.5x',
    },
    discount_pct: Number(discountPct.toFixed(1)),
    signals: [
      `${discountPct.toFixed(1)}% bajo benchmark ${benchmarkBasis === 'commune' ? 'comunal' : 'regional'}`,
      `${benchmarkPeers.length} comparables de superficie compatible`,
      `${sourceCount} fuentes`,
      days <= 14 ? 'Aviso reciente' : `Aviso de ${days} días`,
    ],
  }
}

export async function listRealOpportunities(limit = 50) {
  const db = admin()
  if (!db) return []
  const { data, error } = await db.from('properties_external')
    .select('id,title,price_clp,price_uf,area_m2,price_per_m2_clp,property_type,region,commune,city,address,lat,lng,source,source_url,scraped_at,days_active,images,description')
    .eq('is_active', true)
    .eq('operation', 'venta')
    .in('property_type', LAND_TYPES)
    .gt('price_clp', 0)
    .gt('area_m2', 0)
    .gt('price_per_m2_clp', 0)
    .order('scraped_at', { ascending: false })
    .limit(1000)
  if (error) { console.error('[Oportunidades]', error.message); return [] }
  const rows = (data ?? []) as ExternalProperty[]
  return rows.map(row => scoreRow(row, rows)).filter(Boolean).sort((a:any,b:any)=>b.opportunity_score-a.opportunity_score).slice(0, Math.min(limit, 100))
}

export async function getRealOpportunity(id: string) {
  const db = admin()
  if (!db) return null
  const { data: row } = await db.from('properties_external')
    .select('id,title,price_clp,price_uf,area_m2,price_per_m2_clp,property_type,region,commune,city,address,lat,lng,source,source_url,scraped_at,days_active,images,description')
    .eq('id', id).eq('is_active', true).single()
  if (!row) return null
  const subjectArea = Number(row.area_m2 || 0)
  const { data: peers } = await db.from('properties_external')
    .select('id,title,price_clp,price_uf,area_m2,price_per_m2_clp,property_type,region,commune,city,address,lat,lng,source,source_url,scraped_at,days_active,images,description')
    .eq('is_active', true)
    .eq('operation','venta')
    .ilike('region', `%${row.region || ''}%`)
    .eq('property_type', row.property_type)
    .gt('price_per_m2_clp',0)
    .gt('area_m2', subjectArea * 0.4)
    .lt('area_m2', subjectArea * 2.5)
    .limit(300)
  const scored:any = scoreRow(row as ExternalProperty, (peers ?? []) as ExternalProperty[])
  if (!scored) return null
  const nearby = await getNearbyIntelligence({ lat: row.lat, lng: row.lng, commune: row.commune || row.city, region: row.region, area_m2: row.area_m2 })
  return { ...scored, description: row.description, images: row.images ?? [], nearby_intelligence: nearby }
}
