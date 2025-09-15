import { type NextRequest, NextResponse } from "next/server"

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createAPIResponse<T>(data?: T, message?: string, success = true): APIResponse<T> {
  return {
    success,
    data,
    message,
    ...(success ? {} : { error: message }),
  }
}

export function withErrorHandling<T extends any[]>(handler: (...args: T) => Promise<NextResponse>) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error("API Error:", error)

      const errorMessage = error instanceof Error ? error.message : "Internal server error"

      return NextResponse.json(createAPIResponse(null, errorMessage, false), { status: 500 })
    }
  }
}

export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === "string" && data[field].trim() === "")) {
      return `Field '${field}' is required`
    }
  }
  return null
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

export async function withCORS(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(),
    })
  }

  const response = await handler(request)

  // Add CORS headers to the response
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
