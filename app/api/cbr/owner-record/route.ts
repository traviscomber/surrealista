import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

type OwnerRecordRequest = {
  kmzId?: string
  rol: string
  ownerName?: string
  companyName?: string
  documentType?: string
  documentUrl?: string
  notes?: string
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
    const body = (await request.json()) as OwnerRecordRequest
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
    const evidenceEntry = {
      rol: body.rol,
      ownerName: body.ownerName || null,
      companyName: body.companyName || null,
      documentType: body.documentType || "dominio_vigente",
      documentUrl: body.documentUrl || null,
      notes: body.notes || null,
      savedAt: new Date().toISOString(),
      source: "manual-cbr",
    }

    const updatedIds: string[] = []

    for (const match of matches) {
      const metadata = (match.metadata as Record<string, any>) || {}
      const existingEntries = Array.isArray(metadata.cbr_owner_records) ? metadata.cbr_owner_records : []
      const mergedEntries = [
        ...existingEntries.filter((entry: any) => !(entry?.rol === body.rol && entry?.documentUrl === body.documentUrl)),
        evidenceEntry,
      ]

      const { error: updateError } = await supabase
        .from("kmz_collection")
        .update({
          owner: ownerLabel,
          metadata: {
            ...metadata,
            cbr_owner_records: mergedEntries,
            latest_cbr_owner_record: evidenceEntry,
          },
        })
        .eq("id", match.id)

      if (updateError) throw updateError
      updatedIds.push(match.id)
    }

    return NextResponse.json({
      success: true,
      updated: updatedIds.length,
      kmzIds: updatedIds,
      owner: ownerLabel,
      evidence: evidenceEntry,
    })
  } catch (error: any) {
    console.error("[CBR owner record] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to save CBR owner record",
      },
      { status: 500 },
    )
  }
}
