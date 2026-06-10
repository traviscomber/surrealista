import { NextRequest, NextResponse } from "next/server"
import { readFile, rm, copyFile } from "fs/promises"
import { join } from "path"
import { existsSync, readdirSync } from "fs"

const UPLOAD_DIR = "/tmp/uploads"
const FINAL_UPLOAD_DIR = "/tmp/final-uploads"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uploadId, fileName, fileSize } = body

    if (!uploadId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const uploadPath = join(UPLOAD_DIR, uploadId)

    // Verificar que todos los chunks existen
    if (!existsSync(uploadPath)) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 }
      )
    }

    const chunks = readdirSync(uploadPath)
      .filter((f) => f.startsWith("chunk-"))
      .sort((a, b) => {
        const numA = parseInt(a.split("-")[1])
        const numB = parseInt(b.split("-")[1])
        return numA - numB
      })

    // Ensamblar archivo
    const buffers: Buffer[] = []
    for (const chunk of chunks) {
      const chunkPath = join(uploadPath, chunk)
      const buffer = await readFile(chunkPath)
      buffers.push(buffer)
    }

    const finalBuffer = Buffer.concat(buffers)

    // Guardar archivo final
    const finalPath = join(FINAL_UPLOAD_DIR, uploadId, fileName)
    if (!existsSync(FINAL_UPLOAD_DIR)) {
      await import("fs").then((fs) =>
        fs.promises.mkdir(join(FINAL_UPLOAD_DIR, uploadId), { recursive: true })
      )
    }

    await import("fs").then((fs) =>
      fs.promises.writeFile(finalPath, finalBuffer)
    )

    // Limpiar chunks temporales
    await rm(uploadPath, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      fileId: uploadId,
      fileName,
      fileSize: finalBuffer.length,
      url: `/uploads/${uploadId}/${fileName}`,
    })
  } catch (error) {
    console.error("[v0] Finalize error:", error)
    return NextResponse.json(
      { error: "Failed to finalize upload" },
      { status: 500 }
    )
  }
}
