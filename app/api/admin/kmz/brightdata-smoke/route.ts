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

type KmzRow = {
  id: string
  file_name: string | null
  region: string | null
  rol_numbers: string[] | null
  metadata: Record<string, any> | null
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("MISSING_SUPABASE_CREDENTIALS")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function priorityScore(row: KmzRow) {
  return Number(row.metadata?.owner_research_queue?.priorityScore || 0)
}

function primaryRol(row: KmzRow) {
  return row.metadata?.owner_research_queue?.primaryRol || row.rol_numbers?.[0] || null
}

async function canonicalSample(limit: number) {
  const db = admin()
  const { data, error } = await db
    .from("kmz_collection")
    .select("id,file_name,region,rol_numbers,metadata")
    .eq("is_active", true)
    .not("rol_numbers", "is", null)
    .limit(1200)

  if (error) throw error

  const rows = ((data || []) as KmzRow[])
    .filter((row) => row.metadata?.owner_research_queue?.status === "pending")
    .filter((row) => ["critical", "high"].includes(String(row.metadata?.owner_research_queue?.priorityTier || "")))
    .sort((a, b) => priorityScore(b) - priorityScore(a))

  const selected: KmzRow[] = []
  const seenRoles = new Set<string>()

  for (const row of rows) {
    const rol = primaryRol(row)
    if (!rol || seenRoles.has(rol)) continue
    seenRoles.add(rol)
    selected.push(row)
    if (selected.length >= limit) break
  }

  return selected
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requested = Number(url.searchParams.get("limit") || "3")
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 3, 5))
  const config = brightDataConfigStatus()

  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        error: "BRIGHTDATA_API_KEY_MISSING",
        config,
        requiredEnv: ["BRIGHTDATA_API_KEY", "BRIGHTDATA_WEB_UNLOCKER_ZONE"],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }

  try {
    const sample = await canonicalSample(limit)
    const results = []

    for (const row of sample) {
      const rol = primaryRol(row)
      if (!rol) continue

      const targetUrl = buildPublicEvidenceSearchUrl({
        rol,
        fileName: row.file_name,
        region: row.region,
      })

      try {
        const markdown = await brightDataMarkdown(targetUrl)
        const hits = extractExternalLinks(markdown, 6)
        results.push({
          kmzId: row.id,
          fileName: row.file_name,
          region: row.region,
          rol,
          priorityScore: priorityScore(row),
          providerRequests: 1,
          exactRolVisible: markdown.includes(rol),
          hitCount: hits.length,
          hits,
        })
      } catch (error) {
        results.push({
          kmzId: row.id,
          fileName: row.file_name,
          region: row.region,
          rol,
          priorityScore: priorityScore(row),
          providerRequests: 1,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json(
      {
        ok: true,
        readOnly: true,
        writes: 0,
        canonicalSource: "kmz_collection",
        evidenceTarget: "kmz_enrichment_evidence",
        config,
        uniqueRolesTested: results.length,
        providerRequests: results.length,
        results,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
