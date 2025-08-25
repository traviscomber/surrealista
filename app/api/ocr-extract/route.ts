import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json()

    // This would integrate with actual OCR service
    const mockOcrResult = {
      text: `CONSERVADOR DE BIENES RAICES
      INSCRIPCION DE DOMINIO
      ROL: 140-0001-K
      COMUNA: VALDIVIA
      PROPIETARIO: FAMILIA TERESA F.
      SUPERFICIE: 1.2 HECTAREAS`,
      confidence: 0.92,
    }

    return NextResponse.json(mockOcrResult)
  } catch (error) {
    return NextResponse.json({ error: "OCR extraction failed" }, { status: 500 })
  }
}
