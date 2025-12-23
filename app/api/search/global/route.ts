import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { query: searchQuery, types, limit = 50 } = await request.json()

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const results: any[] = []

    const searchPromises: Promise<any>[] = []

    if (!types || types.includes("clients")) {
      searchPromises.push(
        supabase
          .from("clients")
          .select("id, first_name, last_name, email, phone, company_name, status, main_interest")
          .or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`,
          )
          .limit(limit)
          .then(({ data }) => data?.map((d) => ({ ...d, _type: "client" })) || []),
      )
    }

    if (!types || types.includes("campos")) {
      const directKmzSearch = supabase
        .from("kmz_collection")
        .select("id, file_name, region, description, placemarks_count, category, coordinates")
        .or(`file_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%`)
        .limit(limit)
        .then(({ data }) => data?.map((d) => ({ ...d, _type: "campo" })) || [])

      const regionKmzSearch = supabase
        .from("kmz_collection")
        .select("id, file_name, region, description, placemarks_count, category, coordinates")
        .ilike("region", `%${searchQuery}%`)
        .limit(limit)
        .then(({ data }) => data?.map((d) => ({ ...d, _type: "campo", _source: "region_match" })) || [])

      searchPromises.push(
        Promise.all([directKmzSearch, regionKmzSearch]).then(([direct, byRegion]) => {
          // Combine results and deduplicate by id
          const combined = [...direct, ...byRegion]
          const seen = new Set<string>()
          return combined.filter((item) => {
            if (seen.has(item.id)) return false
            seen.add(item.id)
            return true
          })
        }),
      )
    }

    if (!types || types.includes("documents")) {
      searchPromises.push(
        supabase
          .from("documents")
          .select("id, title, description, document_type, status, file_name")
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,file_name.ilike.%${searchQuery}%`)
          .limit(limit)
          .then(({ data }) => data?.map((d) => ({ ...d, _type: "document" })) || []),
      )
    }

    if (!types || types.includes("messages")) {
      searchPromises.push(
        supabase
          .from("messages")
          .select("id, name, email, subject, message, status")
          .or(`name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
          .limit(limit)
          .then(({ data }) => data?.map((d) => ({ ...d, _type: "message" })) || []),
      )
    }

    if (!types || types.includes("tasks")) {
      searchPromises.push(
        supabase
          .from("tasks")
          .select("id, title, description, status, priority, location")
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
          .limit(limit)
          .then(({ data }) => data?.map((d) => ({ ...d, _type: "task" })) || []),
      )
    }

    const searchResults = await Promise.all(searchPromises)
    const allResults = searchResults.flat()

    return NextResponse.json({
      results: allResults,
      total: allResults.length,
      query: searchQuery,
    })
  } catch (error) {
    console.error("[v0] Global search API error:", error)
    return NextResponse.json({ error: "Search failed", message: error.message }, { status: 500 })
  }
}
