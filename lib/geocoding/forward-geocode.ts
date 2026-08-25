export interface ForwardGeocodeResult {
  display_name: string
  lat: number
  lng: number
  commune: string | null
  region: string | null
  road: string | null
  confidence: number
}

interface NominatimSearchResult {
  display_name?: string
  lat?: string
  lon?: string
  importance?: number
  type?: string
  addresstype?: string
  address?: {
    road?: string
    pedestrian?: string
    path?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    region?: string
    country?: string
    country_code?: string
  }
}

function normalizeRegion(region?: string | null) {
  if (!region) return null
  const value = region.trim()
  const aliases: Array<[RegExp, string]> = [
    [/los lagos/i, 'Región de Los Lagos'],
    [/los r[ií]os/i, 'Región de Los Ríos'],
    [/araucan[ií]a/i, 'Región de La Araucanía'],
    [/biob[ií]o/i, 'Región del Biobío'],
    [/nuble|ñuble/i, 'Región de Ñuble'],
    [/maule/i, 'Región del Maule'],
    [/o['’]?higgins|libertador/i, "Región del Libertador General Bernardo O'Higgins"],
    [/metropolitana|santiago/i, 'Región Metropolitana de Santiago'],
    [/valpara[ií]so/i, 'Región de Valparaíso'],
    [/coquimbo/i, 'Región de Coquimbo'],
    [/atacama/i, 'Región de Atacama'],
    [/antofagasta/i, 'Región de Antofagasta'],
    [/tarapac[aá]/i, 'Región de Tarapacá'],
    [/arica.*parinacota/i, 'Región de Arica y Parinacota'],
    [/ays[eé]n/i, 'Región de Aysén del General Carlos Ibáñez del Campo'],
    [/magallanes/i, 'Región de Magallanes y de la Antártica Chilena'],
  ]
  for (const [pattern, normalized] of aliases) {
    if (pattern.test(value)) return normalized
  }
  return value.startsWith('Región') ? value : `Región de ${value}`
}

function toResult(item: NominatimSearchResult): ForwardGeocodeResult | null {
  const lat = Number(item.lat)
  const lng = Number(item.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const address = item.address ?? {}
  const commune = address.municipality || address.city || address.town || address.village || address.county || null
  const region = normalizeRegion(address.state || address.region)
  const road = address.road || address.pedestrian || address.path || null
  const importance = Number(item.importance ?? 0.4)
  const administrative = commune && region ? 0.2 : region ? 0.1 : 0
  return {
    display_name: String(item.display_name ?? `${lat}, ${lng}`),
    lat,
    lng,
    commune,
    region,
    road,
    confidence: Math.max(0, Math.min(1, importance + administrative)),
  }
}

export async function geocodeChileAddress(query: string): Promise<ForwardGeocodeResult[]> {
  const text = query.trim()
  if (text.length < 3) return []

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'cl',
    limit: '4',
    q: text,
  })

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'SurRealista/1.0 (internal valuation)',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []
    const payload = await response.json() as NominatimSearchResult[]
    return payload
      .map(toResult)
      .filter((item): item is ForwardGeocodeResult => Boolean(item?.region))
  } catch (error) {
    console.error('[Cotizador] No se pudo resolver dirección:', error)
    return []
  }
}

export function isAmbiguousAddress(results: ForwardGeocodeResult[]) {
  if (results.length < 2) return false
  const [first, second] = results
  if (!first.commune || !second.commune || first.commune === second.commune) return false
  return Math.abs(first.confidence - second.confidence) < 0.08
}
