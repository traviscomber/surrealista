import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(request: Request) {
  const supabase = db()
  if (!supabase) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const mandateId = searchParams.get("mandateId")?.trim() || null
  const status = searchParams.get("status")?.trim() || null
  const limit = Math.max(1, Math.min(Number(searchParams.get("limit") || 50), 100))

  let query = supabase
    .from("prospecting_cases")
    .select("id,mandate_id,external_case_id,case_kind,status,score,title,location,rol,area_ha,species_evidence,owner_evidence,contact_evidence,market_evidence,evidence,next_action,first_seen_at,last_seen_at,last_revalidated_at,active")
    .eq("active", true)
    .order("score", { ascending: false })
    .order("last_revalidated_at", { ascending: false })
    .limit(limit)

  if (mandateId) query = query.eq("mandate_id", mandateId)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ cases: [], available: false, reason: "migration_pending" })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    cases: data ?? [],
    count: data?.length ?? 0,
    available: true,
    authority: "persistent_decision_cases",
  })
}
