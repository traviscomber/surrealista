import { NextRequest, NextResponse } from 'next/server'
import { resolveUnresolvedKmzCommunes } from '@/lib/kmz/unresolved-commune-resolver'
import { getAdminClient } from '@/lib/scrapers/base-scraper'

export const maxDuration = 300

const ONE_SHOT_JOB_KEY = 'kmz_commune_resolution_test_20'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()

  try {
    const { data: claimedRows, error: claimError } = await supabase.rpc('claim_internal_one_shot_job', {
      p_job_key: ONE_SHOT_JOB_KEY,
    })
    if (claimError) throw claimError

    const claimed = claimedRows?.[0]
    if (!claimed) {
      return NextResponse.json({ success: true, skipped: true, reason: 'No pending one-shot job' })
    }

    const requestedLimit = Number(claimed.payload?.limit) || 20
    const limit = Math.min(Math.max(requestedLimit, 1), 20)
    const result = await resolveUnresolvedKmzCommunes({ limit, persist: true })
    const status = result.errors.length === 0 ? 'done' : 'failed'

    await supabase
      .from('internal_one_shot_jobs')
      .update({
        status,
        finished_at: new Date().toISOString(),
        result,
        error: result.errors.length ? result.errors.join('\n').slice(0, 12000) : null,
      })
      .eq('job_key', ONE_SHOT_JOB_KEY)

    return NextResponse.json({ success: status === 'done', jobKey: ONE_SHOT_JOB_KEY, result })
  } catch (error) {
    const message = (error as Error).message
    await supabase
      .from('internal_one_shot_jobs')
      .update({ status: 'failed', finished_at: new Date().toISOString(), error: message.slice(0, 12000) })
      .eq('job_key', ONE_SHOT_JOB_KEY)

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}