import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling, withRateLimit } from "../../middleware"
import { createServerClient } from "@/lib/core/database/supabase"
import { cookies } from "next/headers"

export const GET = withRateLimit(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const city = searchParams.get("city")
    const type = searchParams.get("type")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    let query = supabase
      .from("properties")
      .select("*", { count: "exact" })
      .eq("status", "available")
      .range((page - 1) * limit, page * limit - 1)

    if (city) query = query.eq("city", city)
    if (type) query = query.eq("property_type", type)
    if (minPrice) query = query.gte("price", Number.parseInt(minPrice))
    if (maxPrice) query = query.lte("price", Number.parseInt(maxPrice))

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(createAPIResponse(null, false, undefined, error.message), {
        status: 500,
      })
    }

    return NextResponse.json(
      createAPIResponse({
        properties: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
    )
  }),
)
