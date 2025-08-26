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
        `q=parents in "${folderId}" and (mimeType contains "pdf" or mimeType contains "document")&` +
        `fields=files(id,name,mimeType,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: "Failed to fetch documents", details: errorData }, { status: response.status })
    }

    const data = await response.json()
    const documents = data.files || []

    const rolNumbers: string[] = []
    const rolPatterns = [
      /\b\d{2,4}-\d{3,5}-[A-Z]\b/g, // Format: 140-0001-K
      /\b\d{2,4}-\d{3,5}\b/g, // Format: 140-0001
      /rol[:\s]*(\d{2,4}-\d{3,5})/gi, // Format: rol: 140-0001
      /inscripción[:\s]*(\d{2,4}-\d{3,5})/gi, // Format: inscripción: 140-0001
    ]

    for (const doc of documents) {
      for (const pattern of rolPatterns) {
        const matches = doc.name.match(pattern)
        if (matches) {
          rolNumbers.push(...matches.map((match: string) => match.replace(/^(rol|inscripción)[:\s]*/i, "")))
        }
      }
    }

    // Remove duplicates
    const uniqueRolNumbers = [...new Set(rolNumbers)]

    console.log("[v0] Extracted", uniqueRolNumbers.length, "rol numbers from", documents.length, "documents")

    return NextResponse.json({
      rolNumbers: uniqueRolNumbers,
      documentsAnalyzed: documents.length,
      documents: documents.map((doc: any) => ({
        name: doc.name,
        type: doc.mimeType,
        link: doc.webViewLink,
      })),
    })
  } catch (error) {
    console.log("[v0] Server error extracting rol numbers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
