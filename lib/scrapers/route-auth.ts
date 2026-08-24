import { type NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"

/**
 * Require the same signed, httpOnly internal session used by the rest of the app.
 * Scraper routes must not accept plaintext site passwords, public env values,
 * or alternate header-based credentials.
 */
export async function validateScraperAccess(req: NextRequest) {
  try {
    const token = req.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
    const authorized = await verifyInternalAccessToken(token)

    if (!authorized) {
      return {
        authorized: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      }
    }

    return { authorized: true }
  } catch (error) {
    console.error("[scraper-auth] validation failed", error)
    return {
      authorized: false,
      response: NextResponse.json({ error: "Authentication unavailable" }, { status: 503 }),
    }
  }
}
