import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { SiiMapasPublicProvider } from '@/lib/sii/sii-mapas-public-client'

const REGION_COMMUNES: Record<string, Array<{ code: string; name: string }>> = {
  'los rios': [
    { code: '10101', name: 'VALDIVIA' }, { code: '10102', name: 'MARIQUINA' }, { code: '10103', name: 'LANCO' },
    { code: '10104', name: 'LOS LAGOS' }, { code: '10105', name: 'FUTRONO' }, { code: '10106', name: 'CORRAL' },
    { code: '10107', name: 'MAFIL' }, { code: '10108', name: 'PANGUIPULLI' }, { code: '10109', name: 'LA UNION' },
    { code: '10110', name: 'PAILLACO' }, { code: '10111', name: 'RIO BUENO' }, { code: '10112', name: 'LAGO RANCO' },
  ],
  'los lagos': [
    { code: '10201', name: 'OSORNO' }, { code: '10202', name: 'SAN PABLO' }, { code: '10203', name: 'PUERTO OCTAY' },
    { code: '10204', name: 'PUYEHUE' }, { code: '10205', name: 'RIO NEGRO' }, { code: '10206', name: 'PURRANQUE' },
    { code: '10207', name: 'SAN JUAN DE LA COSTA' }, { code: '10301', name: 'PUERTO MONTT' }, { code: '10302', name: 'COCHAMO' },
    { code: '10303', name: 'PUERTO VARAS' }, { code: '10304', name: 'FRESIA' }, { code: '10305', name: 'FRUTILLAR' },
    { code: '10306', name: 'LLANQUIHUE' }, { code: '10307', name: 'MAULLIN' }, { code: '10308', name: 'LOS MUERMOS' },
    { code: '10309', name: 'CALBUCO' }, { code: '10401', name: 'CASTRO' }, { code: '10402', name: 'CHONCHI' },
    { code: '10403', name: 'QUEILEN' }, { code: '10404', name: 'QUELLON' }, { code: '10405', name: 'PUQUELDON' },
    { code: '10406', name: 'ANCUD' }, { code: '10407', name: 'QUEMCHI' }, { code: '10408', name: 'DALCAHUE' },
    { code: '10410', name: 'CURACO DE VELEZ' }, { code: '10415', name: 'QUINCHAO' }, { code: '10501', name: 'CHAITEN' },
    { code: '10502', name: 'HUALAIHUE' }, { code: '10503', name: 'FUTALEUFU' }, { code: '10504', name: 'PALENA' },
  ],
  'aysen': [
    { code: '11101', name: 'AYSEN' }, { code: '11102', name: 'CISNES' }, { code: '11104', name: 'GUAITECAS' },
    { code: '11201', name: 'CHILE CHICO' }, { code: '11203', name: 'RIO IBANEZ' }, { code: '11301', name: 'COCHRANE' },
    { code: '11302', name: "O'HIGGINS" }, { code: '11303', name: 'TORTEL' }, { code: '11401', name: 'COYHAIQUE' },
    { code: '11402', name: 'LAGO VERDE' },
  ],
}

type Bounds = { north?: number; south?: number; east?: number; west?: number }
type KmzRow = { id: string; file_name: string; region: string | null; bounds: Bounds | null; metadata: Record<string, unknown> | null }

export type UnresolvedCommuneResolutionResult = {
  attempted: number
  resolved: number
  unresolved: number
  skipped: number
  errors: string[]
  rows: Array<{ id: string; fileName: string; status: 'resolved' | 'unresolved' | 'skipped' | 'error'; commune?: string; code?: string; attempts?: number; error?: string }>
}

function normalize(value: string | null | undefined) {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

function regionKey(region: string | null) {
  const value = normalize(region)
  if (value.includes('los lagos')) return 'los lagos'
  if (value.includes('los rios')) return 'los rios'
  if (value.includes('aysen')) return 'aysen'
  return null
}

function centerFromBounds(bounds: Bounds | null) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  if (![north, south, east, west].every(Number.isFinite)) return null
  return { lat: (north + south) / 2, lng: (east + west) / 2 }
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

export async function resolveUnresolvedKmzCommunes(options: { limit?: number; persist?: boolean } = {}): Promise<UnresolvedCommuneResolutionResult> {
  const limit = Math.min(Math.max(options.limit || 12, 1), 20)
  const persist = options.persist === true
  const supabase = getAdminClient()
  const provider = new SiiMapasPublicProvider()
  const result: UnresolvedCommuneResolutionResult = { attempted: 0, resolved: 0, unresolved: 0, skipped: 0, errors: [], rows: [] }

  const { data, error } = await supabase
    .from('kmz_collection')
    .select('id,file_name,region,bounds,metadata')
    .eq('is_active', true)
    .is('metadata->sii_point_resolution->record->>comuna', null)
    .in('region', ['Los Lagos', 'Los Ríos', 'Región de Aysén del General Carlos Ibáñez del Campo'])
    .order('updated_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  for (const row of (data || []) as KmzRow[]) {
    const key = regionKey(row.region)
    const center = centerFromBounds(row.bounds)
    const candidates = key ? REGION_COMMUNES[key] : null
    if (!center || !candidates?.length) {
      result.skipped++
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'skipped' })
      continue
    }

    result.attempted++
    let resolved = false
    let attemptCount = 0

    for (const candidate of candidates) {
      attemptCount++
      try {
        const record = await provider.getByPoint({ comuna: candidate.code, lat: center.lat, lng: center.lng, span: spanFromBounds(row.bounds) })
        if (!record) continue

        const actualCode = String(record.comunaCodigo || '')
        const actualName = normalize(record.comuna)
        if (actualCode !== candidate.code || (actualName && actualName !== normalize(candidate.name))) continue

        if (persist) {
          const metadata = {
            ...(row.metadata || {}),
            sii_point_resolution: {
              center,
              comuna: candidate.code,
              record,
              source: 'SII Mapas getFeatureInfo',
              attempts: [{ ...center, span: spanFromBounds(row.bounds), found: true, label: 'center', source: 'bounds' }],
              sampling: { spans: [spanFromBounds(row.bounds)], total: 1, boundsSamples: 1, coordinateSamples: 0 },
              resolved_at: new Date().toISOString(),
              matchedPoint: { ...center, label: 'center', source: 'bounds' },
              textAttempts: [],
              extractedRoles: [],
              resolutionMethod: 'point-batch',
            },
          }
          const { error: updateError } = await supabase.from('kmz_collection').update({ metadata }).eq('id', row.id)
          if (updateError) throw updateError
        }

        result.resolved++
        result.rows.push({ id: row.id, fileName: row.file_name, status: 'resolved', commune: record.comuna || candidate.name, code: candidate.code, attempts: attemptCount })
        resolved = true
        break
      } catch (candidateError) {
        const message = `${row.file_name} / ${candidate.code}: ${(candidateError as Error).message}`
        result.errors.push(message)
        result.rows.push({ id: row.id, fileName: row.file_name, status: 'error', attempts: attemptCount, error: message })
        resolved = true
        break
      }
    }

    if (!resolved) {
      result.unresolved++
      result.rows.push({ id: row.id, fileName: row.file_name, status: 'unresolved', attempts: attemptCount })
    }
  }

  return result
}
