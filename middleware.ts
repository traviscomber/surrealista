import { updateSession } from "@/lib/supabase/middleware"
import { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Password gate removed — app is open internally.
  // Keep Supabase session refresh for authenticated features.
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
    "/api/admin/:path*",
  ],
}
