import { createClient } from "@/lib/supabase/server"
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
    console.log(requestId, "[v0] Upload API POST called")

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

    // Validation: File size
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      const errorMsg = `Archivo demasiado grande. Máximo 100MB, recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      console.error(requestId, "[v0]", errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Validation: File type
    const allowedExtensions = [".pdf", ".doc", ".docx", ".kmz", ".kml", ".pptx", ".ppt", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      const errorMsg = `Tipo de archivo no permitido: ${fileExtension}. Permitidos: ${allowedExtensions.join(", ")}`
      console.error(requestId, "[v0]", errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Create Supabase client
    let supabase
    try {
      console.log(requestId, "[v0] Creating Supabase client...")
      supabase = await createClient()
      console.log(requestId, "[v0] Supabase client created successfully")
    } catch (clientError: any) {
      console.error(requestId, "[v0] Error creating Supabase client:", {
        message: clientError?.message,
        error: clientError,
      })
      return NextResponse.json(
        { 
          error: "No se pudo conectar al servicio de almacenamiento. Por favor, verifica tu conexión e intenta nuevamente.",
          code: "SUPABASE_CLIENT_ERROR"
        },
        { status: 503 }
      )
    }

    const sanitizeFileName = (name: string): string => {
      const normalized = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/Ñ/g, "N")
        .replace(/[^a-zA-Z0-9._-]/g, "_")

      return normalized
    }

    const timestamp = Date.now()
    const sanitizedFileName = sanitizeFileName(file.name)
    const fileName = `${timestamp}-${sanitizedFileName}`
    const filePath = `documents/${fileName}`

    console.log(requestId, "[v0] File path for storage:", filePath)

    // Convert file to buffer
    let buffer: ArrayBuffer
    try {
      buffer = await file.arrayBuffer()
      console.log(requestId, "[v0] File converted to buffer, size:", buffer.byteLength, "bytes")
    } catch (bufferError: any) {
      console.error(requestId, "[v0] Error converting file to buffer:", bufferError?.message)
      return NextResponse.json(
        { error: "Error al procesar el archivo. Intenta con otro archivo." },
        { status: 500 }
      )
    }

    const USE_SIGNED_UPLOAD_THRESHOLD = 4 * 1024 * 1024 // 4MB

    try {
      if (file.size < USE_SIGNED_UPLOAD_THRESHOLD) {
        console.log(requestId, "[v0] Using standard upload for small file (<4MB)")

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          })

        if (uploadError) {
          console.error(requestId, "[v0] Supabase storage upload error:", {
            message: uploadError.message,
            status: uploadError.status,
            statusCode: (uploadError as any).statusCode,
          })
          return NextResponse.json(
            { 
              error: `Error al guardar el archivo en el servidor: ${uploadError.message}`,
              code: "STORAGE_UPLOAD_ERROR"
            },
            { status: 500 }
          )
        }

        console.log(requestId, "[v0] File uploaded successfully to Supabase, getting public URL...")
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

        console.log(requestId, "[v0] Upload complete, public URL:", urlData.publicUrl)

        return NextResponse.json(
          {
            url: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: fileExtension.replace(".", ""),
            message: "Archivo cargado exitosamente"
          },
          { status: 200 }
        )
      } else {
        // For larger files, use signed URL
        console.log(requestId, "[v0] Using signed URL for large file (>4MB)")

        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from("documents")
          .createSignedUploadUrl(filePath)

        if (signedError || !signedUrlData) {
          console.error(requestId, "[v0] Error creating signed URL:", signedError?.message)
          return NextResponse.json(
            { 
              error: "No se pudo crear URL de subida firmada. Intenta nuevamente.",
              code: "SIGNED_URL_ERROR"
            },
            { status: 500 }
          )
        }

        console.log(requestId, "[v0] Signed URL created, uploading file...")

        const uploadResponse = await fetch(signedUrlData.signedUrl, {
          method: "PUT",
          body: buffer,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "x-upsert": "false",
          },
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error(requestId, "[v0] Signed URL upload failed:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText,
          })
          return NextResponse.json(
            { 
              error: `Error al subir archivo grande: ${uploadResponse.statusText}`,
              code: "SIGNED_UPLOAD_ERROR"
            },
            { status: uploadResponse.status }
          )
        }

        console.log(requestId, "[v0] Signed URL upload successful, getting public URL...")
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

        console.log(requestId, "[v0] Upload complete, public URL:", urlData.publicUrl)

        return NextResponse.json(
          {
            url: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: fileExtension.replace(".", ""),
            message: "Archivo cargado exitosamente"
          },
          { status: 200 }
        )
      }
    } catch (uploadException: any) {
      console.error(requestId, "[v0] Upload exception:", {
        message: uploadException?.message || String(uploadException),
        name: uploadException?.name,
        stack: uploadException?.stack?.split("\n").slice(0, 3),
      })
      return NextResponse.json(
        { 
          error: `Error al subir archivo: ${uploadException?.message || "Error desconocido"}`,
          code: "UPLOAD_EXCEPTION"
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error(requestId, "[v0] Unexpected error in upload API:", {
      message: error?.message || String(error),
      name: error?.name,
      code: error?.code,
      stack: error?.stack?.split("\n").slice(0, 3),
    })
    return NextResponse.json(
      { 
        error: "Error inesperado al procesar tu solicitud. Por favor intenta nuevamente.",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    )
  }
}
