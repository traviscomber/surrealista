import { NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { updateSession } from "@/lib/supabase/middleware"

function isPublicApiPath(pathname: string) {
  return (
    pathname === "/api/internal-access" ||
    pathname.startsWith("/api/auth/") ||
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

export async function middleware(request: NextRequest) {
  if (isPrivilegedPath(request.nextUrl.pathname)) {
    const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
    const authorized = await verifyInternalAccessToken(token)

    if (!authorized) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
    "/api/:path*",
  ],
}
