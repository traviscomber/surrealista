import { type NextRequest, NextResponse } from "next/server"

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"

function oauthErrorHtml(message: string) {
  const safeMessage = JSON.stringify(message)
  return `
    <html>
      <body>
        <script>
          window.opener?.postMessage({ type: 'oauth-error', error: ${safeMessage} }, window.location.origin);
          window.close();
        </script>
        <p>${message}</p>
      </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return new NextResponse(oauthErrorHtml("Google Drive no está configurado en este entorno. La integración es opcional."), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const redirectUri = new URL("/api/auth/google", request.url).toString()

  if (error) {
    return new NextResponse(oauthErrorHtml(`Google rechazó la autorización: ${error}`), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  if (!code) {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", DRIVE_SCOPE)
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")

    return NextResponse.redirect(authUrl)
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

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      const reason = tokenData.error_description || tokenData.error || `HTTP ${tokenResponse.status}`
      return new NextResponse(oauthErrorHtml(`No se pudo completar la conexión con Google Drive: ${reason}`), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    const response = new NextResponse(
      `
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'oauth-success' }, window.location.origin);
              window.close();
            </script>
            <p>Google Drive conectado. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    )

    response.cookies.set("google_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Number(tokenData.expires_in) || 3600,
    })

    return response
  } catch (error) {
    console.error("[Google Drive] OAuth flow failed:", error)
    return new NextResponse(oauthErrorHtml("Error del servidor al conectar Google Drive."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }
}
