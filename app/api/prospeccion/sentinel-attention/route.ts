import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { deriveSentinelAttentionQueue } from "@/lib/prospeccion/sentinel-attention"
import { readAllSentinelAttentionRows } from "@/lib/prospeccion/sentinel-repository"

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

  try {
    const rows = await readAllSentinelAttentionRows(client)
    const queue = deriveSentinelAttentionQueue(rows)
    return NextResponse.json({
      ...queue,
      methodology: {
        signal: "same-season-persisted-history",
        strongThreshold: "|ΔNDVI| >= 0.15",
        watchThreshold: "|ΔNDVI| >= 0.08",
        guardrail: "Cambio espectral, no diagnóstico agronómico ni identificación de especie.",
      },
    })
  } catch (error) {
    console.error("[Prospeccion Sentinel Attention] query failed", error)
    return NextResponse.json({ error: "No se pudo leer la memoria Sentinel." }, { status: 500 })
  }
}
