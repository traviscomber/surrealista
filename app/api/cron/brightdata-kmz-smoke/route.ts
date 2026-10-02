import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  brightDataConfigStatus,
  brightDataMarkdown,
  buildPublicEvidenceSearchUrl,
  extractExternalLinks,
} from "@/lib/kmz/brightdata-enrichment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("MISSING_SUPABASE_CREDENTIALS")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function allowed(request: Request) {
  const url = new URL(request.url)
  const preview =
    url.searchParams.get("dry_run") === "1" &&
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feat/operating-system-shell"
  const secret = process.env.CRON_SECRET
  const cron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`
  return preview || cron
}

export async function GET(request: Request) {
  if (!allowed(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const config = brightDataConfigStatus()
  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        error: "BRIGHTDATA_API_KEY_MISSING",
        requiredEnv: ["BRIGHTDATA_API_KEY", "BRIGHTDATA_WEB_UNLOCKER_ZONE"],
        config,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }

  const db = admin()
  const { data, error } = await db
    .from("kmz_collection")
    .select("id,file_name,region,rol_numbers,metadata")
    .eq("is_active", true)
    .not("rol_numbers", "is", null)
    .limit(1200)
  if (error) throw error

  const candidates = (data || [])
    .filter((row: any) => row.metadata?.owner_research_queue?.status === "pending")
    .filter((row: any) => ["critical", "high"].includes(String(row.metadata?.owner_research_queue?.priorityTier || "")))
    .sort((a: any, b: any) => Number(b.metadata?.owner_research_queue?.priorityScore || 0) - Number(a.metadata?.owner_research_queue?.priorityScore || 0))

  const seen = new Set<string>()
  const selected: any[] = []
  for (const row of candidates) {
    const rol = row.metadata?.owner_research_queue?.primaryRol || row.rol_numbers?.[0]
    if (!rol || seen.has(rol)) continue
    seen.add(rol)
    selected.push({ ...row, rol })
    if (selected.length >= 3) break
  }

  const results = []
  for (const row of selected) {
    try {
      const markdown = await brightDataMarkdown(
        buildPublicEvidenceSearchUrl({ rol: row.rol, fileName: row.file_name, region: row.region }),
      )
      results.push({
        rol: row.rol,
        hitCount: extractExternalLinks(markdown, 8).length,
        exactRolVisible: markdown.includes(row.rol),
        providerRequests: 1,
      })
    } catch (err) {
      results.push({
        rol: row.rol,
        providerRequests: 1,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json(
    {
      ok: true,
      dryRun: true,
      writes: 0,
      canonicalSource: "kmz_collection",
      evidenceTarget: "kmz_enrichment_evidence",
      uniqueRolesTested: results.length,
      providerRequests: results.length,
      results,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
