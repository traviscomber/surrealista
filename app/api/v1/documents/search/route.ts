import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function cleanSearchTerm(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/[(),]/g, " ").slice(0, 200)
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.trunc(parsed), min), max)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = cleanSearchTerm(body.query)
    const type = typeof body.type === "string" ? body.type.trim() : ""
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : ""
    const dateFrom = typeof body.date_from === "string" ? body.date_from.trim() : ""
    const dateTo = typeof body.date_to === "string" ? body.date_to.trim() : ""
    const limit = boundedInteger(body.limit, 10, 1, 100)
    const offset = boundedInteger(body.offset, 0, 0, 100_000)

    const supabase = await createClient()
    let searchQuery = supabase.from("documents").select("*", { count: "exact" })

    if (query) {
      searchQuery = searchQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%`,
      )
    }
    if (type) searchQuery = searchQuery.eq("document_type", type)
    if (clientId) searchQuery = searchQuery.eq("related_client_id", clientId)
    if (dateFrom) searchQuery = searchQuery.gte("document_date", dateFrom)
    if (dateTo) searchQuery = searchQuery.lte("document_date", dateTo)

    const { data, error, count } = await searchQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[documents/search] query failed", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    return NextResponse.json({
      results: data || [],
      total: count || 0,
      query,
      filters: {
        type: type || null,
        client_id: clientId || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
      },
    })
  } catch (error) {
    console.error("[documents/search] failed", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
