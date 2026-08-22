export type DpaSource = 'patrimonio-dpa' | 'subpesca-ide' | 'minvu-dpa-2020'

const DPA_SOURCES: Array<{ source: DpaSource; url: string }> = [
  {
    source: 'patrimonio-dpa',
    url: 'https://idepat.patrimoniocultural.gob.cl/server/rest/services/Hosted/Mapa_limites/FeatureServer/4/query',
  },
  {
    source: 'subpesca-ide',
    url: 'https://geoportal.subpesca.cl/server/rest/services/Hosted/COMUNA/FeatureServer/0/query',
  },
  {
    source: 'minvu-dpa-2020',
    url: 'https://geoide.minvu.cl/server/rest/services/Hosted/DS19/FeatureServer/3/query',
  },
]

export type DpaCommuneResolution = {
  code: string
  commune: string
  province: string | null
  region: string | null
  source: DpaSource
}

type ArcGisFeature = {
  attributes?: Record<string, string | number | null | undefined>
}

type ArcGisQueryResponse = {
  features?: ArcGisFeature[]
  error?: { code?: number; message?: string; details?: string[] }
}

function readAttribute(attributes: ArcGisFeature['attributes'], ...keys: string[]) {
  if (!attributes) return ''
  for (const key of keys) {
    const direct = attributes[key]
    if (direct !== undefined && direct !== null) return String(direct).trim()
    const found = Object.entries(attributes).find(([candidate]) => candidate.toLowerCase() === key.toLowerCase())
    if (found?.[1] !== undefined && found?.[1] !== null) return String(found[1]).trim()
  }
  return ''
}

async function querySource(
  source: { source: DpaSource; url: string },
  point: { lat: number; lng: number },
): Promise<DpaCommuneResolution | null> {
  const params = new URLSearchParams({
    f: 'json',
    geometry: `${point.lng},${point.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'cut_com,comuna,provincia,region,CUT_COM,COMUNA,PROVINCIA,REGION',
    returnGeometry: 'false',
  })

  const response = await fetch(`${source.url}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SurRealistaTerritorialResolver/1.1 (+https://sur-realista.vercel.app)',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  })

  if (!response.ok) throw new Error(`${source.source}: HTTP ${response.status}`)
  const payload = (await response.json()) as ArcGisQueryResponse
  if (payload.error) {
    const details = payload.error.details?.filter(Boolean).join('; ')
    throw new Error(`${source.source}: ${payload.error.message || payload.error.code || 'query error'}${details ? `; ${details}` : ''}`)
  }

  const attributes = payload.features?.[0]?.attributes
  const code = readAttribute(attributes, 'cut_com', 'CUT_COM')
  const commune = readAttribute(attributes, 'comuna', 'COMUNA')
  if (!code || !commune) return null

  return {
    code,
    commune,
    province: readAttribute(attributes, 'provincia', 'PROVINCIA') || null,
    region: readAttribute(attributes, 'region', 'REGION') || null,
    source: source.source,
  }
}

export async function resolveDpaCommuneByPoint(point: { lat: number; lng: number }): Promise<DpaCommuneResolution | null> {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null
  if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return null

  const errors: string[] = []
  for (const source of DPA_SOURCES) {
    try {
      const result = await querySource(source, point)
      if (result) return result
    } catch (error) {
      errors.push((error as Error).message)
    }
  }

  if (errors.length === DPA_SOURCES.length) {
    console.warn('[territory] all DPA sources failed', { errors })
  }
  return null
}
