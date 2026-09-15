import { createClient } from "@supabase/supabase-js"
import { normalizeSearchText } from "@/lib/prospeccion/normalization"
import type { ProspectingLeadDecision } from "@/lib/prospeccion/lead-state"

export type CachedOwnerResearch = {
  result: Record<string, unknown>
  decision: ProspectingLeadDecision
  researchedAt: string
  nextRefreshAt: string
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function normalizeOwnerResearchRol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\//g, "-")
    .replace(/\s+/g, "")
    .replace(/[^0-9K-]/g, "")
    .replace(/-+/g, "-")
}

function communeKey(value: unknown) {
  return normalizeSearchText(String(value ?? "").trim())
}

export async function readOwnerResearchCache(input: { rol: string; commune?: string | null }) {
  const supabase = db()
  if (!supabase) return null
  const rolKey = normalizeOwnerResearchRol(input.rol)
  const locationKey = communeKey(input.commune)
  if (!rolKey) return null

  const { data, error } = await supabase
    .from("prospecting_owner_research")
    .select("result,decision,researched_at,next_refresh_at")
    .eq("rol_key", rolKey)
    .eq("commune_key", locationKey)
    .gt("next_refresh_at", new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.warn("[Owner Intelligence] cache read unavailable", error.message)
    return null
  }
  if (!data) return null

  return {
    result: (data.result ?? {}) as Record<string, unknown>,
    decision: data.decision as ProspectingLeadDecision,
    researchedAt: String(data.researched_at),
    nextRefreshAt: String(data.next_refresh_at),
  } satisfies CachedOwnerResearch
}

export async function writeOwnerResearchCache(input: {
  rol: string
  commune?: string | null
  result: Record<string, unknown>
  decision: ProspectingLeadDecision
  ttlDays?: number
}) {
  const supabase = db()
  if (!supabase) return null
  const rolKey = normalizeOwnerResearchRol(input.rol)
  const commune = String(input.commune ?? "").trim()
  const locationKey = communeKey(commune)
  if (!rolKey) return null

  const researchedAt = new Date()
  const nextRefreshAt = new Date(researchedAt.getTime() + Math.max(1, input.ttlDays ?? 30) * 24 * 60 * 60 * 1000)
  const payload = {
    rol: input.rol,
    rol_key: rolKey,
    commune,
    commune_key: locationKey,
    result: input.result,
    decision: input.decision,
    researched_at: researchedAt.toISOString(),
    next_refresh_at: nextRefreshAt.toISOString(),
    updated_at: researchedAt.toISOString(),
  }

  const { error } = await supabase
    .from("prospecting_owner_research")
    .upsert(payload, { onConflict: "rol_key,commune_key" })

  if (error) {
    console.warn("[Owner Intelligence] cache write unavailable", error.message)
    return null
  }

  return { researchedAt: payload.researched_at, nextRefreshAt: payload.next_refresh_at }
}
