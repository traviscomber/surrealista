import { type NextRequest, NextResponse } from "next/server"

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  return origin === new URL(request.url).origin
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })

  const accessToken = request.cookies.get("google_access_token")?.value
  if (!accessToken) return NextResponse.json({ error: "Google Drive no está conectado." }, { status: 401 })

  const { fileId } = await params
  const body = await request.json().catch(() => ({}))
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 180) return NextResponse.json({ error: "Nombre inválido." }, { status: 400 })

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,parents,webViewLink`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
      cache: "no-store",
    },
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error("[Google Drive] rename failed", response.status)
    return NextResponse.json({ error: "No se pudo renombrar el elemento en Google Drive." }, { status: response.status })
  }

  return NextResponse.json({ file: data })
}
