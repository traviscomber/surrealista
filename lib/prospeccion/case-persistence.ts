import { createHash } from "node:crypto"
import type { ProspectingCase, ProspectingSourceRef } from "@/lib/prospeccion/intelligence-core"

type SupabaseLike = any

type PersistResult = {
  persisted: number
  detected: number
  revalidated: number
  statusChanged: number
  inactive: number
}

function stableFingerprint(item: ProspectingCase) {
  return createHash("sha256")
    .update(JSON.stringify({
      id: item.id,
      kind: item.kind,
      status: item.status,
      score: item.score,
      rol: item.rol,
      areaHa: item.areaHa,
      speciesEvidence: item.speciesEvidence,
      owner: item.owner,
      contact: item.contact,
      market: item.market,
      evidence: item.evidence,
      nextAction: item.nextAction,
    }))
    .digest("hex")
}

export async function persistProspectingDecisionCases({
  supabase,
  mandateId,
  cases,
  sourceRefs,
}: {
  supabase: SupabaseLike
  mandateId: string
  cases: ProspectingCase[]
  sourceRefs: ProspectingSourceRef[]
}): Promise<PersistResult> {
  const now = new Date().toISOString()
  const { data: existing, error: existingError } = await supabase
    .from("prospecting_cases")
    .select("id,external_case_id,status,source_fingerprint,active")
    .eq("mandate_id", mandateId)

  if (existingError) throw existingError

  const existingByExternalId = new Map((existing ?? []).map((row: any) => [String(row.external_case_id), row]))
  const seen = new Set<string>()
  let detected = 0
  let revalidated = 0
  let statusChanged = 0

  for (const item of cases) {
    const externalId = String(item.id)
    const fingerprint = stableFingerprint(item)
    const previous = existingByExternalId.get(externalId)
    seen.add(externalId)

    const payload = {
      mandate_id: mandateId,
      external_case_id: externalId,
      case_kind: item.kind,
      status: item.status,
      score: item.score,
      title: item.title,
      location: item.location,
      rol: item.rol,
      area_ha: item.areaHa,
      species_evidence: item.speciesEvidence,
      owner_evidence: item.owner,
      contact_evidence: item.contact,
      market_evidence: item.market,
      evidence: item.evidence,
      next_action: item.nextAction,
      source_fingerprint: fingerprint,
      last_seen_at: now,
      last_revalidated_at: now,
      active: true,
      updated_at: now,
    }

    const { data: persisted, error: upsertError } = await supabase
      .from("prospecting_cases")
      .upsert(payload, { onConflict: "mandate_id,external_case_id" })
      .select("id,status")
      .single()

    if (upsertError) throw upsertError

    const eventType = !previous
      ? "detected"
      : previous.status !== item.status
        ? "status_changed"
        : "revalidated"

    if (!previous) detected += 1
    else if (previous.status !== item.status) statusChanged += 1
    else revalidated += 1

    const { error: eventError } = await supabase.from("prospecting_case_events").insert({
      case_id: persisted.id,
      mandate_id: mandateId,
      event_type: eventType,
      previous_status: previous?.status ?? null,
      current_status: item.status,
      evidence_snapshot: {
        score: item.score,
        rol: item.rol,
        areaHa: item.areaHa,
        owner: item.owner,
        contactAvailable: Boolean(item.contact?.phone || item.contact?.email),
        fingerprintChanged: previous ? previous.source_fingerprint !== fingerprint : true,
      },
      source_refs: sourceRefs,
      created_at: now,
    })

    if (eventError) throw eventError
  }

  const staleIds = (existing ?? [])
    .filter((row: any) => row.active !== false && !seen.has(String(row.external_case_id)))
    .map((row: any) => String(row.id))

  if (staleIds.length) {
    const { error: inactiveError } = await supabase
      .from("prospecting_cases")
      .update({ active: false, updated_at: now })
      .in("id", staleIds)
    if (inactiveError) throw inactiveError
  }

  return {
    persisted: cases.length,
    detected,
    revalidated,
    statusChanged,
    inactive: staleIds.length,
  }
}

export async function loadGovernedProspectingMemory(supabase: SupabaseLike, operatorId = "internal-operator") {
  const { data, error } = await supabase
    .from("prospecting_memory")
    .select("id,memory_type,memory_text,confidence,updated_at")
    .eq("operator_id", operatorId)
    .eq("scope", "prospecting")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(12)

  if (error) {
    console.warn("[Prospeccion] governed memory unavailable", error.message)
    return { available: false, memories: [], authority: "non_canonical" as const }
  }

  return {
    available: true,
    memories: data ?? [],
    authority: "non_canonical" as const,
  }
}
