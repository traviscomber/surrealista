import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { deriveSentinelAttentionQueue, type SentinelAttentionRow } from "@/lib/prospeccion/sentinel-attention"

export const dynamic = "force-dynamic"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  const client = db()
  if (!client) {
    return NextResponse.json({ error: "Memoria Sentinel no disponible: faltan variables server-side de Supabase." }, { status: 503 })
  }

  const { data, error } = await client
    .from("prospecting_sentinel_observations")
    .select("rol,rol_key,commune,geometry_mode,geometry_fingerprint,period_from,period_to,ndvi,ndre,ndmi,sample_count,fetched_at")
    .order("period_from", { ascending: true })
    .limit(5000)

  if (error) {
    console.error("[Prospeccion Sentinel Attention] query failed", error.message)
    return NextResponse.json({ error: "No se pudo leer la memoria Sentinel." }, { status: 500 })
  }

  const queue = deriveSentinelAttentionQueue((data ?? []) as SentinelAttentionRow[])
  return NextResponse.json({
    ...queue,
    methodology: {
      signal: "same-season-persisted-history",
      strongThreshold: "|ΔNDVI| >= 0.15",
      watchThreshold: "|ΔNDVI| >= 0.08",
      guardrail: "Cambio espectral, no diagnóstico agronómico ni identificación de especie.",
    },
  })
}
