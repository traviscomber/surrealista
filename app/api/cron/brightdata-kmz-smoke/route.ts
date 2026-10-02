import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  brightDataConfigStatus,
  brightDataMarkdown,
  buildFieldEvidenceSearchUrl,
  buildPublicEvidenceSearchUrl,
  extractExternalLinks,
  inspectGoogleResultStructure,
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

  const url = new URL(request.url)
  const config = brightDataConfigStatus()
  const providerProbe = url.searchParams.get("probe")
  const requested = Number(url.searchParams.get("limit") || "1")
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, 3))
  console.info("[brightdata-kmz-smoke] start", JSON.stringify({ configured: config.configured, zone: config.zone, limit }))
  if (providerProbe) {
    const probeUrls: Record<string, string> = {
      portal: "https://www.portalinmobiliario.com/venta/casa/vitacura-metropolitana",
      ddg: "https://html.duckduckgo.com/html/?q=%2210108-204-16%22+Chile+propiedad",
      google: "https://www.google.com/search?q=%2210108-204-16%22+Chile+propiedad&hl=es&gl=cl",
    }
    const probeUrl = probeUrls[providerProbe]
    if (!probeUrl) {
      return NextResponse.json({ ok: false, error: "Unknown probe" }, { status: 400 })
    }

    try {
      const body = await brightDataMarkdown(probeUrl)
      const links = extractExternalLinks(body, 8)
      console.info("[brightdata-kmz-smoke] provider-probe", JSON.stringify({
        probe: providerProbe,
        bytes: body.length,
        links: links.length,
      }))
      return NextResponse.json({
        ok: body.length > 0,
        dryRun: true,
        writes: 0,
        providerProbe,
        bytes: body.length,
        exactRolVisible: body.includes("10108-204-16"),
        links,
        structure: providerProbe === "google" ? inspectGoogleResultStructure(body) : undefined,
      }, { headers: { "Cache-Control": "no-store" } })
    } catch (error) {
      console.warn("[brightdata-kmz-smoke] provider-probe-failed", JSON.stringify({
        probe: providerProbe,
        error: error instanceof Error ? error.message : String(error),
      }))
      return NextResponse.json({
        ok: false,
        dryRun: true,
        writes: 0,
        providerProbe,
        error: error instanceof Error ? error.message : String(error),
      }, { status: 503, headers: { "Cache-Control": "no-store" } })
    }
  }

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
    if (selected.length >= limit) break
  }

  const results = await Promise.all(selected.map(async (row) => {
    let providerRequests = 0
    let rolBody = ""

    try {
      providerRequests += 1
      const siiRecord = row.metadata?.sii_point_resolution?.record || null
      rolBody = await brightDataMarkdown(
        buildPublicEvidenceSearchUrl({
          rol: row.rol,
          fileName: row.file_name,
          region: row.region,
          commune: siiRecord?.comuna || siiRecord?.raw?.nombreComuna || null,
          address: siiRecord?.direccion || siiRecord?.raw?.direccion || null,
        }),
      )
    } catch (error) {
      console.warn("[brightdata-kmz-smoke] rol-query-failed", JSON.stringify({
        rol: row.rol,
        error: error instanceof Error ? error.message : String(error),
      }))
    }

    const rolHits = rolBody ? extractExternalLinks(rolBody, 8) : []
    if (rolHits.length > 0) {
      const result = {
        rol: row.rol,
        fileName: row.file_name,
        region: row.region,
        discoveryBasis: "rol_exact",
        hitCount: rolHits.length,
        exactRolVisible: rolBody.includes(row.rol),
        providerRequests,
        hits: rolHits.slice(0, 5),
      }
      console.info("[brightdata-kmz-smoke] rol", JSON.stringify({
        rol: row.rol,
        discoveryBasis: result.discoveryBasis,
        hitCount: result.hitCount,
        providerRequests,
      }))
      return result
    }

    const siiRecord = row.metadata?.sii_point_resolution?.record || null
    const fieldUrl = buildFieldEvidenceSearchUrl({
      fileName: row.file_name,
      region: row.region,
      commune: siiRecord?.comuna || siiRecord?.raw?.nombreComuna || null,
    })
    if (!fieldUrl) {
      return {
        rol: row.rol,
        fileName: row.file_name,
        region: row.region,
        discoveryBasis: "none",
        hitCount: 0,
        providerRequests,
        hits: [],
      }
    }

    try {
      providerRequests += 1
      const fieldBody = await brightDataMarkdown(fieldUrl)
      const fieldHits = extractExternalLinks(fieldBody, 8)
      const result = {
        rol: row.rol,
        fileName: row.file_name,
        region: row.region,
        discoveryBasis: "field_name_fallback",
        hitCount: fieldHits.length,
        exactRolVisible: fieldBody.includes(row.rol),
        providerRequests,
        hits: fieldHits.slice(0, 5),
      }
      console.info("[brightdata-kmz-smoke] rol", JSON.stringify({
        rol: row.rol,
        discoveryBasis: result.discoveryBasis,
        hitCount: result.hitCount,
        providerRequests,
      }))
      return result
    } catch (err) {
      const result = {
        rol: row.rol,
        fileName: row.file_name,
        region: row.region,
        discoveryBasis: "field_name_fallback",
        hitCount: 0,
        providerRequests,
        hits: [],
        error: err instanceof Error ? err.message : String(err),
      }
      console.warn("[brightdata-kmz-smoke] field-query-failed", JSON.stringify(result))
      return result
    }
  }))

  console.info("[brightdata-kmz-smoke] complete", JSON.stringify({
    uniqueRolesTested: results.length,
    providerRequests: results.reduce((sum, row) => sum + Number(row.providerRequests || 0), 0),
    failures: results.filter((row) => "error" in row).length,
  }))

  return NextResponse.json(
    {
      ok: true,
      dryRun: true,
      writes: 0,
      canonicalSource: "kmz_collection",
      evidenceTarget: "kmz_enrichment_evidence",
      uniqueRolesTested: results.length,
      providerRequests: results.reduce((sum, row) => sum + Number(row.providerRequests || 0), 0),
      results,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
