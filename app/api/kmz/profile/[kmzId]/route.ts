import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { recordOperatorAudit } from "@/lib/audit/operator-audit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  return origin === new URL(request.url).origin
}

function optionalString(value: unknown, max: number) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") return undefined
  const normalized = value.trim().slice(0, max)
  return normalized || null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ kmzId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origen inválido" }, { status: 403 })

  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (!(await verifyInternalAccessToken(token))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { kmzId } = await params
  if (!UUID_PATTERN.test(kmzId)) {
    return NextResponse.json({ error: "KMZ inválido" }, { status: 400 })
  }

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })

  try {
    const body: Record<string, unknown> = await request.json().catch(() => ({}))
    const { data: current, error: readError } = await admin
      .from("kmz_collection")
      .select("id,file_name,metadata,owner,pic,pic_phone,pic_email,google_docs_link,is_active")
      .eq("id", kmzId)
      .eq("is_active", true)
      .maybeSingle()

    if (readError) throw readError
    if (!current) return NextResponse.json({ error: "KMZ no encontrado" }, { status: 404 })

    const metadata =
      current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? { ...(current.metadata as Record<string, unknown>) }
        : {}

    if (!metadata.original_file_name && current.file_name) {
      metadata.original_file_name = current.file_name
    }

    if (Object.prototype.hasOwnProperty.call(body, "displayName")) {
      const displayName = optionalString(body.displayName, 180)
      if (displayName) metadata.manual_display_name = displayName
      else delete metadata.manual_display_name
    }

    const update: Record<string, unknown> = { metadata }

    const fields = [
      ["owner", 180],
      ["pic", 180],
      ["pic_phone", 80],
      ["pic_email", 254],
      ["google_docs_link", 1000],
    ] as const

    for (const [field, max] of fields) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue
      update[field] = optionalString(body[field], max)
    }

    if (typeof update.google_docs_link === "string" && !/^https:\/\//i.test(update.google_docs_link)) {
      return NextResponse.json({ error: "El vínculo de Google Docs debe usar HTTPS." }, { status: 400 })
    }

    if (typeof update.pic_email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.pic_email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    const { data: saved, error: updateError } = await admin
      .from("kmz_collection")
      .update(update)
      .eq("id", kmzId)
      .eq("is_active", true)
      .select("id,file_name,metadata,owner,pic,pic_phone,pic_email,google_docs_link,updated_at")
      .single()

    if (updateError) throw updateError

    try {
      await recordOperatorAudit(admin, {
        action: "kmz_profile_update",
        entityType: "kmz_collection",
        entityId: kmzId,
        requestPath: request.nextUrl.pathname,
        before: {
          owner: current.owner,
          pic: current.pic,
          pic_phone: current.pic_phone,
          pic_email: current.pic_email,
          google_docs_link: current.google_docs_link,
          metadata: current.metadata,
        },
        after: saved,
        metadata: {
          editableFields: Object.keys(update).filter((key) => key !== "metadata"),
          aliasChanged: Object.prototype.hasOwnProperty.call(body, "displayName"),
        },
      })
    } catch (auditError) {
      console.error("[KMZ profile] audit write failed", auditError)
      return NextResponse.json({ error: "La ficha se guardó, pero falló la auditoría" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, kmz: saved }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[KMZ profile] update failed", error)
    return NextResponse.json({ error: "No se pudo guardar la ficha del campo" }, { status: 500 })
  }
}
