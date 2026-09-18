import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { POST as runMandate } from "@/app/api/prospeccion/mandates/[id]/run/route"

export const runtime = "nodejs"
export const maxDuration = 300

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase configuration")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function accessCookie() {
  const password = process.env.APP_PASSWORD?.trim()
  if (!password) throw new Error("APP_PASSWORD is not configured")
  return `sur_realista_access=${createHash("sha256").update(`sur-realista:${password}`).digest("hex")}`
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const db = admin()
  const { data: mandates, error } = await db
    .from("prospecting_mandates")
    .select("id,name,last_run_at")
    .eq("status", "active")
    .order("last_run_at", { ascending: true, nullsFirst: true })
    .limit(3)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const results: Array<Record<string, unknown>> = []
  for (const mandate of mandates ?? []) {
    try {
      const request = new NextRequest(req.nextUrl.origin + `/api/prospeccion/mandates/${mandate.id}/run`, {
        method: "POST",
        headers: { cookie: accessCookie() },
      })
      const response = await runMandate(request, { params: Promise.resolve({ id: mandate.id }) })
      const payload = await response.json().catch(() => null)
      results.push({
        id: mandate.id,
        name: mandate.name,
        status: response.ok ? "checked" : "failed",
        newCount: payload?.newCount ?? 0,
        candidateCount: payload?.mandate?.last_candidate_count ?? null,
        error: response.ok ? null : payload?.error ?? "Mandate run failed",
      })
    } catch (cause) {
      results.push({
        id: mandate.id,
        name: mandate.name,
        status: "error",
        error: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  return NextResponse.json({
    success: true,
    checked: results.length,
    newCandidates: results.reduce((sum, item) => sum + Number(item.newCount ?? 0), 0),
    results,
  })
}
