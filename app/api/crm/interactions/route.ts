import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ data: [], error: 'client_id required' }, { status: 400 })
    }

    // Retornar datos vacíos por ahora (la BD se consulta cuando Supabase esté conectado)
    return NextResponse.json({ data: [], success: true })
  } catch (error) {
    console.error('[v0] Error fetching interactions:', error)
    return NextResponse.json({ data: [], error: 'Failed to fetch interactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Retornar error placeholder
    return NextResponse.json(
      { data: null, error: 'Database integration pending' },
      { status: 501 }
    )
  } catch (error) {
    console.error('[v0] Error creating interaction:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
