import { createClient } from '@supabase/supabase-js'

type NearbyInput = {
  lat: number | null
  lng: number | null
  commune: string | null
  region: string | null
  area_m2: number | null
}

type PointLike = {
  lat?: number | null
  lng?: number | null
  latitude?: number | null
  longitude?: number | null
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function pointDistance(subject: NearbyInput, row: PointLike) {
  if (subject.lat === null || subject.lng === null) return null
  const lat = Number(row.lat ?? row.latitude)
  const lng = Number(row.lng ?? row.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return haversineKm(subject.lat, subject.lng, lat, lng)
}

export async function getNearbyIntelligence(input: NearbyInput) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      status: 'unavailable',
      market_neighbors: [],
      kmz_neighbors: [],
      territorial_context: [],
      recommendations_for_juan: ['No fue posible consultar la capa territorial interna en esta ejecución.'],
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const hasPoint = input.lat !== null && input.lng !== null
  const latSpan = 0.18
  const lngSpan = 0.22

  let marketQuery = supabase
    .from('properties_external')
    .select('title,commune,region,property_type,price_clp,area_m2,price_per_m2_clp,source,source_url,scraped_at,lat,lng')
    .eq('operation', 'venta')
    .eq('is_active', true)
    .gt('price_clp', 0)
    .gt('area_m2', 0)
    .limit(150)

  let kmzQuery = supabase
    .from('kmz_search_index')
    .select('id,name,latitude,longitude,region,city,address,kmz_id,created_at')
    .limit(250)

  if (hasPoint) {
    marketQuery = marketQuery
      .gte('lat', input.lat! - latSpan)
      .lte('lat', input.lat! + latSpan)
      .gte('lng', input.lng! - lngSpan)
      .lte('lng', input.lng! + lngSpan)
    kmzQuery = kmzQuery
      .gte('latitude', input.lat! - latSpan)
      .lte('latitude', input.lat! + latSpan)
      .gte('longitude', input.lng! - lngSpan)
      .lte('longitude', input.lng! + lngSpan)
  } else {
    if (input.commune) {
      marketQuery = marketQuery.ilike('commune', `%${input.commune}%`)
      kmzQuery = kmzQuery.ilike('city', `%${input.commune}%`)
    } else if (input.region) {
      marketQuery = marketQuery.ilike('region', `%${input.region}%`)
      kmzQuery = kmzQuery.ilike('region', `%${input.region}%`)
    }
  }

  const [marketResult, kmzResult] = await Promise.all([marketQuery, kmzQuery])

  const marketRows = (marketResult.data ?? [])
    .map((row: any) => ({ ...row, distance_km: pointDistance(input, row) }))
    .filter((row: any) => row.distance_km === null || row.distance_km <= 25)
    .sort((a: any, b: any) => (a.distance_km ?? 999) - (b.distance_km ?? 999))

  const kmzRows = (kmzResult.data ?? [])
    .map((row: any) => ({ ...row, distance_km: pointDistance(input, row) }))
    .filter((row: any) => row.distance_km === null || row.distance_km <= 25)
    .sort((a: any, b: any) => (a.distance_km ?? 999) - (b.distance_km ?? 999))

  const kmzIds = Array.from(new Set(kmzRows.map((row: any) => row.kmz_id).filter(Boolean)))
  let kmzMeta: any[] = []
  if (kmzIds.length) {
    const meta = await supabase
      .from('kmz_collection')
      .select('id,file_name,region,category,placemarks_count,created_at,is_active')
      .in('id', kmzIds.slice(0, 50))
      .eq('is_active', true)
    kmzMeta = meta.data ?? []
  }
  const metaById = new Map(kmzMeta.map((row: any) => [String(row.id), row]))

  const subjectArea = Number(input.area_m2 ?? 0)
  const marketNeighbors = marketRows
    .map((row: any) => {
      const area = Number(row.area_m2)
      const areaRatio = subjectArea > 0 && area > 0 ? Math.min(area, subjectArea) / Math.max(area, subjectArea) : null
      return {
        title: row.title,
        commune: row.commune,
        property_type: row.property_type,
        distance_km: row.distance_km === null ? null : Number(row.distance_km.toFixed(2)),
        area_m2: row.area_m2,
        price_clp: row.price_clp,
        price_per_m2_clp: row.price_per_m2_clp,
        area_similarity: areaRatio === null ? null : Number(areaRatio.toFixed(3)),
        source: row.source,
        source_url: row.source_url,
        scraped_at: row.scraped_at,
      }
    })
    .sort((a: any, b: any) => {
      const da = a.distance_km ?? 999
      const db = b.distance_km ?? 999
      const sa = a.area_similarity ?? 0
      const sb = b.area_similarity ?? 0
      return (da - db) || (sb - sa)
    })
    .slice(0, 12)

  const kmzNeighbors = kmzRows.slice(0, 20).map((row: any) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    region: row.region,
    distance_km: row.distance_km === null ? null : Number(row.distance_km.toFixed(2)),
    kmz_id: row.kmz_id,
    kmz_file: metaById.get(String(row.kmz_id)) ?? null,
  }))

  const categories = Array.from(new Set(kmzNeighbors.map((row: any) => row.kmz_file?.category).filter(Boolean)))
  const territorialContext = categories.map((category) => ({
    category,
    nearby_count: kmzNeighbors.filter((row: any) => row.kmz_file?.category === category).length,
  }))

  const recommendations: string[] = []
  const veryCloseMarket = marketNeighbors.filter((row: any) => row.distance_km !== null && row.distance_km <= 5)
  const closeKmz = kmzNeighbors.filter((row: any) => row.distance_km !== null && row.distance_km <= 5)
  const highSimilarity = marketNeighbors.filter((row: any) => (row.area_similarity ?? 0) >= 0.8)

  if (veryCloseMarket.length) recommendations.push(`Revisar primero ${veryCloseMarket.length} avisos activos a menos de 5 km: son la mejor evidencia comercial vecina.`)
  if (highSimilarity.length) recommendations.push(`${highSimilarity.length} vecinos de mercado tienen superficie muy similar al predio consultado; priorizarlos en la revisión humana.`)
  if (closeKmz.length) recommendations.push(`Cruzar los ${closeKmz.length} puntos/predios SR a menos de 5 km con los comparables de mercado antes de cerrar el rango.`)
  if (!marketNeighbors.length) recommendations.push('No hay vecinos de mercado georreferenciados cercanos; conviene ejecutar refresh de mercado dirigido al sector.')
  if (!kmzNeighbors.length) recommendations.push('No hay cobertura KMZ cercana; mantener la valoración con mercado vivo y contexto público sin penalizar por ausencia de KMZ.')
  if (categories.length) recommendations.push(`Revisar las capas KMZ cercanas (${categories.join(', ')}) como contexto, no como sustituto de comparables de mercado.`)

  return {
    status: marketResult.error && kmzResult.error ? 'degraded' : 'verified',
    radius_km: hasPoint ? 25 : null,
    market_neighbors: marketNeighbors,
    kmz_neighbors: kmzNeighbors,
    territorial_context: territorialContext,
    recommendations_for_juan: recommendations,
    warnings: [marketResult.error?.message, kmzResult.error?.message].filter(Boolean),
  }
}
