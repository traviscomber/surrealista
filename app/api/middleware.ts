import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/core/database/supabase"
import { cookies } from "next/headers"

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createAPIResponse<T>(data?: T, success = true, message?: string, error?: string): APIResponse<T> {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error }),
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json(createAPIResponse(null, false, undefined, "Unauthorized"), {
        status: 401,
      })
    }

    return await handler(request, session.user)
  } catch (error) {
    return NextResponse.json(createAPIResponse(null, false, undefined, "Authentication error"), {
      status: 500,
    })
  }
}

export function withErrorHandling(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error: any) {
      console.error("API Error:", error)
      return NextResponse.json(createAPIResponse(null, false, undefined, error.message || "Internal server error"), {
        status: 500,
      })
    }
  }
}

export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>, limit = 100, windowMs = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async (request: NextRequest) => {
    const ip = request.ip || "unknown"
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key)
      }
    }

    const current = requests.get(ip) || { count: 0, resetTime: now + windowMs }

    if (current.count >= limit) {
      return NextResponse.json(createAPIResponse(null, false, undefined, "Rate limit exceeded"), {
        status: 429,
      })
    }

    current.count++
    requests.set(ip, current)

    return await handler(request)
  }
}
