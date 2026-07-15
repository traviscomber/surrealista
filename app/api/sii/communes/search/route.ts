import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export const runtime = "nodejs"
export const maxDuration = 30

type SiiCommune = {
  codigo: string
  nombre: string
}

const SII_MAPAS_BASE_URL = "https://www4.sii.cl/mapasui/services/data/mapasFacadeService"
const LIST_COMUNAS_NAMESPACE = "cl.sii.sdi.lob.bbrr.mapas.data.api.interfaces.MapasFacadeService/listComunas"

let cachedCommunes: { loadedAt: number; data: SiiCommune[] } | null = null

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
}

async function fetchCommunes(): Promise<SiiCommune[]> {
  const now = Date.now()
  if (cachedCommunes && now - cachedCommunes.loadedAt < 1000 * 60 * 60 * 12) {
    return cachedCommunes.data
  }

  const response = await fetch(`${SII_MAPAS_BASE_URL}/listComunas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Origin: "https://www4.sii.cl",
      Referer: "https://www4.sii.cl/mapasui/internet/",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      metaData: {
        namespace: LIST_COMUNAS_NAMESPACE,
        conversationId: randomUUID(),
        transactionId: randomUUID(),
        page: null,
      },
      data: null,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`SII commune catalog failed: ${response.status}`)
  }

  const json = (await response.json()) as { data?: SiiCommune[] }
  const data = Array.isArray(json.data) ? json.data : []
  cachedCommunes = { loadedAt: now, data }

  return data
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = normalize(url.searchParams.get("q") || "")
    const communes = await fetchCommunes()

    const results = communes
      .filter((commune) => {
        if (!q) return true
        const normalizedName = normalize(commune.nombre)
        return normalizedName.includes(q) || commune.codigo.includes(q)
      })
      .sort((a, b) => {
        const aName = normalize(a.nombre)
        const bName = normalize(b.nombre)
        const aExact = aName === q || a.codigo === q
        const bExact = bName === q || b.codigo === q
        if (aExact !== bExact) return aExact ? -1 : 1
        return a.nombre.localeCompare(b.nombre, "es-CL")
      })
      .slice(0, 12)

    return NextResponse.json({
      success: true,
      query: q,
      count: results.length,
      results,
      source: "SII Mapas listComunas",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to search SII communes",
      },
      { status: 500 },
    )
  }
}
