import { NextResponse } from "next/server"
import { siiService } from "@/lib/sii/sii-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const comuna = searchParams.get("comuna")
    const months = searchParams.get("months")

    if (!comuna) {
      return NextResponse.json(
        {
          success: false,
          error: "Comuna es requerida",
        },
        { status: 400 },
      )
    }

    const result = await siiService.getMarketData(comuna, months ? Number.parseInt(months) : undefined)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error getting SII market data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener datos de mercado del SII",
      },
      { status: 500 },
    )
  }
}
