import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cbrService } from "@/lib/integrations/cbr-service"

export const runtime = "nodejs"
export const maxDuration = 60

type ResolveCBRRequest = {
  kmzId?: string
  rol?: string
  comunaCode?: string
  comunaName?: string
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function firstRol(value: unknown): string | undefined {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : undefined
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ResolveCBRRequest
    let rol = body.rol
    let comunaCode = body.comunaCode
    let comunaName = body.comunaName
    let kmz: Record<string, unknown> | null = null

    if (body.kmzId) {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id, file_name, rol_numbers, metadata")
        .eq("id", body.kmzId)
        .single()

      if (error || !data) {
        return NextResponse.json({ success: false, error: "KMZ not found" }, { status: 404 })
      }

      kmz = data
      rol = rol || firstRol(data.rol_numbers)
      const pointRecord = (data.metadata as any)?.sii_point_resolution?.record
      comunaCode = comunaCode || pointRecord?.comunaCodigo
      comunaName = comunaName || pointRecord?.comuna
    }

    if (!rol && !comunaCode && !comunaName) {
      return NextResponse.json(
        { success: false, error: "rol, comunaCode, comunaName or kmzId is required" },
        { status: 400 },
      )
    }

    const route = cbrService.resolveRoute({ rol, comunaCode, comunaName })

    return NextResponse.json({
      success: true,
      input: {
        rol,
        comunaCode,
        comunaName,
      },
      route,
      kmz,
    })
  } catch (error: any) {
    console.error("[CBR resolve] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to resolve CBR route",
      },
      { status: 500 },
    )
  }
}
