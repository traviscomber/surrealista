import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SiiMapasPublicProvider } from "@/lib/sii/sii-mapas-public-client"

export const runtime = "nodejs"
export const maxDuration = 120

type ResolvePointRequest = {
  kmzId: string
  comuna: string
  persist?: boolean
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function getCenter(bounds: any): { lat: number; lng: number } | null {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)

  if (![north, south, east, west].every(Number.isFinite)) {
    return null
  }

  return {
    lat: (north + south) / 2,
    lng: (east + west) / 2,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolvePointRequest
    const persist = body.persist === true

    if (!body.kmzId || !body.comuna) {
      return NextResponse.json(
        {
          success: false,
          error: "kmzId and comuna are required",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()
    const { data: kmz, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, bounds, rol_numbers, metadata")
      .eq("id", body.kmzId)
      .single()

    if (error || !kmz) {
      return NextResponse.json({ success: false, error: "KMZ not found" }, { status: 404 })
    }

    const center = getCenter(kmz.bounds)
    if (!center) {
      return NextResponse.json({ success: false, error: "KMZ has no valid bounds" }, { status: 400 })
    }

    const provider = new SiiMapasPublicProvider()
    const record = await provider.getByPoint({ comuna: body.comuna, lat: center.lat, lng: center.lng })

    if (!record) {
      return NextResponse.json({
        success: true,
        found: false,
        kmz: {
          id: kmz.id,
          fileName: kmz.file_name,
          center,
        },
        source: "SII Mapas getFeatureInfo",
      })
    }

    const roles = Array.from(new Set([...(kmz.rol_numbers || []), record.rol].filter(Boolean)))

    if (persist) {
      const { error: updateError } = await supabase
        .from("kmz_collection")
        .update({
          rol_numbers: roles,
          metadata: {
            ...(kmz.metadata || {}),
            sii_point_resolution: {
              resolved_at: new Date().toISOString(),
              source: "SII Mapas getFeatureInfo",
              comuna: body.comuna,
              center,
              record,
            },
          },
        })
        .eq("id", kmz.id)

      if (updateError) {
        throw updateError
      }
    }

    return NextResponse.json({
      success: true,
      found: true,
      persisted: persist,
      kmz: {
        id: kmz.id,
        fileName: kmz.file_name,
        center,
      },
      roles,
      record,
      source: "SII Mapas getFeatureInfo",
    })
  } catch (error: any) {
    console.error("[KMZ point role resolve] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to resolve KMZ role by point",
      },
      { status: 500 },
    )
  }
}
