import { updateSession } from "@/lib/supabase/middleware"
import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "sur_realista_access"
const PUBLIC_PATHS = ["/acceso", "/ayuda", "/docs"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

async function createAccessToken(password: string) {
  const data = new TextEncoder().encode(`sur-realista:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const accessUrl = new URL("/acceso", request.url)
  accessUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(accessUrl)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname) || pathname === "/api/auth/access") {
    return NextResponse.next()
  }

  const configuredPassword = process.env.APP_PASSWORD?.trim()

  if (!configuredPassword) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acceso interno no configurado." }, { status: 503 })
    }

    const accessUrl = new URL("/acceso", request.url)
    accessUrl.searchParams.set("configurationError", "1")
    return NextResponse.redirect(accessUrl)
  }

  const expectedToken = await createAccessToken(configuredPassword)
  const receivedToken = request.cookies.get(COOKIE_NAME)?.value

  if (!receivedToken || receivedToken !== expectedToken) {
    return unauthorized(request)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
    "/api/admin/:path*",
  ],
}
