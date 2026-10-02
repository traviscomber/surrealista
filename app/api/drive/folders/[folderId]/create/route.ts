import { type NextRequest, NextResponse } from "next/server"

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  return origin === new URL(request.url).origin
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })

  const accessToken = request.cookies.get("google_access_token")?.value
  if (!accessToken) return NextResponse.json({ error: "Google Drive no está conectado." }, { status: 401 })

  const { folderId } = await params
  const body = await request.json().catch(() => ({}))
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name || name.length > 180) return NextResponse.json({ error: "Nombre de carpeta inválido." }, { status: 400 })

  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,parents,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [folderId],
    }),
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error("[Google Drive] create folder failed", response.status)
    return NextResponse.json({ error: "No se pudo crear la carpeta en Google Drive." }, { status: response.status })
  }

  return NextResponse.json({ file: data })
}
