import { NextRequest, NextResponse } from "next/server"
import {
  createInternalAccessToken,
  INTERNAL_ACCESS_COOKIE,
  INTERNAL_ACCESS_MAX_AGE_SECONDS,
  INTERNAL_OPERATOR,
  verifyInternalAccessToken,
} from "@/lib/auth/internal-access"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  const authorized = await verifyInternalAccessToken(token)
  return NextResponse.json(
    { authorized, operator: authorized ? INTERNAL_OPERATOR : null },
    { status: authorized ? 200 : 401 },
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const password = typeof body?.password === "string" ? body.password : ""

  try {
    const token = await createInternalAccessToken(password)
    if (!token) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, operator: INTERNAL_OPERATOR })
    response.cookies.set(INTERNAL_ACCESS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: INTERNAL_ACCESS_MAX_AGE_SECONDS,
    })
    return response
  } catch (error) {
    console.error("[internal-access] failed to create server session", error)
    return NextResponse.json({ error: "Internal access unavailable" }, { status: 503 })
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
  return response
}
