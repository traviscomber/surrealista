import { NextRequest, NextResponse } from 'next/server'
import { validateScraperAccess } from '@/lib/scrapers/route-auth'
import { resolveUnresolvedKmzCommunes } from '@/lib/kmz/unresolved-commune-resolver'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const access = await validateScraperAccess(req)
  if (!access.authorized) return access.response

  try {
    const body = await req.json().catch(() => ({}))
    const result = await resolveUnresolvedKmzCommunes({
      limit: Math.min(Math.max(Number(body.limit) || 8, 1), 20),
      persist: body.persist === true,
    })
    return NextResponse.json({ success: result.errors.length === 0, result })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
