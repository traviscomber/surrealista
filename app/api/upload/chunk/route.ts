import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = "/tmp/uploads"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const uploadId = formData.get("uploadId") as string
    const chunkIndex = formData.get("chunkIndex") as string
    const totalChunks = formData.get("totalChunks") as string
    const chunk = formData.get("chunk") as File

    if (!uploadId || !chunkIndex || !chunk) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Crear directorio de upload si no existe
    const uploadPath = join(UPLOAD_DIR, uploadId)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Convertir chunk a buffer y guardar
    const buffer = await chunk.arrayBuffer()
    const chunkPath = join(uploadPath, `chunk-${chunkIndex}`)
    await writeFile(chunkPath, Buffer.from(buffer))

    return NextResponse.json({
      success: true,
      chunkIndex: parseInt(chunkIndex),
      totalChunks: parseInt(totalChunks),
    })
  } catch (error) {
    console.error("[v0] Chunk upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload chunk" },
      { status: 500 }
    )
  }
}
