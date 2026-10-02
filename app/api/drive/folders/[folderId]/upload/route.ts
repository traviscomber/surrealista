import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

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
  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido." }, { status: 400 })
  if (file.size <= 0 || file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo debe pesar entre 1 byte y 25 MB." }, { status: 400 })
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
  }

  const boundary = `surrealista-${crypto.randomUUID()}`
  const encoder = new TextEncoder()
  const prefix = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
  )
  const suffix = encoder.encode(`\r\n--${boundary}--`)
  const bytes = new Uint8Array(prefix.length + file.size + suffix.length)
  bytes.set(prefix, 0)
  bytes.set(new Uint8Array(await file.arrayBuffer()), prefix.length)
  bytes.set(suffix, prefix.length + file.size)

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,parents,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: bytes,
      cache: "no-store",
    },
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error("[Google Drive] upload failed", response.status)
    return NextResponse.json({ error: "No se pudo subir el archivo a Google Drive." }, { status: response.status })
  }

  return NextResponse.json({ file: data })
}
