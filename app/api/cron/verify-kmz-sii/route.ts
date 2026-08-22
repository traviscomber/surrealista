import { NextRequest, NextResponse } from 'next/server'
import { verifyPendingSiiTerritorialResolutions } from '@/lib/kmz/sii-verification-worker'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await verifyPendingSiiTerritorialResolutions({ limit: 3, persist: true })
    return NextResponse.json({ success: result.errored === 0, result })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
