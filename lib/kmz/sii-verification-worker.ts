import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { SiiMapasPublicProvider } from '@/lib/sii/sii-mapas-public-client'

type Bounds = { north?: number; south?: number; east?: number; west?: number }
type PendingRow = {
  id: string
  file_name: string
  region: string | null
  bounds: Bounds | null
  metadata: Record<string, any> | null
}

export type SiiVerificationResult = {
  attempted: number
  verified: number
  notMatched: number
  errored: number
  rows: Array<{
    id: string
    fileName: string
    status: 'verified' | 'not_matched' | 'error' | 'skipped'
    commune?: string
    siiCode?: string
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

function spanFromBounds(bounds: Bounds | null) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  if (![north, south, east, west].every(Number.isFinite)) return 0.02
  const natural = Math.max(Math.abs(north - south), Math.abs(east - west))
  return Math.min(Math.max(natural * 1.5, 0.02), 0.12)
}

export async function verifyPendingSiiTerritorialResolutions(options: { limit?: number; persist?: boolean } = {}): Promise<SiiVerificationResult> {
  const limit = Math.min(Math.max(options.limit || 10, 1), 25)
  const persist = options.persist !== false
  const supabase = getAdminClient()
  const provider = new SiiMapasPublicProvider()
  const result: SiiVerificationResult = { attempted: 0, verified: 0, notMatched: 0, errored: 0, rows: [] }

  const { data, error } = await supabase.rpc('get_kmz_pending_sii_verification', { p_limit: limit })
  if (error) throw error

  for (const row of (data || []) as PendingRow[]) {
    const territorial = row.metadata?.territorial_resolution || {}
    const center = territorial.center || {}
    const lat = Number(center.lat)
    const lng = Number(center.lng)
    const commune = String(territorial.commune || '').trim()
    const siiCode = inferredSiiCode(commune, territorial.siiVerification?.siiCode)

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !commune || !siiCode) {
      if (persist && commune && Number.isFinite(lat) && Number.isFinite(lng)) {
        const metadata: Record<string, any> = {
          ...(row.metadata || {}),
          territorial_resolution: {
            ...territorial,
            siiVerification: {
              ...(territorial.siiVerification || {}),
              status: 'missing_sii_code',
              verified: false,
              checked_at: new Date().toISOString(),
            },
          },
        }
        await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
      }
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'skipped', commune, siiCode })
      continue
    }

    result.attempted++
    try {
      const record = await provider.getByPoint({ comuna: siiCode, lat, lng, span: spanFromBounds(row.bounds) })
      const verified = Boolean(record && normalize(record.comuna) === normalize(commune))
      const checkedAt = new Date().toISOString()

      if (persist) {
        const metadata: Record<string, any> = {
          ...(row.metadata || {}),
          territorial_resolution: {
            ...territorial,
            siiVerification: verified
              ? { status: 'verified', verified: true, siiCode, checked_at: checkedAt, record }
              : { status: 'not_matched', verified: false, siiCode, checked_at: checkedAt },
          },
        }

        if (verified && record) {
          metadata.sii_point_resolution = {
            center: { lat, lng },
            comuna: siiCode,
            record,
            source: 'SII Mapas getFeatureInfo',
            resolved_at: checkedAt,
            resolutionMethod: 'deferred-dpa-verification',
          }
        }

        const { error: updateError } = await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
        if (updateError) throw updateError
      }

      if (verified) {
        result.verified++
        result.rows.push({ id: row.id, fileName: row.file_name, status: 'verified', commune, siiCode })
      } else {
        result.notMatched++
        result.rows.push({ id: row.id, fileName: row.file_name, status: 'not_matched', commune, siiCode })
      }
    } catch (error) {
      const message = (error as Error).message
      result.errored++
      if (persist) {
        const metadata: Record<string, any> = {
          ...(row.metadata || {}),
          territorial_resolution: {
            ...territorial,
            siiVerification: {
              ...(territorial.siiVerification || {}),
              status: 'error',
              verified: false,
              siiCode,
              checked_at: new Date().toISOString(),
              error: message.slice(0, 1000),
            },
          },
        }
        await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
      }
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'error', commune, siiCode, error: message })
    }
  }

  return result
}
