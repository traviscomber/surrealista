import { NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { updateSession } from "@/lib/supabase/middleware"

const RETIRED_PRODUCT_PREFIXES = [
  "/clientes",
  "/gestion-clientes",
  "/gestion-tareas",
  "/tareas",
  "/comunicaciones",
  "/asistente-ia",
  "/ai",
  "/admin/agentes",
  "/admin/tags",
  "/admin/google-drive",
  "/admin/operaciones-comerciales",
]

function isRetiredProductPath(pathname: string) {
  return RETIRED_PRODUCT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isPublicApiPath(pathname: string) {
  return (
    pathname === "/api/internal-access" ||
    pathname === "/api/auth/google" ||
    pathname.startsWith("/api/cron/")
  )
}

function isPublicPagePath(pathname: string) {
  return pathname === "/" || pathname === "/ayuda" || pathname.startsWith("/ayuda/") || pathname === "/docs" || pathname.startsWith("/docs/")
}

function isPrivilegedPath(pathname: string) {
  if (pathname.startsWith("/api/")) return !isPublicApiPath(pathname)
  return !isPublicPagePath(pathname)
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    },
  )
}

export async function middleware(request: NextRequest) {
  if (isPrivilegedPath(request.nextUrl.pathname)) {
    const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
    const authorized = await verifyInternalAccessToken(token)

    if (!authorized) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return unauthorizedResponse()
      }

      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Keep unfinished/empty modules out of the sellable product surface.
  // Their code remains available for future completion, but authenticated users
  // are sent back to the proven operational workspace instead of seeing smoke.
  if (isRetiredProductPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/campos"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === "/api/cotizador/valuar") {
    const url = request.nextUrl.clone()
    url.pathname = "/api/cotizador/valuar-canonico"
    return NextResponse.rewrite(url)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
    "/api/:path*",
  ],
}
