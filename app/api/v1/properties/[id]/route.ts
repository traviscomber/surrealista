import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling } from "../../../middleware"
import { createServerClient } from "@/lib/core/database/supabase"
import { cookies } from "next/headers"

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("properties").select("*, images(*)").eq("id", params.id).single()

  if (error) {
    return NextResponse.json(createAPIResponse(null, false, undefined, "Property not found"), {
      status: 404,
    })
  }

  return NextResponse.json(createAPIResponse({ property: data }))
})
