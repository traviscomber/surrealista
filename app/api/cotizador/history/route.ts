import { NextResponse } from 'next/server'
import { listValuationHistory } from '@/lib/valuation/persistence'
export const runtime = 'nodejs'
export async function GET() { return NextResponse.json({ items: await listValuationHistory(20) }) }
