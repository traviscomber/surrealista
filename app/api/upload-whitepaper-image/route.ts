import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

export async function POST(request: NextRequest) {
  const requestId = `[${new Date().toISOString()}]`

  try {
    console.log(requestId, "[v0] Whitepaper image upload API called")

    let formData
    try {
      formData = await request.formData()
      console.log(requestId, "[v0] FormData parsed successfully")
    } catch (formError: any) {
      console.error(requestId, "[v0] Error parsing FormData:", formError?.message)
      return NextResponse.json(
        { error: "Error al procesar la solicitud. Verifica que estés enviando un archivo válido." },
        { status: 400 }
      )
    }

    const file = formData.get("file") as File

    if (!file) {
      console.log(requestId, "[v0] No file provided in upload request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(requestId, "[v0] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    })

    // Validate file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      const errorMsg = `Imagen demasiado grande. Máximo 10MB, recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      console.error(requestId, "[v0]", errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Tipo de archivo no permitido: ${file.type}. Solo imágenes JPG, PNG, WebP`
      console.error(requestId, "[v0]", errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Check environment variable
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(requestId, "[v0] BLOB_READ_WRITE_TOKEN not configured")
      return NextResponse.json(
        {
          error: "Configuración del servidor incompleta. Verifica el token de acceso a almacenamiento.",
          code: "BLOB_TOKEN_ERROR",
        },
        { status: 503 }
      )
    }

    try {
      console.log(requestId, "[v0] Uploading to Vercel Blob:", file.name)
      const blob = await put(`whitepaper-images/${Date.now()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      console.log(requestId, "[v0] Image uploaded successfully to Blob:", blob.url)

      return NextResponse.json(
        {
          url: blob.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          message: "Imagen cargada exitosamente",
        },
        { status: 200 }
      )
    } catch (blobError: any) {
      console.error(requestId, "[v0] Vercel Blob upload error:", {
        message: blobError?.message,
        code: blobError?.code,
      })
      return NextResponse.json(
        {
          error: `Error al guardar imagen: ${blobError?.message || "Error desconocido"}`,
          code: "BLOB_UPLOAD_ERROR",
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(requestId, "[v0] Unexpected error in upload API:", {
      message: error?.message || String(error),
      name: error?.name,
      code: error?.code,
    })
    return NextResponse.json(
      {
        error: "Error inesperado al procesar tu solicitud. Por favor intenta nuevamente.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    )
  }
}
