import { createHash } from 'crypto'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { SiiMapasPublicProvider } from '@/lib/sii/sii-mapas-public-client'
import { resolveSiiCommuneCode, SII_COMUNA_CODE_SOURCE } from '@/lib/sii/sii-comuna-code-resolver'
import { parseRolParts } from '@/lib/sii/types'

type Bounds = { north?: number; south?: number; east?: number; west?: number }
type Point = { lat: number; lng: number; label: string; source: 'coordinates' | 'bounds' }
type PendingRow = {
  id: string
  file_name: string
  region: string | null
  bounds: Bounds | null
  coordinates: unknown
  description: string | null
  rol_numbers: string[] | null
  metadata: Record<string, any> | null
}
type VerificationStatus = 'verified' | 'mismatch' | 'no_record' | 'error' | 'missing_sii_code'
type Attempt = {
  label: string
  source: Point['source']
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
    recoveredRol?: string
    error?: string
  }>
}

function normalize(value: string | null | undefined) {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  return normalized === 'coihaique' ? 'coyhaique' : normalized
}

function boundsNumbers(bounds: Bounds | null) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  return [north, south, east, west].every(Number.isFinite) ? { north, south, east, west } : null
}

function pushCoordinates(value: unknown, bucket: Point[]) {
  if (!value) return

  if (Array.isArray(value)) {
    if (value.length >= 2 && value.length <= 3 && value.every((v) => Number.isFinite(Number(v)))) {
      const a = Number(value[0])
      const b = Number(value[1])
      const lat = Math.abs(a) <= 90 ? a : b
      const lng = Math.abs(a) <= 90 ? b : a
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        bucket.push({ lat, lng, label: `coordinate-${bucket.length + 1}`, source: 'coordinates' })
      }
      return
    }

    for (const nested of value) pushCoordinates(nested, bucket)
    return
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const lat = Number(obj.latitude ?? obj.lat)
    const lng = Number(obj.longitude ?? obj.lng ?? obj.lon)

    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      bucket.push({ lat, lng, label: `coordinate-${bucket.length + 1}`, source: 'coordinates' })
    }

    for (const [key, nested] of Object.entries(obj)) {
      if (['latitude', 'lat', 'longitude', 'lng', 'lon'].includes(key)) continue
      pushCoordinates(nested, bucket)
    }
  }
}

function dedupe(points: Point[]) {
  const seen = new Set<string>()
  return points.filter((point) => {
    const key = `${point.lat.toFixed(7)},${point.lng.toFixed(7)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getSamplePoints(bounds: Bounds | null, coordinates: unknown, fallbackCenter: { lat?: unknown; lng?: unknown }) {
  const coordinatePoints: Point[] = []
  pushCoordinates(coordinates, coordinatePoints)

  const coord = dedupe(coordinatePoints)
  const sampled: Point[] = []

  if (coord.length) {
    const limit = Math.min(6, coord.length)
    const step = coord.length === 1 ? 0 : (coord.length - 1) / (limit - 1)
    for (let i = 0; i < limit; i += 1) sampled.push(coord[Math.round(i * step)])
  }

  const parsed = boundsNumbers(bounds)
  if (parsed) {
    const { north, south, east, west } = parsed
    const lat = north - south
    const lng = east - west
    sampled.push(
      { lat: south + lat * 0.5, lng: west + lng * 0.5, label: 'center', source: 'bounds' },
      { lat: south + lat * 0.75, lng: west + lng * 0.25, label: 'north-west', source: 'bounds' },
      { lat: south + lat * 0.25, lng: west + lng * 0.75, label: 'south-east', source: 'bounds' },
    )
  } else if (!sampled.length) {
    const lat = Number(fallbackCenter.lat)
    const lng = Number(fallbackCenter.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      sampled.push({ lat, lng, label: 'center', source: 'bounds' })
    }
  }

  return dedupe(sampled).slice(0, 9)
}

function getSpanSequence(bounds: Bounds | null) {
  const parsed = boundsNumbers(bounds)
  if (!parsed) return [0.02, 0.04, 0.08]

  const natural = Math.max(Math.abs(parsed.north - parsed.south), Math.abs(parsed.east - parsed.west))
  const base = Math.min(Math.max(natural * 1.5, 0.02), 0.12)
  return Array.from(new Set([base, Math.min(base * 2, 0.12), Math.min(base * 4, 0.12)].map((v) => Number(v.toFixed(4)))))
}

function expandRole(role: string, siiCode: string) {
  const parsed = parseRolParts(role)
  if (!parsed) return null
  if (parsed.comuna) return parsed
  return parseRolParts(`${siiCode}-${parsed.manzana}-${parsed.predio}`)
}

function isVerifiedSiiRol(value: unknown, siiCode: string) {
  const rol = String(value || '').trim().toUpperCase()
  return new RegExp(`^${siiCode}-\\d{1,5}-\\d{1,5}(?:-[A-Z])?$`).test(rol) ? rol : ''
}

function evidenceFingerprint(kmzId: string, rol: string) {
  return createHash('sha256')
    .update(JSON.stringify({ pipeline: 'kmz-sii-role-recovery-v1', kmzId, rol }))
    .digest('hex')
}

async function loadPendingRows(supabase: ReturnType<typeof getAdminClient>, limit: number) {
  const rows = new Map<string, PendingRow>()

  const { data: readyRows, error: readyError } = await supabase.rpc('get_kmz_pending_sii_verification', {
    p_limit: limit,
  })
  if (readyError) throw readyError

  for (const row of (readyRows || []) as PendingRow[]) rows.set(row.id, row)

  if (rows.size < limit) {
    const remaining = limit - rows.size
    const { data: researchRows, error: researchError } = await supabase
      .from('kmz_collection')
      .select('id,file_name,region,bounds,coordinates,description,rol_numbers,metadata')
      .eq('is_active', true)
      .contains('metadata', { rol_resolution_queue: { status: 'needs_external_role_research' } })
      .order('updated_at', { ascending: true })
      .limit(Math.min(remaining * 3, 18))

    if (researchError) throw researchError

    for (const row of (researchRows || []) as PendingRow[]) {
      if (rows.size >= limit) break
      if (row.rol_numbers?.length) continue
      const status = String(row.metadata?.territorial_resolution?.siiVerification?.status || 'pending')
      const commune = String(row.metadata?.territorial_resolution?.commune || '').trim()
      if (!commune || !['pending', 'error'].includes(status)) continue
      rows.set(row.id, row)
    }
  }

  return Array.from(rows.values()).slice(0, limit)
}

export async function verifyPendingSiiTerritorialResolutions(
  options: { limit?: number; persist?: boolean } = {},
): Promise<SiiVerificationResult> {
  const limit = Math.min(Math.max(options.limit || 3, 1), 6)
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

  const pendingRows = await loadPendingRows(supabase, limit)

  for (const row of pendingRows) {
    const territorial = row.metadata?.territorial_resolution || {}
    const commune = String(territorial.commune || '').trim()
    let siiCode = ''

    try {
      siiCode = await resolveSiiCommuneCode(commune, territorial.siiVerification?.siiCode)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.errored += 1
      result.rows.push({
        id: row.id,
        fileName: row.file_name,
        status: 'error',
        commune,
        error: message,
      })
      continue
    }

    const points = getSamplePoints(row.bounds, row.coordinates, territorial.center || {})
    const spans = getSpanSequence(row.bounds)

    if (!commune || !siiCode || !points.length) {
      result.skipped += 1
      result.rows.push({
        id: row.id,
        fileName: row.file_name,
        status: 'missing_sii_code',
        commune,
        siiCode,
      })
      continue
    }

    result.attempted += 1

    const attempts: Attempt[] = []
    const roleAttempts: Array<{ role: string; found: boolean }> = []
    let record: any = null
    let matchedPoint: Point | null = null
    let resolutionMethod = 'point'
    let hadProviderError = false
    let lastError = ''

    for (const role of row.rol_numbers || []) {
      const parsed = expandRole(role, siiCode)
      if (!parsed?.comuna || !parsed.manzana || !parsed.predio) continue

      try {
        const candidate = await provider.getByRol(parsed)
        roleAttempts.push({ role, found: Boolean(candidate) })
        if (candidate) {
          record = candidate
          resolutionMethod = 'text'
          break
        }
      } catch (error) {
        hadProviderError = true
        lastError = (error as Error).message
      }
    }

    if (!record) {
      for (const point of points) {
        for (const span of spans) {
          try {
            const candidate = await provider.getByPoint({
              comuna: siiCode,
              lat: point.lat,
              lng: point.lng,
              span,
            })
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
            attempts.push({
              ...point,
              span,
              found: false,
              error: lastError.slice(0, 500),
            })
          }
        }
        if (record) break
      }
    }

    const checkedAt = new Date().toISOString()
    const returnedCode = String(record?.comunaCodigo || '').trim()
    const verified = Boolean(
      record &&
      ((returnedCode && returnedCode === siiCode) || normalize(record.comuna) === normalize(commune)),
    )
    const recoveredRol = verified ? isVerifiedSiiRol(record?.rol, siiCode) : ''
    const status: VerificationStatus = recoveredRol
      ? 'verified'
      : record
        ? 'mismatch'
        : hadProviderError
          ? 'error'
          : 'no_record'

    if (persist) {
      const verification: Record<string, any> = {
        status,
        verified: Boolean(recoveredRol),
        siiCode,
        siiCodeSource: SII_COMUNA_CODE_SOURCE,
        checked_at: checkedAt,
        attempts,
        roleAttempts,
        sampling: { points: points.length, spans },
        resolutionMethod,
      }

      if (record) verification.record = record
      if (status === 'error') verification.error = lastError.slice(0, 1000)

      const queueStatus =
        status === 'verified'
          ? 'resolved_from_sii_public'
          : status === 'no_record'
            ? 'sii_no_record_requires_external_evidence'
            : status === 'mismatch'
              ? 'sii_commune_mismatch_requires_review'
              : 'needs_external_role_research'

      const metadata: Record<string, any> = {
        ...(row.metadata || {}),
        territorial_resolution: {
          ...territorial,
          siiVerification: verification,
        },
        rol_resolution_queue: {
          ...(row.metadata?.rol_resolution_queue || {}),
          status: queueStatus,
          last_checked_at: checkedAt,
          source: 'kmz-sii-role-recovery-v1',
        },
      }

      if (recoveredRol && record) {
        metadata.sii_point_resolution = {
          center: matchedPoint || territorial.center,
          comuna: siiCode,
          record,
          source: 'SII Mapas getFeatureInfo',
          attempts,
          textAttempts: roleAttempts,
          sampling: verification.sampling,
          resolved_at: checkedAt,
          resolutionMethod: resolutionMethod === 'text' ? 'text' : 'point-role-recovery',
        }

        const fingerprint = evidenceFingerprint(row.id, recoveredRol)
        const { error: evidenceError } = await supabase
          .from('kmz_enrichment_evidence')
          .upsert(
            {
              kmz_id: row.id,
              source: 'SII Mapas',
              source_kind: 'official_role_recovery',
              field_name: 'rol',
              value_json: {
                rol: recoveredRol,
                comuna: record.comuna || commune,
                comunaCodigo: siiCode,
                manzana: record.manzana || null,
                predio: record.predio || null,
                direccion: record.direccion || null,
              },
              confidence: Number(record.confidence || 0.92),
              status: 'verified',
              source_ref: 'https://www4.sii.cl/mapasui/internet/',
              observed_at: checkedAt,
              metadata: {
                resolutionMethod,
                siiCodeSource: SII_COMUNA_CODE_SOURCE,
                matchedPoint,
              },
              fingerprint,
            },
            { onConflict: 'fingerprint', ignoreDuplicates: true },
          )

        if (evidenceError) throw evidenceError
      }

      const nextRoles = recoveredRol
        ? Array.from(new Set([...(row.rol_numbers || []), recoveredRol]))
        : row.rol_numbers || []

      const { error: updateError } = await supabase
        .from('kmz_collection')
        .update({
          metadata,
          rol_numbers: nextRoles,
        })
        .eq('id', row.id)

      if (updateError) throw updateError
    }

    if (status === 'verified') result.verified += 1
    else if (status === 'mismatch') result.mismatched += 1
    else if (status === 'no_record') result.noRecord += 1
    else result.errored += 1

    result.rows.push({
      id: row.id,
      fileName: row.file_name,
      status,
      commune,
      siiCode,
      attempts: attempts.length,
      returnedCommune: record?.comuna || undefined,
      recoveredRol: recoveredRol || undefined,
      error: status === 'error' ? lastError : undefined,
    })
  }

  return result
}
