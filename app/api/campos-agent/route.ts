import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { streamCAMPOSAgent, type CAMPOSAgentContext } from "@/app/actions/campos-agent"
import { createServerClient } from "@/lib/core/database/supabase"

export const runtime = "nodejs"

const MAX_BODY_BYTES = 64_000
const MAX_MESSAGE_LENGTH = 4_000

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.trim()
  return cleaned ? cleaned.slice(0, maxLength) : null
}

function sanitizeContext(value: unknown): CAMPOSAgentContext | undefined {
  if (!value || typeof value !== "object") return undefined
  const context = value as Record<string, unknown>

  return {
    title: cleanText(context.title, 300),
    role: cleanText(context.role, 120),
    commune: cleanText(context.commune, 200),
    area: cleanText(context.area, 120),
    latitude: cleanText(context.latitude, 80),
    longitude: cleanText(context.longitude, 80),
    sections: Array.isArray(context.sections)
      ? context.sections
          .filter((item): item is string => typeof item === "string")
          .slice(0, 20)
          .map((item) => item.trim().slice(0, 120))
          .filter(Boolean)
      : undefined,
    text: cleanText(context.text, 8_000),
    source: cleanText(context.source, 300),
    capturedAt: cleanText(context.capturedAt, 120),
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentLength = Number(request.headers.get("content-length") || 0)
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 })
    }

    const body = await request.json()
    const message = cleanText(body?.message, MAX_MESSAGE_LENGTH) || ""
    const context = sanitizeContext(body?.context)

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }

    return await streamCAMPOSAgent(message, context)
  } catch (error) {
    console.error("CAMPOS agent route error", error)
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 })
  }
}
