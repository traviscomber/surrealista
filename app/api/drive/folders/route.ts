import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    const folderId = "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F"
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        `q=parents in "${folderId}" and mimeType="application/vnd.google-apps.folder"&` +
        `fields=files(id,name,modifiedTime,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.log("[v0] Google Drive API error:", errorData)
      return NextResponse.json({ error: "Failed to fetch folders", details: errorData }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Successfully fetched", data.files?.length || 0, "folders from Google Drive")

    return NextResponse.json(data)
  } catch (error) {
    console.log("[v0] Server error fetching folders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
