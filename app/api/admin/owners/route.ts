import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase owner discovery configuration is missing")
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeConfidence(value: unknown) {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return parsed > 1 ? parsed / 100 : parsed
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 1000, 1), 2500)
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("kmz_collection")
      .select("id, file_name, region, category, rol_numbers, placemarks_count, metadata, updated_at, created_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    const records = (data || []).map((item: any) => {
      const metadata = item.metadata || {}
      const candidate = metadata.public_owner_candidate || null
      const owner = candidate?.name || metadata.web_owner || null
      const confidence = normalizeConfidence(
        candidate?.confidence ?? metadata.owner_confidence ?? metadata.web_owner_confidence,
      )
      const queue = metadata.owner_research_queue || null
      const leads = Array.isArray(metadata.owner_research_leads) ? metadata.owner_research_leads : []
      const evidenceUrl = metadata.web_owner_evidence_url
        || candidate?.evidence_url
        || leads.find((lead: any) => lead?.url || lead?.evidence_url)?.url
        || leads.find((lead: any) => lead?.url || lead?.evidence_url)?.evidence_url
        || null

      return {
        id: item.id,
        file_name: item.file_name || "Archivo sin nombre",
        region: item.region || null,
        category: item.category || null,
        rol: Array.isArray(item.rol_numbers) ? item.rol_numbers[0] || null : item.rol_numbers || null,
        rol_numbers: item.rol_numbers || [],
        placemarks_count: item.placemarks_count || 0,
        owner,
        confidence,
        source: candidate?.source || (metadata.web_owner ? "web_search" : null),
        evidence_url: evidenceUrl,
        leads_count: leads.length,
        status: owner
          ? confidence >= 0.85 ? "confirmed" : "evidence-found"
          : queue?.status || "pending",
        researched_at: queue?.last_researched_at || metadata.web_owner_scraped_at || null,
        updated_at: item.updated_at || item.created_at,
      }
    })

    return NextResponse.json({ records, total: records.length }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[owner-discovery] Inventory error", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo cargar el inventario" }, { status: 500 })
  }
}
