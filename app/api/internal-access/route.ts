import { NextRequest, NextResponse } from "next/server"
import {
  createInternalAccessToken,
  INTERNAL_ACCESS_COOKIE,
  INTERNAL_ACCESS_MAX_AGE_SECONDS,
  INTERNAL_OPERATOR,
  verifyInternalAccessToken,
} from "@/lib/auth/internal-access"
import {
  checkInternalAccessRateLimit,
  getInternalAccessClientIp,
  hashInternalAccessIdentifier,
  recordInternalAccessAttempt,
} from "@/lib/auth/internal-access-rate-limit"

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  const authorized = await verifyInternalAccessToken(token)
  return noStore(
    NextResponse.json(
      { authorized, operator: authorized ? INTERNAL_OPERATOR : null },
      { status: authorized ? 200 : 401 },
    ),
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password = typeof body?.password === "string" ? body.password : ""

  try {
    const clientIp = getInternalAccessClientIp(request.headers)
    const identifierHash = await hashInternalAccessIdentifier(clientIp)
    const currentLimit = await checkInternalAccessRateLimit(identifierHash)

    if (currentLimit.locked) {
      const response = NextResponse.json({ error: "Too many attempts" }, { status: 429 })
      response.headers.set("Retry-After", String(Math.max(1, currentLimit.retryAfterSeconds)))
      return noStore(response)
    }

    const token = await createInternalAccessToken(password)
    if (!token) {
      const updatedLimit = await recordInternalAccessAttempt(identifierHash, false)
      const status = updatedLimit.locked ? 429 : 401
      const response = NextResponse.json(
        { error: updatedLimit.locked ? "Too many attempts" : "Invalid credentials" },
        { status },
      )
      if (updatedLimit.locked) {
        response.headers.set("Retry-After", String(Math.max(1, updatedLimit.retryAfterSeconds)))
      }
      return noStore(response)
    }

    await recordInternalAccessAttempt(identifierHash, true)

    const response = NextResponse.json({ success: true, operator: INTERNAL_OPERATOR })
    response.cookies.set(INTERNAL_ACCESS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: INTERNAL_ACCESS_MAX_AGE_SECONDS,
    })
    return noStore(response)
  } catch (error) {
    console.error("[internal-access] failed to create server session", error)
    return noStore(NextResponse.json({ error: "Internal access unavailable" }, { status: 503 }))
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(INTERNAL_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
  return noStore(response)
}
