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
const MIN_CHALLENGER_CONFIDENCE = 45
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
  'sitio',
  'lote',
  'fundo',
  'predio',
]

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
    let sqm = Number.isFinite(rawArea) && rawArea > 0
      ? rawArea
      : parseNaturalArea(naturalInput) ?? parseNaturalArea(address)

    const rawLat = Number(body.lat ?? body.latitude ?? prior.lat)
    const rawLng = Number(body.lng ?? body.longitude ?? prior.lng)
    let subjectLat = Number.isFinite(rawLat) ? rawLat : null
    let subjectLng = Number.isFinite(rawLng) ? rawLng : null

    const currentContext = (): ResolvedContext => ({
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
      return needsInput(
        '¿Dónde está el terreno? Escríbeme la dirección o el sector tal como lo conoces.',
        ['address'],
        currentContext(),
      )
    }

    if (address && (!region || subjectLat === null || subjectLng === null)) {
      const matches = await geocodeChileAddress(address)
      if (!matches.length) {
        return needsInput(
          'No pude ubicar esa dirección con suficiente seguridad. ¿Puedes agregar la comuna o una referencia cercana?',
          ['address_clarification'],
          currentContext(),
        )
      }

      if (isAmbiguousAddress(matches)) {
        return needsInput(
          'Encontré más de una ubicación posible. ¿A cuál te refieres?',
          ['address_clarification'],
          currentContext(),
          matches.slice(0, 3).map((item) => item.display_name),
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
      return needsInput(
        'Pude aproximar la ubicación, pero me falta identificar la región. ¿En qué comuna o región está?',
        ['region'],
        currentContext(),
      )
    }

    if (!sqm) {
      return needsInput(
        'Ubicación encontrada. ¿Cuántos m² o hectáreas tiene aproximadamente el terreno?',
        ['area_sqm'],
        currentContext(),
      )
    }

    sqm = Math.round(sqm)
    if (!Number.isFinite(sqm) || sqm <= 0 || sqm > MAX_AREA_SQM) {
      return needsInput(
        'No pude interpretar la superficie. Puedes responder, por ejemplo, “5.000 m²” o “12 hectáreas”.',
        ['area_sqm'],
        currentContext(),
      )
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Servicio de datos no configurado.' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Champion: keep the proven exact-type/local-window logic unchanged.
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

    // National fallback: all compatible land-family listings in the resolved region.
    // This is independent from KMZ coverage and ranks locality/spatial distance later.
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

    const [ufResult, comparableResult, challengerResult] = await Promise.all([
      getCurrentUF(),
      comparableQuery,
      challengerQuery,
    ])

    if (comparableResult.error) {
      console.error('[Cotizador] Error consultando comparables champion:', comparableResult.error.message)
    }
    if (challengerResult.error) {
      console.error('[Cotizador] Error consultando comparables challenger:', challengerResult.error.message)
    }

    const directComparables = ((comparableResult.data ?? []) as Comparable[]).filter(
      (item) => Number.isFinite(item.price_per_m2_clp) && item.price_per_m2_clp > 0,
    )
    const challengerComparables = ((challengerResult.data ?? []) as Comparable[]).filter(
      (item) => Number.isFinite(item.price_clp) && item.price_clp > 0 && Number.isFinite(item.area_m2) && item.area_m2 > 0,
    )

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

    let modelSource: 'champion_local' | 'challenger_national' = 'champion_local'
    let basePriceM2: number | null = null
    let estimatedPrice = 0
    let minPrice = 0
    let maxPrice = 0
    let methodology = ''
    let sampleCount = 0
    let dataSources: string[] = []
    let lastUpdated: string | null = null
    let confidence = 0
    let summaryComparables: Array<{
      price_clp: number
      price_uf: number | null
      area_m2: number
      price_per_m2_clp: number
      commune: string | null
      source: string
      source_url: string | null
      scraped_at: string | null
      similarity_score?: number
      geographic_tier?: string
    }> = []

    if (directComparables.length >= MIN_COMPARABLES) {
      const prices = directComparables.map((item) => item.price_per_m2_clp)
      const ordered = [...prices].sort((a, b) => a - b)
      const q1 = ordered[Math.floor(ordered.length * 0.25)]
      const q3 = ordered[Math.floor(ordered.length * 0.75)]
      const filtered = directComparables.filter(
        (item) => item.price_per_m2_clp >= q1 && item.price_per_m2_clp <= q3,
      )
      const usable = filtered.length >= MIN_COMPARABLES ? filtered : directComparables

      basePriceM2 = median(usable.map((item) => item.price_per_m2_clp))
      sampleCount = usable.length
      dataSources = [...new Set(usable.map((item) => item.source).filter(Boolean))]
      lastUpdated = usable.map((item) => item.scraped_at).filter(Boolean).sort().at(-1) ?? null
      methodology = `Modelo local: mediana de ${sampleCount} avisos comparables activos, filtrados por región, tipo y superficie.`
      confidence = Math.min(65 + sampleCount * 2, 90)
      estimatedPrice = Math.round(basePriceM2 * sqm)
      const margin = sampleCount >= 15 ? 0.12 : sampleCount >= 8 ? 0.16 : 0.22
      minPrice = Math.round(estimatedPrice * (1 - margin))
      maxPrice = Math.round(estimatedPrice * (1 + margin))
      summaryComparables = usable.slice(0, 5).map((item) => ({
        price_clp: item.price_clp,
        price_uf: item.price_uf,
        area_m2: item.area_m2,
        price_per_m2_clp: item.price_per_m2_clp,
        commune: item.commune,
        source: item.source,
        source_url: item.source_url,
        scraped_at: item.scraped_at,
      }))
    } else if (
      challenger &&
      challenger.sample_count >= MIN_COMPARABLES &&
      challenger.confidence >= MIN_CHALLENGER_CONFIDENCE
    ) {
      modelSource = 'challenger_national'
      basePriceM2 = challenger.price_per_sqm
      sampleCount = challenger.sample_count
      confidence = challenger.confidence
      estimatedPrice = challenger.estimated_price
      minPrice = challenger.price_range.low
      maxPrice = challenger.price_range.high

      const selected = challenger.comparables.filter((item) => item.included)
      dataSources = [...new Set(selected.map((item) => item.source).filter(Boolean))]
      lastUpdated = selected.map((item) => item.scraped_at).filter(Boolean).sort().at(-1) ?? null
      methodology = `Modelo nacional ${challenger.algorithm_version}: ${sampleCount} comparables de familia suelo, priorizados por comuna/distancia, similitud de superficie, recencia y calidad de evidencia.`
      summaryComparables = selected.slice(0, 5).map((item) => ({
        price_clp: item.price_clp,
        price_uf: item.price_uf,
        area_m2: item.effective_area_m2,
        price_per_m2_clp: Math.round(item.effective_price_per_m2_clp),
        commune: item.commune,
        source: item.source,
        source_url: item.source_url,
        scraped_at: item.scraped_at,
        similarity_score: item.similarity_score,
        geographic_tier: item.geographic_tier,
      }))
    }

    if (!basePriceM2) {
      const lowConfidence = challenger && challenger.sample_count >= MIN_COMPARABLES
      return NextResponse.json(
        {
          status: 'insufficient_evidence',
          error: lowConfidence
            ? 'Hay evidencia de mercado, pero todavía no alcanza el nivel mínimo de confianza para emitir una referencia responsable.'
            : 'No hay suficientes comparables verificables para emitir una referencia responsable.',
          code: lowConfidence ? 'LOW_CHALLENGER_CONFIDENCE' : 'INSUFFICIENT_COMPARABLES',
          question: lowConfidence
            ? 'Si tienes una referencia más precisa del sector o un enlace de ubicación, puedo intentar afinar la búsqueda.'
            : null,
          sample_count: directComparables.length,
          resolved_context: resolvedContext,
          challenger: challenger ? { status: 'diagnostic', non_binding: true, ...challenger } : null,
        },
        { status: 422 },
      )
    }

    const ufValue = ufResult?.value ?? null
    const toUF = (value: number) => ufValue ? Number((value / ufValue).toFixed(2)) : null

    return NextResponse.json({
      status: 'valued',
      model_source: modelSource,
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
      confidence_label: confidence >= 75 ? 'alta' : confidence >= 55 ? 'media' : 'baja',
      sample_count: sampleCount,
      methodology,
      comparable_analysis: methodology,
      data_sources: dataSources,
      market_factors: [
        displayName ? `Ubicación resuelta: ${displayName}` : `Región analizada: ${region}`,
        `Superficie analizada: ${sqm.toLocaleString('es-CL')} m²`,
        `Precio mediano comparable: $${basePriceM2.toLocaleString('es-CL')}/m²`,
        `Muestra utilizada: ${sampleCount} registros`,
        modelSource === 'challenger_national'
          ? 'Cobertura ampliada: familia de terrenos con priorización territorial y por similitud.'
          : 'Cobertura local: tipo exacto y comuna cuando existe muestra suficiente.',
      ],
      recommendations: [
        'Este resultado es una referencia comercial interna y no una tasación oficial.',
        'Verifique estado jurídico, accesos, servicios, topografía y restricciones antes de tomar una decisión.',
      ],
      comparables_summary: summaryComparables,
      challenger: challenger
        ? {
            status: modelSource === 'challenger_national' ? 'active_fallback' : 'shadow_only',
            non_binding: modelSource !== 'challenger_national',
            ...challenger,
          }
        : null,
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
