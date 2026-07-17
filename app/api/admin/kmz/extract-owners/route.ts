import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  extractOwnerCandidateFromTargets,
  toOwnerEvidenceRecord,
  toPublicOwnerCandidate,
} from "@/lib/kmz/owner-extraction"

export const runtime = "nodejs"
export const maxDuration = 300

type ExtractOwnersRequest = {
  limit?: number
  offset?: number
  dryRun?: boolean
  onlyMissingOwner?: boolean
  forceRefresh?: boolean
}

type KmzRecord = {
  id: string
  file_name: string
  description: string | null
  owner: string | null
  metadata: Record<string, any> | null
}

type PlacemarkRecord = {
  name: string | null
  description: string | null
  properties: Record<string, any> | null
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(url, key)
}

function hasOwnerCandidate(record: KmzRecord) {
  const metadata = record.metadata || {}
  return Boolean(
    record.owner?.trim() ||
      metadata.public_owner_candidate ||
      metadata.latest_owner_evidence ||
      metadata.latest_cbr_owner_record ||
      (Array.isArray(metadata.owner_evidence_records) && metadata.owner_evidence_records.length > 0) ||
      (Array.isArray(metadata.cbr_owner_records) && metadata.cbr_owner_records.length > 0),
  )
}

function mergeEvidence(metadata: Record<string, any>, evidence: Record<string, any>) {
  const existingEntries = Array.isArray(metadata.owner_evidence_records) ? metadata.owner_evidence_records : []
  const mergedEntries = [
    ...existingEntries.filter(
      (entry: any) =>
        !(entry?.sourceType === evidence.sourceType && entry?.notes === evidence.notes && entry?.ownerLabel === evidence.ownerLabel),
    ),
    evidence,
  ]

  return mergedEntries
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ExtractOwnersRequest
    const limit = Math.min(Math.max(body.limit || 100, 1), 500)
    const offset = Math.max(body.offset || 0, 0)
    const dryRun = body.dryRun === true
    const onlyMissingOwner = body.onlyMissingOwner !== false
    const forceRefresh = body.forceRefresh === true
    const supabase = getSupabaseAdmin()

    const fetchLimit = onlyMissingOwner ? Math.min(limit * 3, 1500) : limit
    const { data: kmzRecords, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, description, owner, metadata")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .range(offset, offset + fetchLimit - 1)

    if (error) throw error

    const results: Array<Record<string, any>> = []

    for (const kmz of ((kmzRecords || []) as KmzRecord[])) {
      if (results.length >= limit) break

      if (onlyMissingOwner && hasOwnerCandidate(kmz) && !forceRefresh) {
        continue
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

      const metadata = kmz.metadata || {}
      const ownerCandidate = extractOwnerCandidateFromTargets([
        {
          name: kmz.file_name,
          description: kmz.description || metadata.description,
          metadata,
          source: "document-description",
        },
        ...((placemarks || []) as PlacemarkRecord[]).map((placemark) => ({
          name: placemark.name || "",
          description: placemark.description,
          properties: placemark.properties || {},
          source: "placemark-description" as const,
        })),
      ])

      if (!ownerCandidate) {
        results.push({
          id: kmz.id,
          fileName: kmz.file_name,
          status: "not-found",
        })
        continue
      }

      const evidence = toOwnerEvidenceRecord(ownerCandidate)
      const publicCandidate = toPublicOwnerCandidate(ownerCandidate)
      const nextMetadata = {
        ...metadata,
        public_owner_candidate: publicCandidate,
        latest_owner_evidence: evidence,
        owner_evidence_records: mergeEvidence(metadata, evidence),
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("kmz_collection")
          .update({ metadata: nextMetadata })
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
        owner: publicCandidate.owner,
        confidence: publicCandidate.confidence,
        sourceField: publicCandidate.sourceField,
        evidenceText: publicCandidate.evidenceText,
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      scanned: kmzRecords?.length || 0,
      processed: results.length,
      updated: results.filter((result) => result.status === "updated").length,
      found: results.filter((result) => result.status === "updated" || result.status === "dry-run").length,
      results,
    })
  } catch (error: any) {
    console.error("[KMZ owner extraction] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to extract owners from KMZ descriptions",
      },
      { status: 500 },
    )
  }
}
