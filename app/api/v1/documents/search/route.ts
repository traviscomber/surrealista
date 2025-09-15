import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { query, type, folder, client_id, date_from, date_to, limit = 10, offset = 0 } = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Build search query
    let searchQuery = supabase.from("documents").select(`
        *,
        clients(name, email),
        properties(address, rol)
      `)

    // Full-text search
    if (query) {
      searchQuery = searchQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    }

    // Filters
    if (type) searchQuery = searchQuery.eq("type", type)
    if (folder) searchQuery = searchQuery.ilike("folder_path", `%${folder}%`)
    if (client_id) searchQuery = searchQuery.eq("client_id", client_id)
    if (date_from) searchQuery = searchQuery.gte("created_at", date_from)
    if (date_to) searchQuery = searchQuery.lte("created_at", date_to)

    // Pagination and ordering
    searchQuery = searchQuery.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data: results, error, count } = await searchQuery

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    return NextResponse.json({
      results: results || [],
      total: count || 0,
      query,
      filters: { type, folder, client_id, date_from, date_to },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
