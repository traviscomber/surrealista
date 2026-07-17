import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

type OwnerEvidenceRequest = {
  kmzId?: string
  rol: string
  ownerName?: string
  companyName?: string
  documentType?: string
  documentUrl?: string
  notes?: string
  sourceType?: string
  confidence?: "candidate" | "probable" | "strong"
  authoritative?: boolean
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OwnerEvidenceRequest
    if (!body.rol || (!body.ownerName && !body.companyName)) {
      return NextResponse.json(
        { success: false, error: "rol and ownerName or companyName are required" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from("kmz_collection")
      .select("id, file_name, owner, metadata, rol_numbers")
      .contains("rol_numbers", [body.rol])

    if (body.kmzId) {
      query = query.eq("id", body.kmzId)
    }

    const { data: matches, error } = await query.limit(100)
    if (error) throw error

    if (!matches || matches.length === 0) {
      return NextResponse.json({ success: false, error: "No KMZ found for that rol" }, { status: 404 })
    }

    const ownerLabel = body.companyName || body.ownerName || null
    const confidence = body.confidence || "candidate"
    const authoritative = body.authoritative === true

    const evidenceEntry = {
      rol: body.rol,
      ownerName: body.ownerName || null,
      companyName: body.companyName || null,
      ownerLabel,
      documentType: body.documentType || "public-reference",
      documentUrl: body.documentUrl || null,
      notes: body.notes || null,
      sourceType: body.sourceType || "public-web",
      confidence,
      authoritative,
      savedAt: new Date().toISOString(),
      source: authoritative ? "confirmed-record" : "public-evidence",
    }

    const updatedIds: string[] = []

    for (const match of matches) {
      const metadata = (match.metadata as Record<string, any>) || {}
      const existingEntries = Array.isArray(metadata.owner_evidence_records) ? metadata.owner_evidence_records : []
      const mergedEntries = [
        ...existingEntries.filter(
          (entry: any) =>
            !(
              entry?.rol === body.rol &&
              entry?.documentUrl === body.documentUrl &&
              (entry?.ownerLabel || entry?.ownerName || entry?.companyName) === ownerLabel
            ),
        ),
        evidenceEntry,
      ]

      const publicCandidate =
        !authoritative && confidence !== "candidate"
          ? {
              rol: body.rol,
              owner: ownerLabel,
              sourceType: evidenceEntry.sourceType,
              confidence,
              documentType: evidenceEntry.documentType,
              documentUrl: evidenceEntry.documentUrl,
              notes: evidenceEntry.notes,
              savedAt: evidenceEntry.savedAt,
            }
          : metadata.public_owner_candidate || null

      const nextMetadata = {
        ...metadata,
        owner_evidence_records: mergedEntries,
        latest_owner_evidence: evidenceEntry,
        public_owner_candidate: publicCandidate,
      }

      const payload: Record<string, unknown> = {
        metadata: nextMetadata,
      }

      if (authoritative) {
        payload.owner = ownerLabel
      }

      const { error: updateError } = await supabase.from("kmz_collection").update(payload).eq("id", match.id)

      if (updateError) throw updateError
      updatedIds.push(match.id)
    }

    return NextResponse.json({
      success: true,
      updated: updatedIds.length,
      kmzIds: updatedIds,
      owner: ownerLabel,
      authoritative,
      evidence: evidenceEntry,
    })
  } catch (error: any) {
    console.error("[Owner evidence record] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to save owner evidence",
      },
      { status: 500 },
    )
  }
}
