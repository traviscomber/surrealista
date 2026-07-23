import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30
export const runtime = 'nodejs'

const ACCESS_COOKIE = 'sur_realista_access'
const MIN_COMPARABLES = 3
const MAX_AREA_SQM = 1_000_000_000

interface MarketSnapshot {
  sample_count: number
  median_price_m2_clp: number | null
  avg_days_active: number | null
  sources: string[] | null
  computed_at: string
}

interface Comparable {
  price_clp: number
  price_uf: number | null
  area_m2: number
  price_per_m2_clp: number
  commune: string | null
  source: string
  source_url: string | null
  days_active: number | null
  scraped_at: string | null
}

function isAuthorized(request: NextRequest): boolean {
  const password = process.env.APP_PASSWORD?.trim()
  if (!password) return false

  const expected = createHash('sha256')
    .update(`sur-realista:${password}`)
    .digest('hex')
  const received = request.cookies.get(ACCESS_COOKIE)?.value ?? ''

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

async function getCurrentUF(): Promise<{ value: number; date: string } | null> {
  try {
    const response = await fetch('https://mindicador.cl/api/uf', {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return null

    const payload = await response.json()
    const value = Number(payload?.serie?.[0]?.valor)
    const date = String(payload?.serie?.[0]?.fecha ?? '')
    if (!Number.isFinite(value) || value <= 0 || !date) return null

    return { value, date }
  } catch {
    return null
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle]
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const propertyType = String(body.property_type ?? '').trim().toLowerCase()
    const region = String(body.region ?? '').trim()
    const city = String(body.city ?? '').trim()
    const sqm = Number(body.area_sqm)

    if (!propertyType || !region || !Number.isFinite(sqm) || sqm <= 0 || sqm > MAX_AREA_SQM) {
      return NextResponse.json(
        { error: 'Tipo de propiedad, región y superficie válida son obligatorios.' },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Servicio de datos no configurado.' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let comparableQuery = supabase
      .from('properties_external')
      .select('price_clp,price_uf,area_m2,price_per_m2_clp,commune,source,source_url,days_active,scraped_at')
      .ilike('region', `%${region}%`)
      .eq('property_type', propertyType)
      .eq('operation', 'venta')
      .eq('is_active', true)
      .gt('price_clp', 0)
      .gt('price_per_m2_clp', 0)
      .gt('area_m2', sqm * 0.4)
      .lt('area_m2', sqm * 2.5)
      .order('scraped_at', { ascending: false })
      .limit(40)

    if (city) comparableQuery = comparableQuery.ilike('commune', `%${city}%`)

    const [ufResult, comparableResult, marketResult] = await Promise.all([
      getCurrentUF(),
      comparableQuery,
      supabase
        .from('market_comparable_data')
        .select('sample_count,median_price_m2_clp,avg_days_active,sources,computed_at')
        .ilike('region', `%${region}%`)
        .eq('property_type', propertyType)
        .eq('operation', 'venta')
        .order('computed_at', { ascending: false })
        .limit(1),
    ])

    if (comparableResult.error) {
      console.error('[Cotizador] Error consultando comparables:', comparableResult.error.message)
    }
    if (marketResult.error) {
      console.error('[Cotizador] Error consultando estadísticas:', marketResult.error.message)
    }

    const directComparables = ((comparableResult.data ?? []) as Comparable[]).filter(
      (item) => Number.isFinite(item.price_per_m2_clp) && item.price_per_m2_clp > 0,
    )
    const marketSnapshot = (marketResult.data?.[0] ?? null) as MarketSnapshot | null

    let basePriceM2: number | null = null
    let methodology = ''
    let sampleCount = 0
    let dataSources: string[] = []
    let lastUpdated: string | null = null
    let confidence = 0

    if (directComparables.length >= MIN_COMPARABLES) {
      const prices = directComparables.map((item) => item.price_per_m2_clp)
      const q1 = [...prices].sort((a, b) => a - b)[Math.floor(prices.length * 0.25)]
      const q3 = [...prices].sort((a, b) => a - b)[Math.floor(prices.length * 0.75)]
      const filtered = directComparables.filter(
        (item) => item.price_per_m2_clp >= q1 && item.price_per_m2_clp <= q3,
      )
      const usable = filtered.length >= MIN_COMPARABLES ? filtered : directComparables

      basePriceM2 = median(usable.map((item) => item.price_per_m2_clp))
      sampleCount = usable.length
      dataSources = [...new Set(usable.map((item) => item.source).filter(Boolean))]
      lastUpdated = usable.map((item) => item.scraped_at).filter(Boolean).sort().at(-1) ?? null
      methodology = `Mediana de ${sampleCount} avisos comparables activos, filtrados por región, tipo y superficie.`
      confidence = Math.min(65 + sampleCount * 2, 90)
    } else if (
      marketSnapshot &&
      marketSnapshot.sample_count >= MIN_COMPARABLES &&
      Number(marketSnapshot.median_price_m2_clp) > 0
    ) {
      basePriceM2 = Number(marketSnapshot.median_price_m2_clp)
      sampleCount = marketSnapshot.sample_count
      dataSources = marketSnapshot.sources ?? []
      lastUpdated = marketSnapshot.computed_at
      methodology = `Mediana agregada de ${sampleCount} registros comparables de mercado.`
      confidence = Math.min(60 + Math.floor(sampleCount / 3), 85)
    }

    if (!basePriceM2) {
      return NextResponse.json(
        {
          error: 'No hay suficientes comparables verificables para calcular una referencia responsable.',
          code: 'INSUFFICIENT_COMPARABLES',
          sample_count: directComparables.length,
        },
        { status: 422 },
      )
    }

    const estimatedPrice = Math.round(basePriceM2 * sqm)
    const margin = sampleCount >= 15 ? 0.12 : sampleCount >= 8 ? 0.16 : 0.22
    const minPrice = Math.round(estimatedPrice * (1 - margin))
    const maxPrice = Math.round(estimatedPrice * (1 + margin))

    const ufValue = ufResult?.value ?? null
    const toUF = (value: number) => ufValue ? Number((value / ufValue).toFixed(2)) : null

    return NextResponse.json({
      estimated_price: estimatedPrice,
      estimated_price_uf: toUF(estimatedPrice),
      price_range: {
        min: minPrice,
        max: maxPrice,
        min_uf: toUF(minPrice),
        max_uf: toUF(maxPrice),
      },
      price_per_sqm: basePriceM2,
      price_per_sqm_uf: ufValue ? Number((basePriceM2 / ufValue).toFixed(4)) : null,
      confidence,
      sample_count: sampleCount,
      methodology,
      comparable_analysis: methodology,
      data_sources: dataSources,
      market_factors: [
        `Superficie analizada: ${sqm.toLocaleString('es-CL')} m²`,
        `Precio mediano comparable: $${basePriceM2.toLocaleString('es-CL')}/m²`,
        `Muestra utilizada: ${sampleCount} registros`,
      ],
      recommendations: [
        'Este resultado es una referencia comercial interna y no una tasación oficial.',
        'Verifique estado jurídico, accesos, servicios, topografía y restricciones antes de tomar una decisión.',
      ],
      comparables_summary: directComparables.slice(0, 5).map((item) => ({
        price_clp: item.price_clp,
        price_uf: item.price_uf,
        area_m2: item.area_m2,
        price_per_m2_clp: item.price_per_m2_clp,
        commune: item.commune,
        source: item.source,
        source_url: item.source_url,
        scraped_at: item.scraped_at,
      })),
      last_updated: lastUpdated,
      uf_value: ufValue,
      uf_date: ufResult?.date ?? null,
      ignored_inputs: ['condition', 'features', 'macrofiltros', 'quickKeywords', 'additional_info'],
    })
  } catch (error) {
    console.error('[Cotizador] Error:', error)
    return NextResponse.json({ error: 'Error procesando la referencia de valor.' }, { status: 500 })
  }
}
