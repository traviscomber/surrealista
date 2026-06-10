import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileSize, mimeType, totalChunks } = body

    if (!fileName || fileSize === undefined || totalChunks === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 500MB)" },
        { status: 413 }
      )
    }

    const uploadId = uuidv4()

    return NextResponse.json({ uploadId })
  } catch (error) {
    console.error("[v0] Upload init error:", error)
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    )
  }
}
