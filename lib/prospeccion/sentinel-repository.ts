import type { SupabaseClient } from "@supabase/supabase-js"

import type { SentinelAttentionRow } from "@/lib/prospeccion/sentinel-attention"

const PAGE_SIZE = 1000

export async function readAllSentinelAttentionRows(client: SupabaseClient) {
  const rows: SentinelAttentionRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("prospecting_sentinel_observations")
      .select("rol,rol_key,commune,geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count,fetched_at")
      .order("period_from", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error

    const page = (data ?? []) as SentinelAttentionRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}
