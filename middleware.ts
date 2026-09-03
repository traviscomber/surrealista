import { NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { updateSession } from "@/lib/supabase/middleware"

const RETIRED_PRODUCT_PREFIXES = [
  "/asistente-ia",
  "/ai",
  "/admin/agentes",
  "/admin/ia-workspace",
  "/admin/tags",
  "/admin/google-drive",
  "/admin/operaciones-comerciales",
]

const CANONICAL_PRODUCT_ROUTES = [
  { prefix: "/admin/clientes", destination: "/clientes", preserveSuffix: true },
  { prefix: "/gestion-clientes", destination: "/clientes", preserveSuffix: true },
  { prefix: "/admin/mensajes", destination: "/comunicaciones", preserveSuffix: false },
  { prefix: "/nueva-tarea", destination: "/gestion-tareas", preserveSuffix: false },
]

function isRetiredProductPath(pathname: string) {
  return RETIRED_PRODUCT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function getCanonicalProductPath(pathname: string) {
  const route = CANONICAL_PRODUCT_ROUTES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!route) return null

  const suffix = route.preserveSuffix ? pathname.slice(route.prefix.length) : ""
  return `${route.destination}${suffix}`
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

  const canonicalProductPath = getCanonicalProductPath(request.nextUrl.pathname)
  if (canonicalProductPath) {
    const url = request.nextUrl.clone()
    url.pathname = canonicalProductPath
    url.search = ""
    return NextResponse.redirect(url)
  }

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
