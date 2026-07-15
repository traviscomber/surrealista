import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractRolNumbersFromTargets, extractRolsFromTarget } from "@/lib/kmz/rol-extraction"
import { BaseApiSiiProvider } from "@/lib/sii/baseapi-client"
import { SiiMapasPublicProvider } from "@/lib/sii/sii-mapas-public-client"
import { parseRolParts, type SiiRoleCandidate } from "@/lib/sii/types"

export const runtime = "nodejs"
export const maxDuration = 60

type ResolveRequest = {
  kmzId?: string
  address?: {
    comuna: string
    calle: string
    numero?: string
  }
  rol?: string
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

function mergeRoles(...roleGroups: Array<Array<string | null | undefined>>): string[] {
  const roles = new Set<string>()

  for (const group of roleGroups) {
    for (const role of group) {
      const normalized = role?.trim().toUpperCase()
      if (normalized) {
        roles.add(normalized)
      }
    }
  }

  return Array.from(roles)
}

async function resolveFromKmz(kmzId: string, persist: boolean) {
  const supabase = getSupabaseAdmin()

  const { data: kmz, error: kmzError } = await supabase
    .from("kmz_collection")
    .select("id, file_name, rol_numbers, metadata, description")
    .eq("id", kmzId)
    .single()

  if (kmzError || !kmz) {
    return {
      roles: [],
      candidates: [],
      error: "KMZ not found",
    }
  }

  const { data: placemarks, error: placemarkError } = await supabase
    .from("kmz_placemarks")
    .select("name, description, properties")
    .eq("kmz_id", kmzId)
    .limit(5000)

  if (placemarkError) {
    return {
      roles: kmz.rol_numbers || [],
      candidates: [],
      error: placemarkError.message,
    }
  }

  const collectionRoles = extractRolNumbersFromTargets([
    {
      name: kmz.file_name,
      description: kmz.description,
      properties: {},
      metadata: kmz.metadata || {},
    },
  ])

  const placemarkHits = (placemarks || []).flatMap((placemark: any) =>
    extractRolsFromTarget({
      name: placemark.name || "",
      description: placemark.description,
      properties: placemark.properties || {},
    }),
  )

  const extractedRoles = mergeRoles(
    collectionRoles,
    placemarkHits.map((hit) => hit.rol),
  )
  const mergedRoles = mergeRoles(kmz.rol_numbers || [], extractedRoles)

  if (persist && mergedRoles.length > 0) {
    await supabase
      .from("kmz_collection")
      .update({
        rol_numbers: mergedRoles,
        metadata: {
          ...(kmz.metadata || {}),
          rol_extraction: {
            source: "kmz_text",
            extracted_at: new Date().toISOString(),
            hits: placemarkHits.slice(0, 50),
          },
        },
      })
      .eq("id", kmzId)
  }

  const candidates: SiiRoleCandidate[] = mergedRoles.map((rol) => ({
    rol,
    source: "kmz",
    confidence: extractedRoles.includes(rol) ? 0.8 : 0.65,
  }))

  return {
    roles: mergedRoles,
    candidates,
    kmz: {
      id: kmz.id,
      fileName: kmz.file_name,
      placemarks: placemarks?.length || 0,
    },
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ResolveRequest
    const persist = body.persist !== false
    const baseApiProvider = new BaseApiSiiProvider()
    const siiMapasProvider = new SiiMapasPublicProvider()
    const provider = baseApiProvider.isConfigured() ? baseApiProvider : siiMapasProvider

    const responses: Record<string, unknown> = {
      provider: {
        baseapiConfigured: baseApiProvider.isConfigured(),
        active: baseApiProvider.isConfigured() ? "baseapi" : "sii-mapas-public",
        source: baseApiProvider.isConfigured()
          ? "BaseAPI contract documented at /api/v1/sii/avaluo/*"
          : "SII Mapas public endpoints getPrediosDireccion/getPredioNacional",
      },
    }

    const candidates: SiiRoleCandidate[] = []

    if (body.kmzId) {
      const kmzResult = await resolveFromKmz(body.kmzId, persist)
      responses.kmz = kmzResult
      candidates.push(...kmzResult.candidates)
    }

    if (body.address?.comuna && body.address?.calle) {
      const addressCandidates = await provider.searchByAddress(body.address)
      responses.address = {
        input: body.address,
        count: addressCandidates.length,
      }
      candidates.push(...addressCandidates)
    }

    if (body.rol) {
      const parts = parseRolParts(body.rol)
      if (parts?.comuna) {
        const record = await provider.getByRol(parts)
        responses.rol = record
        if (record) candidates.push(record)
      } else {
        responses.rol = {
          error: "Rol must use comuna-manzana-predio format for provider lookup",
        }
      }
    }

    const roles = mergeRoles(candidates.map((candidate) => candidate.rol))

    return NextResponse.json({
      success: true,
      roles,
      candidates,
      ...responses,
    })
  } catch (error: any) {
    console.error("[SII roles resolve] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to resolve SII roles",
      },
      { status: 500 },
    )
  }
}
