import { NextRequest, NextResponse } from 'next/server'
import { KMZReader } from '@/lib/kmz/kmz-reader'
import { KMZPropertyAnalyzer } from '@/lib/kmz/kmz-property-analyzer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parsear KMZ
    const kmzReader = new KMZReader()
    const kmzData = await kmzReader.readKMZFile(file)

    if (kmzData.skipped) {
      return NextResponse.json(
        { error: `Cannot process KMZ: ${kmzData.skipReason}` },
        { status: 400 }
      )
    }

    // Analizar propiedad
    const analyzer = new KMZPropertyAnalyzer()
    const analysis = await analyzer.analyzeProperty(kmzData)

    // Opcional: guardar en BD si clientId está presente
    if (clientId) {
      // En futuro: guardar analysis en tabla de oportunidades/propiedades
      console.log(`[v0] Analysis saved for client: ${clientId}`)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[v0] KMZ analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
