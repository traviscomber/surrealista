import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractRolNumbersFromTargets } from "@/lib/kmz/rol-extraction"

export const runtime = "nodejs"
export const maxDuration = 300

type BackfillRequest = {
  limit?: number
  offset?: number
  dryRun?: boolean
  onlyMissing?: boolean
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function mergeRoles(existing: string[] | null | undefined, extracted: string[]): string[] {
  return Array.from(new Set([...(existing || []), ...extracted].map((role) => role.trim().toUpperCase()).filter(Boolean)))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as BackfillRequest
    const limit = Math.min(Math.max(body.limit || 50, 1), 500)
    const offset = Math.max(body.offset || 0, 0)
    const dryRun = body.dryRun === true
    const onlyMissing = body.onlyMissing !== false
    const supabase = getSupabaseAdmin()
    const fetchLimit = onlyMissing ? Math.min(limit * 3, 1500) : limit
    const fetchEnd = offset + fetchLimit - 1

    let query = supabase
      .from("kmz_collection")
      .select("id, file_name, description, metadata, rol_numbers")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, fetchEnd)

    const { data: kmzFiles, error } = await query
    if (error) throw error

    const results = []

    for (const kmz of kmzFiles || []) {
      if (onlyMissing && Array.isArray(kmz.rol_numbers) && kmz.rol_numbers.length > 0) {
        continue
      }

      if (results.length >= limit) {
        break
      }

      const { data: placemarks, error: placemarkError } = await supabase
        .from("kmz_placemarks")
        .select("name, description, properties")
        .eq("kmz_id", kmz.id)
        .limit(5000)

      if (placemarkError) {
        results.push({
          id: kmz.id,
          fileName: kmz.file_name,
          status: "error",
          error: placemarkError.message,
        })
        continue
      }

      const extracted = extractRolNumbersFromTargets([
        {
          name: kmz.file_name,
          description: kmz.description,
          properties: {},
          metadata: kmz.metadata || {},
        },
        ...(placemarks || []).map((placemark: any) => ({
          name: placemark.name || "",
          description: placemark.description,
          properties: placemark.properties || {},
        })),
      ])

      const merged = mergeRoles(kmz.rol_numbers, extracted)

      if (!dryRun && merged.length > 0) {
        const { error: updateError } = await supabase
          .from("kmz_collection")
          .update({
            rol_numbers: merged,
            metadata: {
              ...(kmz.metadata || {}),
              rol_backfill: {
                extracted_at: new Date().toISOString(),
                extracted_count: extracted.length,
                source: "kmz_collection_and_placemarks",
              },
            },
          })
          .eq("id", kmz.id)

        if (updateError) {
          results.push({
            id: kmz.id,
            fileName: kmz.file_name,
            status: "error",
            error: updateError.message,
          })
          continue
        }
      }

      results.push({
        id: kmz.id,
        fileName: kmz.file_name,
        status: dryRun ? "dry-run" : "updated",
        existing: kmz.rol_numbers?.length || 0,
        extracted: extracted.length,
        total: merged.length,
        roles: merged,
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      offset,
      scanned: kmzFiles?.length || 0,
      processed: results.length,
      updated: results.filter((result) => result.status === "updated").length,
      results,
    })
  } catch (error: any) {
    console.error("[KMZ role backfill] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to backfill KMZ roles",
      },
      { status: 500 },
    )
  }
}
