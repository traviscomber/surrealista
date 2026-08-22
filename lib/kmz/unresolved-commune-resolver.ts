import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { resolveDpaCommuneByPoint } from '@/lib/territory/subdere-dpa-client'

 type Bounds = { north?: number; south?: number; east?: number; west?: number }
 type Coordinates = { latitude?: number; longitude?: number; bounds?: Bounds } | null
 type KmzRow = {
  id: string
  file_name: string
  region: string | null
  bounds: Bounds | null
  coordinates: Coordinates
  metadata: Record<string, unknown> | null
 }
 type Point = { lat: number; lng: number }

export type UnresolvedCommuneResolutionResult = {
  attempted: number
  resolved: number
  dpaResolved: number
  siiVerified: number
  unresolved: number
  skipped: number
  errors: string[]
  rows: Array<{
    id: string
    fileName: string
    status: 'resolved' | 'unresolved' | 'skipped' | 'error'
    commune?: string
    cutCode?: string
    source?: string
    siiVerified?: boolean
    attempts?: number
    error?: string
  }>
}

function centerFromBounds(bounds: Bounds | null): Point | null {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  if (![north, south, east, west].every(Number.isFinite)) return null
  return { lat: (north + south) / 2, lng: (east + west) / 2 }
}

function preferredPoint(row: KmzRow): Point | null {
  const latitude = Number(row.coordinates?.latitude)
  const longitude = Number(row.coordinates?.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { lat: latitude, lng: longitude }
  }
  return centerFromBounds(row.bounds)
}

function mergeMetadata(
  metadata: Record<string, unknown> | null,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(metadata || {}), ...patch }
}

export async function resolveUnresolvedKmzCommunes(
  options: { limit?: number; persist?: boolean } = {},
): Promise<UnresolvedCommuneResolutionResult> {
  const limit = Math.min(Math.max(options.limit || 20, 1), 50)
  const persist = options.persist === true
  const supabase = getAdminClient()
  const result: UnresolvedCommuneResolutionResult = {
    attempted: 0,
    resolved: 0,
    dpaResolved: 0,
    siiVerified: 0,
    unresolved: 0,
    skipped: 0,
    errors: [],
    rows: [],
  }

  const { data, error } = await supabase.rpc('get_unresolved_kmz_for_resolution', { p_limit: limit })
  if (error) throw error

  for (const row of (data || []) as KmzRow[]) {
    const point = preferredPoint(row)
    if (!point) {
      result.skipped++
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'skipped' })
      continue
    }

    result.attempted++
    try {
      const dpa = await resolveDpaCommuneByPoint(point)
      if (dpa) {
        if (persist) {
          const now = new Date().toISOString()
          const metadata = mergeMetadata(row.metadata, {
            territorial_resolution: {
              center: point,
              commune: dpa.commune,
              cutCode: dpa.code,
              province: dpa.province,
              region: dpa.region,
              source: dpa.source,
              resolved_at: now,
              resolutionMethod: 'dpa-point-intersection',
              siiVerification: { status: 'pending', verified: false },
            },
            territorial_resolution_attempt: {
              status: 'resolved',
              method: 'dpa-point-intersection',
              point,
              attempted_at: now,
            },
          })
          const { error: updateError } = await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
          if (updateError) throw updateError
        }

        result.resolved++
        result.dpaResolved++
        result.rows.push({
          id: row.id,
          fileName: row.file_name,
          status: 'resolved',
          commune: dpa.commune,
          cutCode: dpa.code,
          source: dpa.source,
          siiVerified: false,
          attempts: 1,
        })
        continue
      }

      if (persist) {
        const metadata = mergeMetadata(row.metadata, {
          territorial_resolution_attempt: {
            status: 'dpa_no_match',
            method: 'dpa-point-intersection',
            point,
            attempted_at: new Date().toISOString(),
          },
        })
        const { error: updateError } = await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
        if (updateError) throw updateError
      }

      result.unresolved++
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'unresolved', attempts: 1 })
    } catch (resolutionError) {
      const message = `${row.file_name}: ${(resolutionError as Error).message}`
      result.errors.push(message)
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'error', error: message })
    }
  }

  return result
}
