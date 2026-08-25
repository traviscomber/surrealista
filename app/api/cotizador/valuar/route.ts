import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geocodeChileAddress, isAmbiguousAddress } from '@/lib/geocoding/forward-geocode'
import { inferLandType, parseNaturalArea } from '@/lib/valuation/natural-input'
import { buildMarketChallenger, type MarketComparableInput } from '@/lib/valuation/market-challenger'

export const maxDuration = 30
export const runtime = 'nodejs'

const ACCESS_COOKIE = 'sur_realista_access'
const MIN_COMPARABLES = 3
const MAX_AREA_SQM = 1_000_000_000
const LAND_PROPERTY_TYPES = [
  'terreno',
  'parcela',
  'campo',
  'agrícola',
  'terreno rural',
  'terreno residencial',
  'campo agrícola',
  'campo forestal',
  'fundo agrícola',
  'fundo ganadero',
  'fundo lechero',
  'loteo / parcelación',
]

interface MarketSnapshot {
  sample_count: number
  median_price_m2_clp: number | null
  avg_days_active: number | null
  sources: string[] | null
  computed_at: string
}

type Comparable = MarketComparableInput

type ResolvedContext = {
  address: string | null
  display_name: string | null
  region: string | null
  city: string | null
  lat: number | null
  lng: number | null
  property_type: string
  area_sqm: number | null
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

function needsInput(question: string, missing: string[], context: ResolvedContext, options?: string[]) {
  return NextResponse.json({
    status: 'needs_input',
    question,
    missing,
    options: options ?? null,
    resolved_context: context,
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const prior = body.resolved_context ?? {}
    const address = String(body.address ?? prior.address ?? '').trim()
    const naturalInput = String(body.natural_input ?? body.answer ?? '').trim()
    const explicitPropertyType = String(body.property_type ?? prior.property_type ?? '').trim().toLowerCase()
    const propertyType = explicitPropertyType || inferLandType(`${address} ${naturalInput}`)

    let region = String(body.region ?? prior.region ?? '').trim()
    let city = String(body.city ?? prior.city ?? '').trim()
    let displayName = String(prior.display_name ?? '').trim()

    const rawArea = Number(body.area_sqm ?? prior.area_sqm)
    let sqm = Number.isFinite(rawArea) && rawArea > 0 ? rawArea : parseNaturalArea(naturalInput) ?? parseNaturalArea(address)

    const rawLat = Number(body.lat ?? body.latitude ?? prior.lat)
    const rawLng = Number(body.lng ?? body.longitude ?? prior.lng)
    let subjectLat = Number.isFinite(rawLat) ? rawLat : null
    let subjectLng = Number.isFinite(rawLng) ? rawLng : null

    const emptyContext = (): ResolvedContext => ({
      address: address || null,
      display_name: displayName || null,
      region: region || null,
      city: city || null,
      lat: subjectLat,
      lng: subjectLng,
      property_type: propertyType,
      area_sqm: sqm ?? null,
    })

    if (!address && !region) {
      return needsInput('¿Dónde está el terreno? Escríbeme la dirección o el sector tal como lo conoces.', ['address'], emptyContext())
    }

    if (address && (!region || subjectLat === null || subjectLng === null)) {
      const matches = await geocodeChileAddress(address)
      if (!matches.length) {
        return needsInput(
          'No pude ubicar esa dirección con suficiente seguridad. ¿Puedes agregar la comuna o una referencia cercana?',
          ['address_clarification'],
          emptyContext(),
        )
      }

      if (isAmbiguousAddress(matches)) {
        const options = matches.slice(0, 3).map((item) => item.display_name)
        return needsInput(
          `Encontré más de una ubicación posible. ¿A cuál te refieres?`,
          ['address_clarification'],
          emptyContext(),
          options,
        )
      }

      const best = matches[0]
      subjectLat = best.lat
      subjectLng = best.lng
      region = best.region ?? region
      city = best.commune ?? city
      displayName = best.display_name
    }

    if (!region) {
      return needsInput('Pude aproximar la ubicación, pero me falta identificar la región. ¿En qué comuna o región está?', ['region'], emptyContext())
    }

    if (!sqm) {
      return needsInput(
        'Ubicación encontrada. ¿Cuántos m² o hectáreas tiene aproximadamente el terreno?',
        ['area_sqm'],
        emptyContext(),
      )
    }

    sqm = Math.round(sqm)
    if (!Number.isFinite(sqm) || sqm <= 0 || sqm > MAX_AREA_SQM) {
      return needsInput('No pude interpretar la superficie. Puedes responder, por ejemplo, “5.000 m²” o “12 hectáreas”.', ['area_sqm'], emptyContext())
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Servicio de datos no configurado.' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Production champion remains intentionally unchanged: exact normalized type,
    // region and subject-area window. Address resolution only supplies those inputs.
    let comparableQuery = supabase
      .from('properties_external')
      .select('price_clp,price_uf,area_m2,price_per_m2_clp,commune,source,source_url,days_active,scraped_at,title,lat,lng')
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

    // Challenger is land-family based, not KMZ based and not tied to one literal
    // listing category. It ranks local/spatial evidence and falls back to the region.
    const challengerQuery = supabase
      .from('properties_external')
      .select('price_clp,price_uf,area_m2,price_per_m2_clp,commune,source,source_url,days_active,scraped_at,title,lat,lng')
      .ilike('region', `%${region}%`)
      .in('property_type', LAND_PROPERTY_TYPES)
      .eq('operation', 'venta')
      .eq('is_active', true)
      .gt('price_clp', 0)
      .gt('area_m2', 0)
      .order('scraped_at', { ascending: false })
      .limit(300)

    const [ufResult, comparableResult, challengerResult, marketResult] = await Promise.all([
      getCurrentUF(),
      comparableQuery,
      challengerQuery,
      supabase
        .from('market_comparable_data')
        .select('sample_count,median_price_m2_clp,avg_days_active,sources,computed_at')
        .ilike('region', `%${region}%`)
        .eq('property_type', propertyType)
        .eq('operation', 'venta')
        .order('computed_at', { ascending: false })
        .limit(1),
    ])

    if (comparableResult.error) console.error('[Cotizador] Error consultando comparables:', comparableResult.error.message)
    if (challengerResult.error) console.error('[Cotizador] Error consultando candidatos challenger:', challengerResult.error.message)
    if (marketResult.error) console.error('[Cotizador] Error consultando estadísticas:', marketResult.error.message)

    const directComparables = ((comparableResult.data ?? []) as Comparable[]).filter(
      (item) => Number.isFinite(item.price_per_m2_clp) && item.price_per_m2_clp > 0,
    )
    const challengerComparables = ((challengerResult.data ?? []) as Comparable[]).filter(
      (item) => Number.isFinite(item.price_clp) && item.price_clp > 0 && Number.isFinite(item.area_m2) && item.area_m2 > 0,
    )
    const marketSnapshot = (marketResult.data?.[0] ?? null) as MarketSnapshot | null

    const challenger = challengerComparables.length >= MIN_COMPARABLES
      ? buildMarketChallenger({
          comparables: challengerComparables,
          area_m2: sqm,
          region,
          commune: city || null,
          property_type: propertyType,
          lat: subjectLat,
          lng: subjectLng,
        })
      : null

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

    const resolvedContext: ResolvedContext = {
      address: address || null,
      display_name: displayName || null,
      region,
      city: city || null,
      lat: subjectLat,
      lng: subjectLng,
      property_type: propertyType,
      area_sqm: sqm,
    }

    if (!basePriceM2) {
      return NextResponse.json(
        {
          error: 'No hay suficientes comparables del modelo actual para emitir una referencia vinculante.',
          code: 'INSUFFICIENT_COMPARABLES',
          sample_count: directComparables.length,
          resolved_context: resolvedContext,
          challenger: challenger ? { status: 'shadow_only', non_binding: true, ...challenger } : null,
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
      status: 'valued',
      resolved_context: resolvedContext,
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
        displayName ? `Ubicación resuelta: ${displayName}` : `Región analizada: ${region}`,
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
      challenger: challenger ? { status: 'shadow_only', non_binding: true, ...challenger } : null,
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
