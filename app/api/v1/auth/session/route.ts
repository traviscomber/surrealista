import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling } from "../../middleware"
import { createServerClient } from "@/lib/core/database/supabase"
import { cookies } from "next/headers"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return NextResponse.json(createAPIResponse(null, false, undefined, error.message), {
      status: 401,
    })
  }

  return NextResponse.json(createAPIResponse({ session }))
})
