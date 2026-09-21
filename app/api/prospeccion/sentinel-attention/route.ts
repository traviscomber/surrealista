import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { deriveSentinelAttentionQueue, type SentinelAttentionRow } from "@/lib/prospeccion/sentinel-attention"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function readAllSentinel(client: ReturnType<typeof createClient>) {
  const rows: SentinelAttentionRow[] = []
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("prospecting_sentinel_observations")
      .select("rol,rol_key,commune,geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count,fetched_at")
      .order("period_from", { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error
    const page = (data ?? []) as SentinelAttentionRow[]
    rows.push(...page)
    if (page.length < pageSize) break
  }

  return rows
}

export async function GET() {
  const client = db()
  if (!client) {
    return NextResponse.json({ error: "Memoria Sentinel no disponible: faltan variables server-side de Supabase." }, { status: 503 })
  }

  try {
    const rows = await readAllSentinel(client)
    const queue = deriveSentinelAttentionQueue(rows)

    return NextResponse.json({
      ...queue,
      methodology: {
        signal: "same-season-persisted-history",
        strongThreshold: "|ΔNDVI| >= 0.15",
        watchThreshold: "|ΔNDVI| >= 0.08",
        guardrail: "Cambio espectral, no diagnóstico agronómico ni identificación de especie.",
        coverage: `${rows.length} observaciones persistidas evaluadas`,
      },
    }, {
      headers: {
        "Cache-Control": "private, max-age=0, s-maxage=300, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[Prospeccion Sentinel Attention] query failed", error)
    return NextResponse.json({ error: "No se pudo leer la memoria Sentinel." }, { status: 500 })
  }
}
