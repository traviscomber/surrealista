import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { folderId: string } }) {
  try {
    const accessToken = request.cookies.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    const { folderId } = params

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        `q=parents in "${folderId}"&` +
        `fields=files(id,name,mimeType,size,modifiedTime,webViewLink,parents)&` +
        `pageSize=1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.log("[v0] Google Drive API error for folder:", folderId, errorData)
      return NextResponse.json(
        { error: "Failed to fetch folder contents", details: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Successfully fetched", data.files?.length || 0, "items from subfolder:", folderId)

    return NextResponse.json(data)
  } catch (error) {
    console.log("[v0] Server error fetching folder contents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
