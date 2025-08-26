import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    const folderId = "1DedwoHB3BOHqIIiIGEqZqt0qCCjuVMn2"

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
      console.log("[v0] Google Drive API error:", errorData)
      return NextResponse.json({ error: "Failed to fetch folders", details: errorData }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Successfully fetched", data.files?.length || 0, "items from Google Drive folder")

    const processedData = {
      ...data,
      folderAnalysis: {
        totalItems: data.files?.length || 0,
        folders: data.files?.filter((f: any) => f.mimeType === "application/vnd.google-apps.folder").length || 0,
        documents:
          data.files?.filter((f: any) => f.mimeType.includes("pdf") || f.mimeType.includes("document")).length || 0,
        images: data.files?.filter((f: any) => f.mimeType.includes("image")).length || 0,
        other:
          data.files?.filter(
            (f: any) =>
              !f.mimeType.includes("folder") &&
              !f.mimeType.includes("pdf") &&
              !f.mimeType.includes("document") &&
              !f.mimeType.includes("image"),
          ).length || 0,
      },
    }

    return NextResponse.json(processedData)
  } catch (error) {
    console.log("[v0] Server error fetching folders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
