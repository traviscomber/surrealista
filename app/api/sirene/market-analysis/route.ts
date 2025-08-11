import { NextResponse } from "next/server"
import { sireneService } from "@/lib/sirene/sirene-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sector = searchParams.get("sector") || "INMOBILIARIO"
    const region = searchParams.get("region")

    const result = await sireneService.getMarketAnalysis(sector, region)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error getting market analysis:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener análisis de mercado",
      },
      { status: 500 },
    )
  }
}
