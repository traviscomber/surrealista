import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim()
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim()
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret || !rootFolderId) {
      return NextResponse.json(
        {
          error: "Google Drive no está configurado en este entorno.",
          code: "DRIVE_NOT_CONFIGURED",
          optional: true,
        },
        { status: 503 },
      )
    }

    const accessToken = request.cookies.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive no está conectado.", code: "DRIVE_NOT_CONNECTED", optional: true },
        { status: 401 },
      )
    }

    const params = new URLSearchParams({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name,modifiedTime,webViewLink)",
      pageSize: "1000",
    })

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[Google Drive] Folder listing failed:", response.status, errorData)
      return NextResponse.json(
        { error: "No se pudieron leer las carpetas de Google Drive.", code: "DRIVE_API_ERROR" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ files: data.files || [], rootFolderId })
  } catch (error) {
    console.error("[Google Drive] Server error fetching folders:", error)
    return NextResponse.json({ error: "Error interno consultando Google Drive." }, { status: 500 })
  }
}
