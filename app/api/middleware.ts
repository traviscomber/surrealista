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
    ...(data !== undefined && data !== null ? { data } : {}),
    ...(message ? { message } : {}),
    ...(error ? { error } : {}),
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
) {
  try {
    const cookieStore = await cookies()
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
  } catch {
    return NextResponse.json(createAPIResponse(null, false, undefined, "Authentication error"), {
      status: 500,
    })
  }
}

export function withErrorHandling<TContext = unknown>(
  handler: (request: NextRequest, context: TContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: TContext) => {
    try {
      return await handler(request, context)
    } catch (error: any) {
      console.error("API Error:", error)
      return NextResponse.json(createAPIResponse(null, false, undefined, error.message || "Internal server error"), {
        status: 500,
      })
    }
  }
}

export function withRateLimit<TContext = unknown>(
  handler: (request: NextRequest, context: TContext) => Promise<NextResponse>,
  limit = 100,
  windowMs = 60000,
) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async (request: NextRequest, context: TContext) => {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    const now = Date.now()

    for (const [key, value] of requests.entries()) {
      if (value.resetTime <= now) {
        requests.delete(key)
      }
    }

    const current = requests.get(ip) || { count: 0, resetTime: now + windowMs }
    if (current.count >= limit) {
      return NextResponse.json(createAPIResponse(null, false, undefined, "Rate limit exceeded"), {
        status: 429,
      })
    }

    current.count += 1
    requests.set(ip, current)

    return await handler(request, context)
  }
}
