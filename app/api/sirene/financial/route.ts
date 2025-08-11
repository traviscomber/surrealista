import { NextResponse } from "next/server"
import { sireneService } from "@/lib/sirene/sirene-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rut = searchParams.get("rut")
    const year = searchParams.get("year")

    if (!rut) {
      return NextResponse.json(
        {
          success: false,
          error: "RUT es requerido",
        },
        { status: 400 },
      )
    }

    const result = await sireneService.getFinancialData(rut, year ? Number.parseInt(year) : undefined)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error getting financial data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener datos financieros",
      },
      { status: 500 },
    )
  }
}
