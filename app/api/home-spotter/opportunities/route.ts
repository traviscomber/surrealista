import { NextResponse } from 'next/server'
import { listRealOpportunities } from '@/lib/home-spotter/opportunities'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 100)
  const items = await listRealOpportunities(limit)
  return NextResponse.json({
    items,
    count: items.length,
    methodology: 'market-benchmark-v1',
    note: 'Score basado en descuento versus benchmark real, evidencia, frescura y calidad de datos. KMZ se incorpora en la ficha de detalle.',
  })
}
