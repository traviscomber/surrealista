import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  buildNeighborContactLeads,
  summarizeNeighborContactLeads,
  type KnownNeighborRoleInfo,
} from "@/lib/owners/neighbor-contact-research"

export const runtime = "nodejs"
export const maxDuration = 300

type NeighborContactLeadsRequest = {
  limit?: number
  offset?: number
  dryRun?: boolean
  onlyMissingOwner?: boolean
  onlyWithRole?: boolean
  forceRefresh?: boolean
  neighborPredioWindow?: number
  includeAdjacentManzanas?: boolean
  neighborManzanaWindow?: number
  maxNeighborRoles?: number
}

type KmzRecord = {
  id: string
  file_name: string
  region: string | null
  owner: string | null
  google_docs_link: string | null
  rol_numbers: string[] | null
  metadata: Record<string, any> | null
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function normalizeRole(role?: string | null) {
  const normalized = `${role || ""}`.trim().toUpperCase()
  return normalized || null
}

function hasConfirmedOwner(record: KmzRecord) {
  const metadata = record.metadata || {}
  return Boolean(
    record.owner?.trim() ||
      metadata.latest_cbr_owner_record ||
      (Array.isArray(metadata.cbr_owner_records) && metadata.cbr_owner_records.length > 0),
  )
}

function getOwnerCandidateLabel(metadata?: Record<string, any> | null) {
  const candidate = metadata?.public_owner_candidate || metadata?.latest_owner_evidence || null
  return `${candidate?.companyName || candidate?.owner || candidate?.ownerName || ""}`.trim() || null
}

function getSiiRecord(metadata: Record<string, any>) {
  return metadata.sii_point_resolution?.record || null
}

function getResearchableRoles(roles?: string[] | null) {
  return Array.from(new Set((roles || []).map((role) => normalizeRole(role)).filter((role): role is string => Boolean(role))))
}

function buildKnownNeighborRoleIndex(records: KmzRecord[], currentKmzId?: string) {
  const index: Record<string, KnownNeighborRoleInfo> = {}

  for (const record of records) {
    if (record.id === currentKmzId) continue

    for (const role of getResearchableRoles(record.rol_numbers)) {
      const existing = index[role] || {
        kmzIds: [],
        fileNames: [],
      }

      if (!existing.kmzIds?.includes(record.id)) existing.kmzIds = [...(existing.kmzIds || []), record.id]
      if (record.file_name && !existing.fileNames?.includes(record.file_name)) {
        existing.fileNames = [...(existing.fileNames || []), record.file_name]
      }

      if (!existing.owner && record.owner?.trim()) existing.owner = record.owner.trim()
      if (!existing.region && record.region) existing.region = record.region
      if (!existing.ownerCandidate) existing.ownerCandidate = getOwnerCandidateLabel(record.metadata)
      if (!existing.googleDocsLink && record.google_docs_link) existing.googleDocsLink = record.google_docs_link

      index[role] = existing
    }
  }

  return index
}

async function fetchKmzRecords(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const pageSize = 1000
  const results: KmzRecord[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, owner, google_docs_link, rol_numbers, metadata")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const page = (data || []) as KmzRecord[]
    results.push(...page)

    if (page.length < pageSize) break
    offset += pageSize
  }

  return results
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as NeighborContactLeadsRequest
    const limit = Math.min(Math.max(body.limit || 100, 1), 500)
    const offset = Math.max(body.offset || 0, 0)
    const dryRun = body.dryRun === true
    const onlyMissingOwner = body.onlyMissingOwner !== false
    const onlyWithRole = body.onlyWithRole !== false
    const forceRefresh = body.forceRefresh === true
    const options = {
      predioWindow: Math.min(Math.max(body.neighborPredioWindow || 8, 1), 50),
      includeAdjacentManzanas: body.includeAdjacentManzanas === true,
      manzanaWindow: Math.min(Math.max(body.neighborManzanaWindow || 1, 1), 3),
      maxRoles: Math.min(Math.max(body.maxNeighborRoles || 24, 1), 120),
    }

    const supabase = getSupabaseAdmin()
    const allRecords = await fetchKmzRecords(supabase)
    const targetRecords = allRecords.slice(offset).filter((record) => {
      const metadata = record.metadata || {}
      if (onlyMissingOwner && hasConfirmedOwner(record)) return false
      if (onlyWithRole && getResearchableRoles(record.rol_numbers).length === 0) return false
      if (!forceRefresh && Array.isArray(metadata.neighbor_role_contact_leads) && metadata.neighbor_role_contact_leads.length > 0) {
        return false
      }
      return true
    })

    const results: Array<Record<string, any>> = []

    for (const record of targetRecords) {
      if (results.length >= limit) break

      const metadata = record.metadata || {}
      const knownNeighborRoles = buildKnownNeighborRoleIndex(allRecords, record.id)
      const leads = buildNeighborContactLeads({
        kmzId: record.id,
        fileName: record.file_name,
        region: record.region,
        roles: getResearchableRoles(record.rol_numbers),
        siiRecord: getSiiRecord(metadata),
        knownNeighborRoles,
        options,
      })

      if (leads.length === 0) {
        results.push({
          id: record.id,
          fileName: record.file_name,
          status: "not-found",
          leads: 0,
        })
        continue
      }

      const summary = summarizeNeighborContactLeads(leads)
      const nextMetadata = {
        ...metadata,
        neighbor_role_contact_leads: leads,
        neighbor_role_contact_leads_summary: summary,
        neighbor_role_contact_leads_generated_at: new Date().toISOString(),
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("kmz_collection")
          .update({ metadata: nextMetadata })
          .eq("id", record.id)

        if (updateError) {
          results.push({
            id: record.id,
            fileName: record.file_name,
            status: "error",
            error: updateError.message,
          })
          continue
        }
      }

      results.push({
        id: record.id,
        fileName: record.file_name,
        status: dryRun ? "dry-run" : "updated",
        summary,
        leads: leads.slice(0, 12),
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      options,
      scanned: allRecords.length,
      processed: results.length,
      updated: results.filter((result) => result.status === "updated").length,
      withLeads: results.filter((result) => result.status === "updated" || result.status === "dry-run").length,
      results,
    })
  } catch (error: any) {
    console.error("[Neighbor contact leads] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to generate neighbor contact leads",
      },
      { status: 500 },
    )
  }
}
