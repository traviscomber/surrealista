import { randomBytes, timingSafeEqual } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"
const OAUTH_STATE_COOKIE = "google_oauth_state"
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "private, no-store",
  "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function safeScriptString(value: string) {
  return JSON.stringify(value).replaceAll("<", "\\u003c")
}

function popupHtml(type: "oauth-error" | "oauth-success", message: string) {
  const safeMessage = safeScriptString(message)
  const safeType = safeScriptString(type)

  return `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Google Drive</title></head>
  <body>
    <script>
      window.opener?.postMessage({ type: ${safeType}, message: ${safeMessage}, error: ${safeMessage} }, window.location.origin);
      window.close();
    </script>
    <p>${escapeHtml(message)}</p>
  </body>
</html>`
}

function htmlResponse(type: "oauth-error" | "oauth-success", message: string, status = 200) {
  return new NextResponse(popupHtml(type, message), { status, headers: HTML_HEADERS })
}

function clearOAuthState(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 0,
  })
  return response
}

function statesMatch(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer)
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return htmlResponse("oauth-error", "Google Drive no está configurado en este entorno. La integración es opcional.", 503)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const receivedState = searchParams.get("state")
  const redirectUri = new URL("/api/auth/google", request.url).toString()
  const isCallback = Boolean(code || error)

  if (!isCallback) {
    const state = randomBytes(32).toString("hex")
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", DRIVE_SCOPE)
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")
    authUrl.searchParams.set("state", state)

    const response = NextResponse.redirect(authUrl)
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    })
    return response
  }

  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  if (!statesMatch(receivedState, expectedState)) {
    return clearOAuthState(htmlResponse("oauth-error", "La sesión de autorización de Google no es válida o expiró.", 400))
  }

  if (error) {
    return clearOAuthState(htmlResponse("oauth-error", "Google rechazó o canceló la autorización.", 400))
  }

  if (!code) {
    return clearOAuthState(htmlResponse("oauth-error", "La respuesta de Google no incluyó un código de autorización.", 400))
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    })

    const tokenData: unknown = await tokenResponse.json().catch(() => null)
    const tokenRecord = tokenData && typeof tokenData === "object" && !Array.isArray(tokenData)
      ? (tokenData as Record<string, unknown>)
      : null
    const accessToken = typeof tokenRecord?.access_token === "string" ? tokenRecord.access_token : null
    const expiresIn = typeof tokenRecord?.expires_in === "number" && Number.isFinite(tokenRecord.expires_in)
      ? Math.max(60, Math.floor(tokenRecord.expires_in))
      : 3600

    if (!tokenResponse.ok || !accessToken) {
      console.error("[Google Drive] OAuth token exchange failed", { status: tokenResponse.status })
      return clearOAuthState(htmlResponse("oauth-error", "No se pudo completar la conexión con Google Drive.", 400))
    }

    const response = htmlResponse("oauth-success", "Google Drive conectado. Esta ventana se cerrará automáticamente.")
    response.cookies.set("google_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
    })

    return clearOAuthState(response)
  } catch (error) {
    console.error("[Google Drive] OAuth flow failed:", error)
    return clearOAuthState(htmlResponse("oauth-error", "Error del servidor al conectar Google Drive.", 500))
  }
}
