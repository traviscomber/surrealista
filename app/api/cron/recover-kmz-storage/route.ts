import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { parseKMZFile } from '@/lib/kmz/kmz-reader'

export const maxDuration = 300

const JOB_KEY = 'kmz_storage_geometry_recovery_canary'

function placemarkBounds(coordinates: Array<[number, number, number?]>) {
  const lngs = coordinates.map((item) => Number(item[0])).filter(Number.isFinite)
  const lats = coordinates.map((item) => Number(item[1])).filter(Number.isFinite)
  if (!lngs.length || !lats.length) return null
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  let claimed = false

  try {
    const { data: claimedRows, error: claimError } = await supabase.rpc('claim_internal_one_shot_job', {
      p_job_key: JOB_KEY,
    })
    if (claimError) throw claimError

    const job = claimedRows?.[0]
    if (!job) return NextResponse.json({ success: true, skipped: true, reason: 'No pending one-shot job' })
    claimed = true

    const kmzId = String(job.payload?.kmz_id || '')
    const storagePath = String(job.payload?.storage_path || '')
    if (!kmzId || !storagePath) throw new Error('kmz_id and storage_path are required')

    const { data: collection, error: collectionError } = await supabase
      .from('kmz_collection')
      .select('id,file_name,region,is_active')
      .eq('id', kmzId)
      .single()
    if (collectionError || !collection) throw collectionError || new Error('KMZ not found')
    if (!collection.is_active) throw new Error('KMZ is not active')

    const { count: existingCount, error: countError } = await supabase
      .from('kmz_placemarks')
      .select('id', { count: 'exact', head: true })
      .eq('kmz_id', kmzId)
    if (countError) throw countError
    if ((existingCount || 0) > 0) throw new Error(`Safety stop: KMZ already has ${existingCount} placemarks`)

    const { data: blob, error: downloadError } = await supabase.storage.from('documents').download(storagePath)
    if (downloadError || !blob) throw downloadError || new Error('Storage download returned no data')

    const fileName = storagePath.split('/').pop() || collection.file_name
    const file = new File([await blob.arrayBuffer()], fileName, { type: blob.type || 'application/vnd.google-earth.kmz' })
    const parsed = await parseKMZFile(file)
    if (parsed.skipped) throw new Error(parsed.skipReason || 'KMZ parser skipped file')
    if (!parsed.placemarks.length) throw new Error('KMZ contains no recoverable placemarks')

    const rows = parsed.placemarks.map((placemark) => {
      const bounds = placemarkBounds(placemark.coordinates)
      const centerLat = bounds ? (bounds.north + bounds.south) / 2 : null
      const centerLng = bounds ? (bounds.east + bounds.west) / 2 : null
      return {
        kmz_id: kmzId,
        name: placemark.name,
        description: placemark.description || null,
        coordinates: placemark.coordinates,
        type: placemark.type,
        style_url: placemark.styleUrl || null,
        properties: {
          ...(placemark.properties || {}),
          recoverySource: 'supabase-storage-original-kmz',
          recoveryStoragePath: storagePath,
          recoveredAt: new Date().toISOString(),
        },
        center_lat: centerLat,
        center_lng: centerLng,
        region: collection.region || null,
        bounds,
      }
    })

    const { error: insertError } = await supabase.from('kmz_placemarks').insert(rows)
    if (insertError) throw insertError

    const counts = rows.reduce(
      (acc, row) => {
        acc.total += 1
        if (row.type === 'Polygon') acc.polygons += 1
        if (row.type === 'LineString') acc.lines += 1
        if (row.type === 'Point') acc.points += 1
        return acc
      },
      { total: 0, polygons: 0, lines: 0, points: 0 },
    )

    await supabase.from('kmz_enrichment_evidence').insert({
      kmz_id: kmzId,
      source: 'supabase-storage-original-kmz',
      source_kind: 'geometry_recovery',
      field_name: 'placemarks',
      value_json: counts,
      confidence: 1,
      status: 'verified',
      source_ref: storagePath,
      observed_at: new Date().toISOString(),
      metadata: { fileName, parsedBounds: parsed.bounds || null },
      fingerprint: `${kmzId}:${storagePath}:${counts.total}:${counts.polygons}:${counts.lines}:${counts.points}`,
    })

    const result = { kmzId, storagePath, fileName, counts, parsedBounds: parsed.bounds || null }
    await supabase
      .from('internal_one_shot_jobs')
      .update({ status: 'done', finished_at: new Date().toISOString(), result, error: null })
      .eq('job_key', JOB_KEY)

    return NextResponse.json({ success: true, jobKey: JOB_KEY, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (claimed) {
      await supabase
        .from('internal_one_shot_jobs')
        .update({ status: 'failed', finished_at: new Date().toISOString(), error: message.slice(0, 12000) })
        .eq('job_key', JOB_KEY)
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
