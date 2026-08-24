import { NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { updateSession } from "@/lib/supabase/middleware"

function isPrivilegedPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/campos" ||
    pathname.startsWith("/campos/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/kmz/ciren-context" ||
    pathname === "/api/kmz/ciren-neighbors"
  )
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
    "/api/admin/:path*",
    "/api/kmz/ciren-context",
    "/api/kmz/ciren-neighbors",
  ],
}
