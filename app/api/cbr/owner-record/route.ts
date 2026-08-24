import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { INTERNAL_ACCESS_COOKIE, INTERNAL_OPERATOR, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { recordOperatorAudit } from "@/lib/audit/operator-audit"

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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase admin environment variables")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function hasInternalAccess() {
  const cookieStore = await cookies()
  return verifyInternalAccessToken(cookieStore.get(INTERNAL_ACCESS_COOKIE)?.value)
}

export async function POST(request: Request) {
  try {
    if (!(await hasInternalAccess())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as OwnerRecordRequest
    if (!body.rol || (!body.ownerName && !body.companyName)) {
      return NextResponse.json({ success: false, error: "rol and ownerName or companyName are required" }, { status: 400 })
    }
    if (body.documentType !== "dominio_vigente" || !body.documentUrl?.trim()) {
      return NextResponse.json({ success: false, error: "A dominio_vigente document URL is required to confirm an owner" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    let query = supabase.from("kmz_collection").select("id, file_name, owner, metadata, rol_numbers").contains("rol_numbers", [body.rol])
    if (body.kmzId) query = query.eq("id", body.kmzId)

    const { data: matches, error } = await query.limit(100)
    if (error) throw error
    if (!matches?.length) return NextResponse.json({ success: false, error: "No KMZ found for that rol" }, { status: 404 })

    const ownerLabel = body.companyName || body.ownerName || null
    const evidenceEntry = {
      rol: body.rol,
      ownerName: body.ownerName || null,
      companyName: body.companyName || null,
      documentType: "dominio_vigente",
      documentUrl: body.documentUrl.trim(),
      notes: body.notes || null,
      savedAt: new Date().toISOString(),
      source: "manual-cbr",
      authoritative: true,
      editedBy: INTERNAL_OPERATOR.name,
    }

    const updatedIds: string[] = []
    for (const match of matches) {
      const metadata = (match.metadata as Record<string, unknown>) || {}
      const existingEntries = Array.isArray(metadata.cbr_owner_records) ? metadata.cbr_owner_records : []
      const mergedEntries = [
        ...existingEntries.filter((entry) => {
          const item = entry as { rol?: string; documentUrl?: string }
          return !(item.rol === body.rol && item.documentUrl === evidenceEntry.documentUrl)
        }),
        evidenceEntry,
      ]
      const nextMetadata = { ...metadata, cbr_owner_records: mergedEntries, latest_cbr_owner_record: evidenceEntry }

      const { error: updateError } = await supabase.from("kmz_collection").update({ owner: ownerLabel, metadata: nextMetadata }).eq("id", match.id)
      if (updateError) throw updateError

      await recordOperatorAudit(supabase, {
        action: match.owner ? "kmz_owner_updated" : "kmz_owner_added",
        entityType: "kmz_collection",
        entityId: match.id,
        requestPath: "/api/cbr/owner-record",
        before: { owner: match.owner, metadata: match.metadata },
        after: { owner: ownerLabel, metadata: nextMetadata },
        metadata: { rol: body.rol, fileName: match.file_name, documentUrl: evidenceEntry.documentUrl },
      })
      updatedIds.push(match.id)
    }

    return NextResponse.json({
      success: true,
      updated: updatedIds.length,
      kmzIds: updatedIds,
      owner: ownerLabel,
      authoritative: true,
      editedBy: INTERNAL_OPERATOR.name,
      evidence: evidenceEntry,
    })
  } catch (error: unknown) {
    console.error("[CBR owner record] Error:", error)
    const message = error instanceof Error ? error.message : "Unable to save CBR owner record"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
