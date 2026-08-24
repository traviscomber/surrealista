import { type NextRequest, NextResponse } from "next/server"
import { createAPIResponse, withErrorHandling } from "../../middleware"
import { createClient } from "@/lib/supabase/server"

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await createClient()

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
