import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { SiiMapasPublicProvider } from '@/lib/sii/sii-mapas-public-client'

type Bounds = { north?: number; south?: number; east?: number; west?: number }
type Point = { lat: number; lng: number; label: string }
type PendingRow = {
  id: string
  file_name: string
  region: string | null
  bounds: Bounds | null
  metadata: Record<string, any> | null
}

type VerificationStatus = 'verified' | 'mismatch' | 'no_record' | 'error' | 'missing_sii_code'

type Attempt = {
  label: string
  lat: number
  lng: number
  span: number
  found: boolean
  returnedCommune?: string
  error?: string
}

export type SiiVerificationResult = {
  attempted: number
  verified: number
  mismatched: number
  noRecord: number
  errored: number
  skipped: number
  rows: Array<{
    id: string
    fileName: string
    status: VerificationStatus
    commune?: string
    siiCode?: string
    attempts?: number
    returnedCommune?: string
    error?: string
  }>
}

function normalize(value: string | null | undefined) {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  return normalized === 'coihaique' ? 'coyhaique' : normalized
}

function inferredSiiCode(commune: string, explicitCode: unknown) {
  const explicit = String(explicitCode || '').trim()
  if (explicit) return explicit
  return normalize(commune) === 'coyhaique' ? '11401' : ''
}

function boundsNumbers(bounds: Bounds | null) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  if (![north, south, east, west].every(Number.isFinite)) return null
  return { north, south, east, west }
}

function getSamplePoints(bounds: Bounds | null, fallbackCenter: { lat?: unknown; lng?: unknown }): Point[] {
  const parsed = boundsNumbers(bounds)
  if (!parsed) {
    const lat = Number(fallbackCenter.lat)
    const lng = Number(fallbackCenter.lng)
    return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng, label: 'center' }] : []
  }

  const { north, south, east, west } = parsed
  const latRange = north - south
  const lngRange = east - west
  return [
    { lat: south + latRange * 0.5, lng: west + lngRange * 0.5, label: 'center' },
    { lat: south + latRange * 0.75, lng: west + lngRange * 0.25, label: 'north-west' },
    { lat: south + latRange * 0.25, lng: west + lngRange * 0.75, label: 'south-east' },
  ]
}

function getSpanSequence(bounds: Bounds | null) {
  const parsed = boundsNumbers(bounds)
  if (!parsed) return [0.02, 0.04]
  const natural = Math.max(Math.abs(parsed.north - parsed.south), Math.abs(parsed.east - parsed.west))
  const base = Math.min(Math.max(natural * 1.5, 0.02), 0.12)
  return Array.from(new Set([base, Math.min(base * 2, 0.12)].map((value) => Number(value.toFixed(4)))))
}

export async function verifyPendingSiiTerritorialResolutions(options: { limit?: number; persist?: boolean } = {}): Promise<SiiVerificationResult> {
  const limit = Math.min(Math.max(options.limit || 3, 1), 8)
  const persist = options.persist !== false
  const supabase = getAdminClient()
  const provider = new SiiMapasPublicProvider()
  const result: SiiVerificationResult = {
    attempted: 0,
    verified: 0,
    mismatched: 0,
    noRecord: 0,
    errored: 0,
    skipped: 0,
    rows: [],
  }

  const { data, error } = await supabase.rpc('get_kmz_pending_sii_verification', { p_limit: limit })
  if (error) throw error

  for (const row of (data || []) as PendingRow[]) {
    const territorial = row.metadata?.territorial_resolution || {}
    const commune = String(territorial.commune || '').trim()
    const siiCode = inferredSiiCode(commune, territorial.siiVerification?.siiCode)
    const points = getSamplePoints(row.bounds, territorial.center || {})

    if (!commune || !siiCode || points.length === 0) {
      result.skipped++
      if (persist) {
        const metadata: Record<string, any> = {
          ...(row.metadata || {}),
          territorial_resolution: {
            ...territorial,
            siiVerification: {
              ...(territorial.siiVerification || {}),
              status: 'missing_sii_code',
              verified: false,
              siiCode: siiCode || null,
              checked_at: new Date().toISOString(),
            },
          },
        }
        await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
      }
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'missing_sii_code', commune, siiCode })
      continue
    }

    result.attempted++
    const attempts: Attempt[] = []
    let record: any = null
    let matchedPoint: Point | null = null
    let hadProviderError = false
    let lastError = ''

    for (const point of points) {
      for (const span of getSpanSequence(row.bounds)) {
        try {
          const candidate = await provider.getByPoint({ comuna: siiCode, lat: point.lat, lng: point.lng, span })
          attempts.push({
            ...point,
            span,
            found: Boolean(candidate),
            returnedCommune: candidate?.comuna || undefined,
          })
          if (candidate) {
            record = candidate
            matchedPoint = point
            break
          }
        } catch (error) {
          hadProviderError = true
          lastError = (error as Error).message
          attempts.push({ ...point, span, found: false, error: lastError.slice(0, 500) })
        }
      }
      if (record) break
    }

    const checkedAt = new Date().toISOString()
    const verified = Boolean(record && normalize(record.comuna) === normalize(commune))
    const status: VerificationStatus = verified
      ? 'verified'
      : record
        ? 'mismatch'
        : hadProviderError
          ? 'error'
          : 'no_record'

    if (persist) {
      const verification: Record<string, any> = {
        status,
        verified,
        siiCode,
        checked_at: checkedAt,
        attempts,
        sampling: { points: points.length, spans: getSpanSequence(row.bounds) },
      }
      if (record) verification.record = record
      if (status === 'error') verification.error = lastError.slice(0, 1000)

      const metadata: Record<string, any> = {
        ...(row.metadata || {}),
        territorial_resolution: {
          ...territorial,
          siiVerification: verification,
        },
      }

      if (verified && record) {
        metadata.sii_point_resolution = {
          center: matchedPoint || territorial.center,
          comuna: siiCode,
          record,
          source: 'SII Mapas getFeatureInfo',
          attempts,
          sampling: verification.sampling,
          resolved_at: checkedAt,
          resolutionMethod: 'deferred-dpa-verification',
        }
      }

      const { error: updateError } = await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
      if (updateError) throw updateError
    }

    if (status === 'verified') result.verified++
    else if (status === 'mismatch') result.mismatched++
    else if (status === 'no_record') result.noRecord++
    else result.errored++

    result.rows.push({
      id: row.id,
      fileName: row.file_name,
      status,
      commune,
      siiCode,
      attempts: attempts.length,
      returnedCommune: record?.comuna || undefined,
      error: status === 'error' ? lastError : undefined,
    })
  }

  return result
}
