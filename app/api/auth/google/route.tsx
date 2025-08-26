import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  console.log("[v0] OAuth route accessed:", { code: !!code, error, url: request.url })

  if (error) {
    console.log("[v0] OAuth error:", error)
    return NextResponse.redirect(new URL("/?auth=error", request.url))
  }

  if (!code) {
    const clientId = "873991779919-dold9vq3nsl8qoeqfuibmjj5kjctqah1.apps.googleusercontent.com"
    const redirectUri = new URL("/api/auth/google", request.url).toString()
    const scope = "https://www.googleapis.com/auth/drive.readonly"

    console.log("[v0] Redirecting to Google OAuth with URI:", redirectUri)

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`

    return NextResponse.redirect(authUrl)
  }

  try {
    const clientId = "873991779919-dold9vq3nsl8qoeqfuibmjj5kjctqah1.apps.googleusercontent.com"
    const clientSecret = "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"
    const redirectUri = new URL("/api/auth/google", request.url).toString()

    console.log("[v0] Exchanging code for token with redirect URI:", redirectUri)

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.log("[v0] Token exchange error:", tokenData.error)
      return new NextResponse(
        `
        <html>
          <body>
            <script>
              console.log("[v0] Sending oauth-error message to parent");
              window.opener?.postMessage({ type: 'oauth-error', error: '${tokenData.error}' }, window.location.origin);
              window.close();
            </script>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
        </html>
      `,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    console.log("[v0] OAuth successful, access token obtained")

    const response = new NextResponse(
      `
      <html>
        <body>
          <script>
            console.log("[v0] Sending oauth-success message to parent");
            window.opener?.postMessage({ type: 'oauth-success' }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          </script>
          <p>Authentication successful! This window will close automatically.</p>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )

    response.cookies.set("google_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
    })

    if (tokenData.refresh_token) {
      response.cookies.set("google_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    return response
  } catch (error) {
    console.log("[v0] OAuth flow error:", error)
    return new NextResponse(
      `
      <html>
        <body>
          <script>
            console.log("[v0] Sending oauth-error message to parent");
            window.opener?.postMessage({ type: 'oauth-error', error: 'server_error' }, window.location.origin);
            window.close();
          </script>
          <p>Server error occurred. This window will close automatically.</p>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
