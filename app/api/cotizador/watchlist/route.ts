import { NextResponse } from 'next/server'
import { createWatchlistItem, listWatchlist, persistValuationSnapshot } from '@/lib/valuation/persistence'
export const runtime = 'nodejs'
export async function GET() { return NextResponse.json({ items: await listWatchlist() }) }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const item = await createWatchlistItem(body)
    if (body.status === 'valued') await persistValuationSnapshot(body, body.resolved_context?.address, item.id)
    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'No se pudo guardar en seguimiento.' }, { status: 500 })
  }
}
