import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseRolParts } from "@/lib/sii/types"

export const runtime = "nodejs"
export const maxDuration = 60

type AssignRoleRequest = {
  kmzId: string
  rol: string
  persist?: boolean
  sourceKmzId?: string
  sourceKmzFileName?: string
  evidenceType?: "duplicate-kmz" | "manual-review" | "external-reference"
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

function normalizeRole(role: string) {
  return role.trim().toUpperCase()
}

function isResearchableRole(role: string) {
  const parsed = parseRolParts(role)
  return Boolean(
    parsed?.comuna &&
      parsed.manzana &&
      parsed.predio &&
      /^\d{4,5}$/.test(parsed.comuna) &&
      /^\d{1,5}[A-Z]?$/.test(parsed.manzana) &&
      /^\d{1,5}[A-Z]?$/.test(parsed.predio),
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssignRoleRequest
    if (!body.kmzId || !body.rol) {
      return NextResponse.json({ success: false, error: "kmzId and rol are required" }, { status: 400 })
    }

    const normalizedRol = normalizeRole(body.rol)
    const parsed = parseRolParts(normalizedRol)
    if (!parsed?.comuna || !parsed.manzana || !parsed.predio) {
      return NextResponse.json({ success: false, error: "rol must use comuna-manzana-predio format" }, { status: 400 })
    }

    const persist = body.persist !== false
    const supabase = getSupabaseAdmin()

    const { data: kmz, error: kmzError } = await supabase
      .from("kmz_collection")
      .select("id, file_name, rol_numbers, metadata")
      .eq("id", body.kmzId)
      .single()

    if (kmzError || !kmz) {
      return NextResponse.json({ success: false, error: "KMZ not found" }, { status: 404 })
    }

    const existingRoles = Array.isArray(kmz.rol_numbers) ? kmz.rol_numbers : []
    const mergedRoles = Array.from(
      new Set(
        [...existingRoles.map((value) => `${value}`.trim().toUpperCase()).filter((value) => isResearchableRole(value)), normalizedRol].filter(
          (value) => isResearchableRole(value),
        ),
      ),
    )

    const manualAssignment = {
      assigned_at: new Date().toISOString(),
      assigned_role: normalizedRol,
      evidenceType: body.evidenceType || "manual-review",
      sourceKmzId: body.sourceKmzId || null,
      sourceKmzFileName: body.sourceKmzFileName || null,
      notes: body.notes || null,
    }

    const nextMetadata = {
      ...(kmz.metadata || {}),
      manual_role_assignment: manualAssignment,
    }

    if (persist) {
      const { error: updateError } = await supabase
        .from("kmz_collection")
        .update({
          rol_numbers: mergedRoles,
          metadata: nextMetadata,
        })
        .eq("id", kmz.id)

      if (updateError) {
        throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      persisted: persist,
      kmz: {
        id: kmz.id,
        fileName: kmz.file_name,
      },
      roles: mergedRoles,
      manualAssignment,
    })
  } catch (error: any) {
    console.error("[KMZ assign role] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to assign role to KMZ",
      },
      { status: 500 },
    )
  }
}
