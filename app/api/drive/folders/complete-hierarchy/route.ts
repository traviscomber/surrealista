import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("google_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    const rootFolderId = "1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F"

    async function fetchFolderHierarchy(folderId: string, depth = 0): Promise<any> {
      if (depth > 10) {
        // Prevent infinite recursion
        console.log("[v0] Max depth reached, stopping recursion")
        return { files: [], folders: [] }
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
          `q=parents in "${folderId}"&` +
          `fields=files(id,name,mimeType,size,modifiedTime,parents,webViewLink)&` +
          `orderBy=folder,name`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (!response.ok) {
        console.log(`[v0] Failed to fetch folder ${folderId}:`, await response.text())
        return { files: [], folders: [] }
      }

      const data = await response.json()
      const items = data.files || []

      const folders = []
      const files = []

      for (const item of items) {
        if (item.mimeType === "application/vnd.google-apps.folder") {
          console.log(`[v0] Processing folder: ${item.name} (depth: ${depth})`)
          // Recursively fetch subfolder contents
          const subContents = await fetchFolderHierarchy(item.id, depth + 1)
          folders.push({
            ...item,
            contents: subContents,
          })
        } else {
          files.push(item)
        }
      }

      return { files, folders }
    }

    console.log("[v0] Starting complete hierarchy fetch...")
    const hierarchy = await fetchFolderHierarchy(rootFolderId)

    console.log(
      `[v0] Complete hierarchy fetched: ${hierarchy.folders.length} root folders, ${hierarchy.files.length} root files`,
    )

    return NextResponse.json({
      rootFolderId,
      hierarchy,
    })
  } catch (error) {
    console.log("[v0] Server error fetching complete hierarchy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
