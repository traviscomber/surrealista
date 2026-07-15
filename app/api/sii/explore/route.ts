import { NextResponse } from "next/server"
import { BaseApiSiiProvider } from "@/lib/sii/baseapi-client"
import { SiiMapasPublicProvider } from "@/lib/sii/sii-mapas-public-client"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { region, comuna, calle, numero } = await req.json()

    if (!comuna || !calle) {
      return NextResponse.json(
        {
          ok: false,
          error: "Comuna y calle son requeridas",
        },
        { status: 400 },
      )
    }

    const baseApiProvider = new BaseApiSiiProvider()
    const provider = baseApiProvider.isConfigured() ? baseApiProvider : new SiiMapasPublicProvider()

    const candidates = await provider.searchByAddress({ comuna, calle, numero })
    const roles = candidates.map((candidate) => {
      const [comunaCodigo, rolManzana, rolPredio] = candidate.rol.split("-")

      return {
        rol_manzana: candidate.manzana || (rolPredio ? rolManzana : comunaCodigo),
        rol_predio: candidate.predio || (rolPredio || rolManzana),
        rol: candidate.rol,
        direccion: candidate.direccion,
        destino: candidate.destino,
        comuna: candidate.comuna,
        comuna_codigo: candidate.comunaCodigo,
        coordinates: candidate.coordinates,
        source: candidate.source,
        confidence: candidate.confidence,
      }
    })

    return NextResponse.json({
      ok: true,
      roles,
      candidates,
      count: roles.length,
      source: baseApiProvider.isConfigured()
        ? "BaseAPI /api/v1/sii/avaluo/buscar"
        : "SII Mapas public getPrediosDireccion",
    })
  } catch (error: any) {
    console.error("[SII API] Error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Error interno al procesar solicitud",
      },
      { status: 500 },
    )
  }
}
