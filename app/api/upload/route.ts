import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided in upload request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    })

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Archivo demasiado grande. Máximo 50MB" }, { status: 400 })
    }

    const allowedExtensions = [".pdf", ".doc", ".docx", ".kmz", ".kml", ".pptx", ".ppt", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Solo: ${allowedExtensions.join(", ")}` },
        { status: 400 },
      )
    }

    console.log("[v0] Creating Supabase client...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

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

    console.log("[v0] Uploading to Supabase Storage:", filePath)

    let buffer: ArrayBuffer
    try {
      buffer = await file.arrayBuffer()
      console.log("[v0] File converted to buffer successfully, size:", buffer.byteLength)
    } catch (bufferError: any) {
      console.error("[v0] Error converting file to buffer:", bufferError)
      return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 })
    }

    const USE_SIGNED_UPLOAD_THRESHOLD = 4 * 1024 * 1024 // 4MB

    if (file.size < USE_SIGNED_UPLOAD_THRESHOLD) {
      console.log("[v0] Using standard upload for small file")

      try {
        console.log("[v0] Attempting storage upload to 'documents' bucket...")
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Supabase upload error:", {
            message: uploadError.message,
            status: uploadError.status,
            error: uploadError,
          })
          return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
        }

        console.log("[v0] Upload successful, getting public URL...")
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

        console.log("[v0] Upload complete:", urlData.publicUrl)

        return NextResponse.json({
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: fileExtension.replace(".", ""),
        })
      } catch (uploadException: any) {
        console.error("[v0] Upload exception:", uploadException?.message || String(uploadException))
        return NextResponse.json(
          { error: `Upload error: ${uploadException?.message || "Unknown error"}` },
          { status: 500 },
        )
      }
    } else {
      // For larger files, create a signed upload URL and use fetch directly
      console.log("[v0] Using signed URL for large file upload")

      try {
        // Create a signed upload URL (valid for 60 seconds)
        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from("documents")
          .createSignedUploadUrl(filePath)

        if (signedError || !signedUrlData) {
          console.error("[v0] Error creating signed URL:", signedError?.message)
          return NextResponse.json({ error: "No se pudo crear URL de subida firmada" }, { status: 500 })
        }

        console.log("[v0] Signed URL created, uploading file directly...")

        // Upload directly to the signed URL using PUT
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
          console.error("[v0] Signed URL upload failed:", uploadResponse.status, errorText)
          return NextResponse.json(
            { error: `Error al subir archivo: ${uploadResponse.statusText}` },
            { status: uploadResponse.status },
          )
        }

        console.log("[v0] Signed URL upload successful, getting public URL...")
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

        console.log("[v0] Upload complete:", urlData.publicUrl)

        return NextResponse.json({
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: fileExtension.replace(".", ""),
        })
      } catch (signedException: any) {
        console.error("[v0] Signed upload exception:", signedException?.message || String(signedException))
        return NextResponse.json(
          { error: "Error al subir archivo grande. Verifica la configuración de Storage." },
          { status: 500 },
        )
      }
    }
  } catch (error: any) {
    console.error("[v0] Error in upload API:", error?.message || String(error))
    return NextResponse.json({ error: "Error del servidor al procesar la solicitud" }, { status: 500 })
  }
}
