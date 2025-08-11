import { NextResponse } from "next/server"
import { siiService } from "@/lib/sii/sii-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get("rol")

    if (!rol) {
      return NextResponse.json(
        {
          success: false,
          error: "Rol de avalúo es requerido",
        },
        { status: 400 },
      )
    }

    const result = await siiService.getPropertyByRol(rol)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error getting SII property:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener propiedad del SII",
      },
      { status: 500 },
    )
  }
}
