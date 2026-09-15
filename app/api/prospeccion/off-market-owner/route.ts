import { NextResponse } from "next/server"
import { publicSourcesSearch } from "@/lib/public-sources/owner-search"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const rol = String(body.rol || "").trim()
  const commune = String(body.commune || "").trim()

  if (!rol) {
    return NextResponse.json({ error: "ROL obligatorio." }, { status: 400 })
  }

  const results = await publicSourcesSearch.searchOwner(
    { rol, commune, keywords: [rol, commune].filter(Boolean) },
    { maxResults: 8 },
  )

  const best = results
    .filter((result) => result.ownerName)
    .sort((a, b) => b.confidence - a.confidence)[0] ?? null

  return NextResponse.json({
    rol,
    commune: commune || null,
    owner: best ? {
      name: best.ownerName,
      confidence: best.confidence,
      source: best.source,
      evidenceUrl: best.url,
      documentType: best.documentType ?? null,
    } : null,
    evidence: results.map((result) => ({
      source: result.source,
      title: result.title,
      excerpt: result.excerpt,
      url: result.url,
      confidence: result.confidence,
      ownerName: result.ownerName ?? null,
      documentType: result.documentType ?? null,
    })),
    status: best ? "owner_candidate_found" : "owner_pending",
    nextAction: best
      ? "Validar la evidencia antes de iniciar contacto directo."
      : "Mantener el ROL en investigación y ampliar fuentes públicas antes de contacto.",
  })
}
