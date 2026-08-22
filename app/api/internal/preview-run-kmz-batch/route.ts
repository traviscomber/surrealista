import { NextResponse } from 'next/server'
import { resolveUnresolvedKmzCommunes } from '@/lib/kmz/unresolved-commune-resolver'

export const maxDuration = 300

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Preview only' }, { status: 404 })
  }

  const result = await resolveUnresolvedKmzCommunes({ limit: 20, persist: true })
  return NextResponse.json({ success: result.errors.length === 0, result })
}
