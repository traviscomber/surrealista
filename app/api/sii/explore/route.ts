import { NextResponse } from "next/server"
import { searchSiiByAddress } from "@/lib/sii/sii-scraper"

export const runtime = "nodejs"
export const maxDuration = 60 // Timeout de 60 segundos para búsqueda SII

export async function POST(req: Request) {
  try {
    const { region, comuna, calle, numero } = await req.json()

    if (!region || !comuna || !calle || !numero) {
      return NextResponse.json({ ok: false, error: "Faltan campos requeridos." }, { status: 400 })
    }

    const result = await searchSiiByAddress(region, comuna, calle, numero)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (e: any) {
    console.error("[SII API] Error:", e)
    return NextResponse.json({ ok: false, error: e?.message ?? "Error interno" }, { status: 500 })
  }
}
