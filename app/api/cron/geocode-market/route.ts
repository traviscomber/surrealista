import { NextRequest, NextResponse } from 'next/server'
import { progressivelyGeocodeMarket } from '@/lib/valuation/progressive-geocode'

export const runtime = 'nodejs'
export const maxDuration = 300

function isAuthorizedCronCall(request: NextRequest) {
  const authHeader = request.headers.get('authorization')?.trim()
  const expectedSecret = process.env.CRON_SECRET?.trim()
  if (!expectedSecret) {
    console.error('[cron/geocode-market] CRON_SECRET is not configured')
    return false
  }
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const result = await progressivelyGeocodeMarket({
    limit: 8,
    requireSpecificLocation: true,
  })

  const success = result.failed === 0
  const payload = {
    success,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    ...result,
    policy: 'specific-address-first; serialized; confidence>=0.55; region-validated',
  }

  if (success) console.log('[cron/geocode-market] completed', payload)
  else console.error('[cron/geocode-market] completed with failures', payload)

  return NextResponse.json(payload, { status: success ? 200 : 207 })
}
