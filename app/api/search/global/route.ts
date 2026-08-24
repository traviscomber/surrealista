import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ALLOWED_TYPES = new Set(["clients", "campos", "documents", "messages", "tasks"])

function sanitizeSearchTerm(value: unknown) {
  if (typeof value !== "string") return ""
  return value
    .replace(/[^\p{L}\p{N}\s@._+'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const searchQuery = sanitizeSearchTerm(body?.query)

    if (searchQuery.length < 2) {
      return NextResponse.json({ results: [], total: 0, query: searchQuery })
    }

    const requestedTypes = Array.isArray(body?.types)
      ? body.types.filter((value: unknown): value is string => typeof value === "string" && ALLOWED_TYPES.has(value))
      : []
    const includeAll = requestedTypes.length === 0

    const rawLimit = Number(body?.limit ?? 50)
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, Math.floor(rawLimit))) : 50

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Search data connection is not configured" }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const pattern = `%${searchQuery}%`
    const searches: Array<Promise<any[]>> = []

    if (includeAll || requestedTypes.includes("clients")) {
      searches.push((async () => {
        const { data, error } = await supabase
          .from("clients")
          .select("id, first_name, last_name, email, phone, company_name, status, main_interest")
          .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company_name.ilike.${pattern}`)
          .limit(limit)
        if (error) throw error
        return (data || []).map((row) => ({ ...row, _type: "client" }))
      })())
    }

    if (includeAll || requestedTypes.includes("campos")) {
      searches.push((async () => {
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, description, placemarks_count, category, coordinates")
          .eq("is_active", true)
          .or(`file_name.ilike.${pattern},description.ilike.${pattern},region.ilike.${pattern}`)
          .limit(limit)
        if (error) throw error
        return (data || []).map((row) => ({ ...row, _type: "campo" }))
      })())
    }

    if (includeAll || requestedTypes.includes("documents")) {
      searches.push((async () => {
        const { data, error } = await supabase
          .from("documents")
          .select("id, title, description, document_type, status, file_name")
          .or(`title.ilike.${pattern},description.ilike.${pattern},file_name.ilike.${pattern}`)
          .limit(limit)
        if (error) throw error
        return (data || []).map((row) => ({ ...row, _type: "document" }))
      })())
    }

    if (includeAll || requestedTypes.includes("messages")) {
      searches.push((async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("id, name, email, subject, message, status")
          .or(`name.ilike.${pattern},subject.ilike.${pattern},message.ilike.${pattern}`)
          .limit(limit)
        if (error) throw error
        return (data || []).map((row) => ({ ...row, _type: "message" }))
      })())
    }

    if (includeAll || requestedTypes.includes("tasks")) {
      searches.push((async () => {
        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, description, status, priority, location")
          .or(`title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`)
          .limit(limit)
        if (error) throw error
        return (data || []).map((row) => ({ ...row, _type: "task" }))
      })())
    }

    const settled = await Promise.allSettled(searches)
    const results = settled.flatMap((entry) => entry.status === "fulfilled" ? entry.value : [])
    const failures = settled.filter((entry) => entry.status === "rejected").length

    if (!results.length && failures === searches.length && searches.length > 0) {
      return NextResponse.json({ error: "Search unavailable" }, { status: 503 })
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: searchQuery,
      partial: failures > 0,
    })
  } catch (error) {
    console.error("[v0] Global search API error:", error)
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
