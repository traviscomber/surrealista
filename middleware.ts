import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for admin routes entirely to improve performance
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - admin routes (they don't need Supabase auth)
     * - api routes (they handle auth separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|admin|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
