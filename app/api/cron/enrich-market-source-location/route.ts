import { NextRequest, NextResponse } from 'next/server'
import { enrichMarketSourceLocations } from '@/lib/valuation/source-location-enrichment'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const authHeader = request.headers.get('authorization')?.trim()
  const expectedSecret = process.env.CRON_SECRET?.trim()
  if (!expectedSecret) {
    console.error('[cron/enrich-market-source-location] CRON_SECRET is not configured')
    return false
  }
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startedAt = Date.now()
  const result = await enrichMarketSourceLocations(15)
  const success = result.failed === 0
  const payload = {
    success,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    ...result,
    policy: 'original listing metadata/map first; preserve existing points; reverse-validate administrative location; batch=15',
  }

  if (success) console.log('[cron/enrich-market-source-location] completed', payload)
  else console.error('[cron/enrich-market-source-location] completed with failures', payload)
  return NextResponse.json(payload, { status: success ? 200 : 207 })
}
