import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketSnapshot {
  sample_count: number
  median_price_m2_clp: number | null
  avg_price_m2_clp: number | null
  p25_price_m2_clp: number | null
  p75_price_m2_clp: number | null
  avg_days_active: number | null
  sources: string[]
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
}

// ─── Condition multipliers ────────────────────────────────────────────────────

const CONDITION_MULTIPLIERS: Record<string, number> = {
  excelente: 1.20,
  bueno: 1.00,
  regular: 0.85,
  reparacion: 0.65,
  construccion: 0.50,
  terreno: 1.00,
}

// ─── Macrofilter multiplier (rural properties) ───────────────────────────────

function calcMacroMultiplier(macro: Record<string, string[]>): {
  multiplier: number
  adjustments: string[]
} {
  const adjustments: string[] = []
  let m = 1.0

  const boost = (score: number, thresholds: [number, number][], labels: [string, string][]) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (score >= thresholds[i][0]) {
        m *= 1 + thresholds[i][1] / 100
        adjustments.push(labels[i][0] + ` (+${thresholds[i][1]}%)`)
        break
      }
    }
  }

  boost(macro?.recursosHidricos?.length ?? 0, [[5, 25], [3, 15], [1, 8]], [
    ['Recursos hídricos abundantes', ''],
    ['Derechos de agua constituidos', ''],
    ['Acceso a agua', ''],
  ])
  boost(macro?.aptitudAgricola?.length ?? 0, [[4, 15], [2, 8]], [
    ['Aptitud agrícola excelente', ''], ['Aptitud agrícola buena', ''],
  ])
  boost(macro?.desarrolloInmobiliario?.length ?? 0, [[5, 30], [3, 15]], [
    ['Alto potencial inmobiliario', ''], ['Potencial de subdivisión', ''],
  ])
  boost(macro?.aptitudLechera?.length ?? 0, [[5, 22]], [['Capacidad lechera premium', '']])
  boost(macro?.aptitudFruticola?.length ?? 0, [[5, 20]], [['Alto potencial frutícola', '']])
  boost(macro?.aptitudGanadera?.length ?? 0, [[5, 18]], [['Excelente para ganadería', '']])
  boost(macro?.conservacionTurismo?.length ?? 0, [[5, 18]], [['Potencial ecoturismo', '']])
  boost(macro?.potencialForestal?.length ?? 0, [[4, 12]], [['Potencial forestal', '']])
  boost(macro?.infraestructura?.length ?? 0, [[5, 12]], [['Infraestructura completa', '']])
  boost(macro?.accesibilidad?.length ?? 0, [[5, 10]], [['Excelente accesibilidad', '']])

  return { multiplier: m, adjustments }
}

// ─── Feature bonus ────────────────────────────────────────────────────────────

const PREMIUM_KEYWORDS = [
  'piscina', 'sauna', 'gimnasio', 'estacionamiento', 'parking', 'jardín',
  'patio', 'terraza', 'vista al mar', 'vista privilegiada', 'acceso metro',
  'seguridad', 'vigilancia', 'portería', 'conserje', 'bodega', 'parrilla',
]

function calcFeatureBonus(featuresStr: string | undefined): number {
  if (!featuresStr) return 1.0
  const list = featuresStr.split(',').map((f) => f.trim().toLowerCase())
  const matched = list.filter((f) => PREMIUM_KEYWORDS.some((k) => f.includes(k) || k.includes(f)))
  return 1 + matched.length * 0.05
}

// ─── Live UF value ────────────────────────────────────────────────────────────

async function getUF(): Promise<number> {
  try {
    const res = await fetch('https://mindicador.cl/api/uf', { signal: AbortSignal.timeout(4000) })
    const json = await res.json()
    return json?.serie?.[0]?.valor ?? 39_500
  } catch {
    return 39_500
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { property_type, region, city, area_sqm, condition, features, macrofiltros } = body

    if (!property_type || !region || !area_sqm) {
      return NextResponse.json({ error: 'Datos incompletos: property_type, region y area_sqm requeridos' }, { status: 400 })
    }

    const sqm = parseFloat(area_sqm)
    if (isNaN(sqm) || sqm <= 0) {
      return NextResponse.json({ error: 'Área inválida' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [ufValue, marketComparableRes, directComparableRes, siiRes] = await Promise.allSettled([
      getUF(),

      // 1. Precomputed market stats (most reliable, comes from scraped data)
      supabase
        .from('market_comparable_data')
        .select('sample_count,median_price_m2_clp,avg_price_m2_clp,p25_price_m2_clp,p75_price_m2_clp,avg_days_active,sources,computed_at')
        .ilike('region', `%${region}%`)
        .eq('property_type', property_type.toLowerCase())
        .eq('operation', 'venta')
        .order('period_date', { ascending: false })
        .order('computed_at', { ascending: false })
        .limit(3),

      // 2. Direct comparable listings from scraped properties
      supabase
        .from('properties_external')
        .select('price_clp,price_uf,area_m2,price_per_m2_clp,commune,source,source_url,days_active')
        .ilike('region', `%${region}%`)
        .eq('property_type', property_type.toLowerCase())
        .eq('operation', 'venta')
        .eq('is_active', true)
        .gt('price_clp', 0)
        .gt('area_m2', sqm * 0.4)
        .lt('area_m2', sqm * 2.5)
        .order('scraped_at', { ascending: false })
        .limit(20),

      // 3. SII fiscal valuations
      supabase
        .from('sii_coordinate_extractions')
        .select('avaluo_total,built_area,surface_area')
        .ilike('region', `%${region}%`)
        .limit(30),
    ])

    const uf = ufValue.status === 'fulfilled' ? ufValue.value : 39_500
    const marketRows: MarketSnapshot[] =
      marketComparableRes.status === 'fulfilled' ? (marketComparableRes.value.data ?? []) : []
    const directComps: Comparable[] =
      directComparableRes.status === 'fulfilled' ? (directComparableRes.value.data ?? []) : []
    const siiRows: { avaluo_total: number; surface_area: number }[] =
      siiRes.status === 'fulfilled' ? (siiRes.value.data ?? []) : []

    // ── Determine base price/m² ─────────────────────────────────────────────

    let base_price_m2 = 0
    let data_tier: 'live_market' | 'market_stats' | 'comparable_direct' | 'sii' | 'fallback' = 'fallback'
    let data_sources: string[] = []
    let confidence = 60
    let sample_count = 0

    // Tier 1: aggregated market stats from scraped data (most trusted)
    if (marketRows.length > 0 && marketRows[0].median_price_m2_clp) {
      const row = marketRows[0]
      base_price_m2 = row.median_price_m2_clp
      data_tier = 'market_stats'
      data_sources = row.sources ?? []
      sample_count = row.sample_count
      confidence = Math.min(70 + Math.floor(sample_count / 5), 88)
    }

    // Tier 2: direct comparable listings (very fresh, fewer samples)
    if (directComps.length >= 3) {
      const validComps = directComps.filter((c) => c.price_per_m2_clp > 0)
      if (validComps.length >= 3) {
        const sorted = [...validComps].sort((a, b) => a.price_per_m2_clp - b.price_per_m2_clp)
        const p25 = sorted[Math.floor(sorted.length * 0.25)].price_per_m2_clp
        const p75 = sorted[Math.floor(sorted.length * 0.75)].price_per_m2_clp
        const filtered = sorted.filter((c) => c.price_per_m2_clp >= p25 && c.price_per_m2_clp <= p75)
        const median = filtered[Math.floor(filtered.length / 2)].price_per_m2_clp

        // Use direct comps if no market stats or they have more samples
        if (!base_price_m2 || validComps.length > sample_count) {
          base_price_m2 = median
          data_tier = 'comparable_direct'
          data_sources = [...new Set(validComps.map((c) => c.source))]
          sample_count = validComps.length
          confidence = Math.min(72 + validComps.length * 2, 90)
        }
      }
    }

    // Tier 3: SII fiscal valuations
    if (!base_price_m2 && siiRows.length > 0) {
      const valid = siiRows.filter((r) => r.avaluo_total > 0 && (r.surface_area ?? 0) > 0)
      if (valid.length > 0) {
        const avgM2 = valid.reduce((s, r) => s + r.avaluo_total / (r.surface_area || 1), 0) / valid.length
        base_price_m2 = Math.round(avgM2)
        data_tier = 'sii'
        data_sources = ['SII — Servicio de Impuestos Internos']
        sample_count = valid.length
        confidence = 70
      }
    }

    // Tier 4: static regional fallback (never hardcoded dates)
    if (!base_price_m2) {
      const FALLBACK: Record<string, Record<string, number>> = {
        Metropolitana: { terreno: 8000, casa: 6500, departamento: 5500, comercial: 7000, agrícola: 3000, industrial: 4500 },
        Valparaíso: { terreno: 4500, casa: 4000, departamento: 3800, comercial: 4200, agrícola: 1800, industrial: 2500 },
        'Los Lagos': { terreno: 3500, casa: 3200, departamento: 2800, comercial: 3200, agrícola: 1500, industrial: 2000 },
        'Los Ríos': { terreno: 2800, casa: 2500, departamento: 2200, comercial: 2600, agrícola: 1200, industrial: 1500 },
        Biobío: { terreno: 3200, casa: 2800, departamento: 2500, comercial: 3000, agrícola: 1400, industrial: 1800 },
        Araucanía: { terreno: 2200, casa: 2000, departamento: 1800, comercial: 2100, agrícola: 900, industrial: 1200 },
      }
      const regionKey = Object.keys(FALLBACK).find((k) => region.toLowerCase().includes(k.toLowerCase()))
      const typeKey = property_type.toLowerCase()
      const regionFallback = FALLBACK[regionKey ?? 'Biobío'] ?? FALLBACK['Biobío']
      base_price_m2 = regionFallback[typeKey] ?? regionFallback['terreno'] ?? 2000
      data_tier = 'fallback'
      data_sources = ['Benchmarks regionales (sin datos de mercado aún)']
      confidence = 55
    }

    // ── Apply multipliers ───────────────────────────────────────────────────

    const condMultiplier = CONDITION_MULTIPLIERS[condition ?? 'bueno'] ?? 1.0
    const featureMultiplier = calcFeatureBonus(features)
    const { multiplier: macroMultiplier, adjustments: macroAdjustments } = macrofiltros
      ? calcMacroMultiplier(macrofiltros)
      : { multiplier: 1.0, adjustments: [] }

    const adjusted_price_m2 = Math.round(base_price_m2 * condMultiplier * featureMultiplier * macroMultiplier)
    const estimated_price = Math.round(adjusted_price_m2 * sqm)

    // Price range: narrower when data quality is higher
    const margin = data_tier === 'fallback' ? 0.22 : data_tier === 'sii' ? 0.18 : 0.12
    const min_price = Math.round(estimated_price * (1 - margin))
    const max_price = Math.round(estimated_price * (1 + margin))

    // ── UF conversion ───────────────────────────────────────────────────────

    const estimated_price_uf = parseFloat((estimated_price / uf).toFixed(2))
    const min_price_uf = parseFloat((min_price / uf).toFixed(2))
    const max_price_uf = parseFloat((max_price / uf).toFixed(2))

    // ── Market context ──────────────────────────────────────────────────────

    const marketRow = marketRows[0]
    const market_context = marketRow
      ? {
          median_price_m2_clp: marketRow.median_price_m2_clp,
          avg_days_active: marketRow.avg_days_active ? Math.round(marketRow.avg_days_active) : null,
          sample_count: marketRow.sample_count,
          last_updated: marketRow.computed_at,
        }
      : null

    // ── Comparables summary ─────────────────────────────────────────────────

    const comparables_summary = directComps.slice(0, 5).map((c) => ({
      price_clp: c.price_clp,
      price_uf: c.price_uf ?? parseFloat((c.price_clp / uf).toFixed(2)),
      area_m2: c.area_m2,
      price_per_m2_clp: c.price_per_m2_clp,
      commune: c.commune,
      source: c.source,
      source_url: c.source_url,
    }))

    // ── Methodology & recommendations ───────────────────────────────────────

    const TIER_LABELS: Record<string, string> = {
      live_market: 'Análisis comparativo directo (datos de portales en tiempo real)',
      market_stats: `Estadísticas de mercado (${sample_count} propiedades scraped en ${region})`,
      comparable_direct: `Comparables directos (${sample_count} listings activos similares)`,
      sii: `Avalúos fiscales SII (${sample_count} registros)`,
      fallback: 'Benchmarks regionales (ejecutar scrapers para datos vivos)',
    }

    const market_factors = [
      `Precio base mercado: $${base_price_m2.toLocaleString('es-CL')}/m²`,
      `Condición (${condition ?? 'bueno'}): ${(condMultiplier * 100).toFixed(0)}%`,
      featureMultiplier > 1 && `Características premium: +${((featureMultiplier - 1) * 100).toFixed(0)}%`,
      ...macroAdjustments,
      `Fuentes: ${data_sources.join(', ')}`,
    ].filter(Boolean) as string[]

    const recommendations: string[] = []
    if (condition === 'reparacion' || condition === 'construccion') {
      recommendations.push('Inversión de mejoras necesaria — el valor final dependerá del estándar de terminación')
    }
    if (data_tier === 'fallback') {
      recommendations.push('Ejecute `npm run scraper:run` para obtener comparables de mercado actualizados y aumentar la precisión')
    }
    if (sqm > 10_000 && (property_type === 'agrícola' || property_type === 'terreno')) {
      recommendations.push('Propiedad de gran extensión — análisis de divisibilidad puede aumentar el valor total')
    }
    if (region.includes('Metropolitana')) {
      recommendations.push('Zona de alta liquidez — menor tiempo de venta que el promedio nacional')
    }
    recommendations.push('Para tasación oficial con fines bancarios o legales, solicite un perito tasador certificado')

    return NextResponse.json({
      // Core valuation
      estimated_price,
      estimated_price_uf,
      price_range: { min: min_price, max: max_price, min_uf: min_price_uf, max_uf: max_price_uf },
      price_per_sqm: adjusted_price_m2,
      price_per_sqm_uf: parseFloat((adjusted_price_m2 / uf).toFixed(4)),

      // Quality indicators
      confidence: Math.min(confidence, 95),
      data_tier,
      sample_count,
      methodology: TIER_LABELS[data_tier],
      comparable_analysis: `Valuación basada en ${TIER_LABELS[data_tier].toLowerCase()}. UF al día hoy: ${uf.toLocaleString('es-CL')}.`,

      // Breakdown
      market_factors,
      recommendations,
      data_sources,

      // Live market context
      market_context,
      comparables_summary,
      uf_value: uf,
    })
  } catch (error: unknown) {
    console.error('[Cotizador] Error:', error)
    return NextResponse.json({ error: 'Error procesando valuación' }, { status: 500 })
  }
}
