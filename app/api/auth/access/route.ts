import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "sur_realista_access"
const SESSION_SECONDS = 8 * 60 * 60

function getConfiguredPassword() {
  return process.env.APP_PASSWORD?.trim() || ""
}

function createAccessToken(password: string) {
  return createHash("sha256").update(`sur-realista:${password}`).digest("hex")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export async function POST(request: NextRequest) {
  const configuredPassword = getConfiguredPassword()

  if (!configuredPassword) {
    console.error("APP_PASSWORD is not configured")
    return NextResponse.json(
      { error: "El acceso interno no está configurado. Contacta al administrador." },
      { status: 503 },
    )
  }

  let password = ""

  try {
    const body = await request.json()
    password = typeof body?.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
  }

  if (!password || !safeEqual(password, configuredPassword)) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: createAccessToken(configuredPassword),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })

  return response
}
