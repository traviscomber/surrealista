const DPA_COMMUNES_QUERY_URL =
  'https://services3.arcgis.com/IyMwgp3BPBycEJQw/arcgis/rest/services/LIMITE_COMUNAL_IDE_2023/FeatureServer/0/query'

export type DpaCommuneResolution = {
  code: string
  commune: string
  province: string | null
  region: string | null
  source: 'subdere-dpa-2023'
}

type ArcGisFeature = {
  attributes?: {
    CUT_COM?: string | number | null
    COMUNA?: string | null
    PROVINCIA?: string | null
    REGION?: string | null
  }
}

type ArcGisQueryResponse = {
  features?: ArcGisFeature[]
  error?: { code?: number; message?: string; details?: string[] }
}

export async function resolveDpaCommuneByPoint(point: { lat: number; lng: number }): Promise<DpaCommuneResolution | null> {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null
  if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return null

  const params = new URLSearchParams({
    f: 'json',
    geometry: `${point.lng},${point.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'CUT_COM,COMUNA,PROVINCIA,REGION',
    returnGeometry: 'false',
  })

  const response = await fetch(`${DPA_COMMUNES_QUERY_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SurRealistaTerritorialResolver/1.0 (+https://sur-realista.vercel.app)',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`SUBDERE DPA query failed: HTTP ${response.status}`)

  const payload = (await response.json()) as ArcGisQueryResponse
  if (payload.error) {
    const details = payload.error.details?.filter(Boolean).join('; ')
    throw new Error(`SUBDERE DPA query failed: ${payload.error.message || payload.error.code || 'unknown'}${details ? `; ${details}` : ''}`)
  }

  const attributes = payload.features?.[0]?.attributes
  const code = String(attributes?.CUT_COM || '').trim()
  const commune = String(attributes?.COMUNA || '').trim()
  if (!code || !commune) return null

  return {
    code,
    commune,
    province: String(attributes?.PROVINCIA || '').trim() || null,
    region: String(attributes?.REGION || '').trim() || null,
    source: 'subdere-dpa-2023',
  }
}
