import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling, withRateLimit } from "../../middleware"
import { createClient } from "@/lib/supabase/server"

export const GET = withRateLimit(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const rawLimit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20
    const city = searchParams.get("city")
    const type = searchParams.get("type")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const supabase = await createClient()

    let query = supabase
      .from("properties")
      .select("*", { count: "exact" })
      .eq("status", "available")
      .range((page - 1) * limit, page * limit - 1)

    if (city) query = query.eq("city", city)
    if (type) query = query.eq("property_type", type)

    if (minPrice) {
      const value = Number(minPrice)
      if (!Number.isFinite(value)) {
        return NextResponse.json(createAPIResponse(null, false, undefined, "Invalid minPrice"), { status: 400 })
      }
      query = query.gte("price", value)
    }

    if (maxPrice) {
      const value = Number(maxPrice)
      if (!Number.isFinite(value)) {
        return NextResponse.json(createAPIResponse(null, false, undefined, "Invalid maxPrice"), { status: 400 })
      }
      query = query.lte("price", value)
    }

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
