import { NextResponse } from "next/server"
import { sireneService } from "@/lib/sirene/sirene-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rut = searchParams.get("rut")
    const name = searchParams.get("name")
    const comuna = searchParams.get("comuna")
    const giro = searchParams.get("giro")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (rut) {
      // Búsqueda por RUT específico
      const result = await sireneService.getCompanyByRUT(rut)
      return NextResponse.json(result)
    }

    if (name || comuna || giro) {
      // Búsqueda por filtros
      const filters = {
        ...(comuna && { comuna }),
        ...(giro && { giro }),
      }

      const result = await sireneService.searchRealEstateCompanies(filters, page, limit)
      return NextResponse.json(result)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Debe proporcionar al menos un parámetro de búsqueda",
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error("Error in SIRENE search:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al buscar en SIRENE",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { filters, page = 1, limit = 20 } = await request.json()

    const result = await sireneService.searchRealEstateCompanies(filters, page, limit)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in SIRENE advanced search:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error en búsqueda avanzada SIRENE",
      },
      { status: 500 },
    )
  }
}
