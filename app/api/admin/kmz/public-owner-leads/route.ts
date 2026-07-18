import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  buildPublicOwnerResearchLeads,
  summarizePublicOwnerLeads,
} from "@/lib/owners/public-owner-research"

export const runtime = "nodejs"
export const maxDuration = 300

type PublicOwnerLeadsRequest = {
  limit?: number
  offset?: number
  dryRun?: boolean
  onlyMissingOwner?: boolean
  onlyWithSignals?: boolean
  forceRefresh?: boolean
}

type KmzRecord = {
  id: string
  file_name: string
  region: string | null
  owner: string | null
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

function hasConfirmedOwner(record: KmzRecord) {
  const metadata = record.metadata || {}
  return Boolean(
    record.owner?.trim() ||
      metadata.latest_cbr_owner_record ||
      (Array.isArray(metadata.cbr_owner_records) && metadata.cbr_owner_records.length > 0),
  )
}

function hasLeadSignals(record: KmzRecord) {
  const metadata = record.metadata || {}
  return Boolean(
    record.file_name ||
      record.region ||
      (Array.isArray(record.rol_numbers) && record.rol_numbers.length > 0) ||
      metadata.public_owner_candidate ||
      metadata.latest_owner_evidence ||
      metadata.sii_point_resolution?.record,
  )
}

function getOwnerCandidate(metadata: Record<string, any>) {
  return metadata.public_owner_candidate || metadata.latest_owner_evidence || null
}

function getSiiRecord(metadata: Record<string, any>) {
  return metadata.sii_point_resolution?.record || null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as PublicOwnerLeadsRequest
    const limit = Math.min(Math.max(body.limit || 100, 1), 500)
    const offset = Math.max(body.offset || 0, 0)
    const dryRun = body.dryRun === true
    const onlyMissingOwner = body.onlyMissingOwner !== false
    const onlyWithSignals = body.onlyWithSignals !== false
    const forceRefresh = body.forceRefresh === true
    const supabase = getSupabaseAdmin()

    const fetchLimit = Math.min(limit * 3, 1500)
    const { data: kmzRecords, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, owner, rol_numbers, metadata")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, offset + fetchLimit - 1)

    if (error) throw error

    const results: Array<Record<string, any>> = []

    for (const record of ((kmzRecords || []) as KmzRecord[])) {
      if (results.length >= limit) break

      const metadata = record.metadata || {}
      if (onlyMissingOwner && hasConfirmedOwner(record)) continue
      if (onlyWithSignals && !hasLeadSignals(record)) continue
      if (!forceRefresh && Array.isArray(metadata.owner_research_leads) && metadata.owner_research_leads.length > 0) {
        continue
      }

      const leads = buildPublicOwnerResearchLeads({
        kmzId: record.id,
        fileName: record.file_name,
        region: record.region,
        roles: record.rol_numbers || [],
        ownerCandidate: getOwnerCandidate(metadata),
        siiRecord: getSiiRecord(metadata),
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

      const summary = summarizePublicOwnerLeads(leads)
      const nextMetadata = {
        ...metadata,
        owner_research_leads: leads,
        owner_research_leads_summary: summary,
        owner_research_leads_generated_at: new Date().toISOString(),
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
        leads: leads.slice(0, 8),
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      scanned: kmzRecords?.length || 0,
      processed: results.length,
      updated: results.filter((result) => result.status === "updated").length,
      withLeads: results.filter((result) => result.status === "updated" || result.status === "dry-run").length,
      results,
    })
  } catch (error: any) {
    console.error("[Public owner leads] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to generate public owner leads",
      },
      { status: 500 },
    )
  }
}
