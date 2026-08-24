import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".kmz",
  ".kml",
  ".zip",
  ".pptx",
  ".ppt",
  ".xlsx",
  ".xls",
  ".jpg",
  ".jpeg",
  ".png",
])

function getStorageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase server environment variables")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Archivo inválido o demasiado grande. Máximo 50MB." }, { status: 400 })
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: `Tipo de archivo no permitido: ${extension}` }, { status: 400 })
    }

    const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
    const storagePath = `documents/${fileName}`
    const buffer = await file.arrayBuffer()
    const supabase = getStorageAdmin()

    const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })
    if (uploadError) {
      console.error("[upload] storage upload failed", uploadError)
      return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 })
    }

    // Kept temporarily for backward compatibility while the documents bucket is migrated to private URLs.
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath)

    return NextResponse.json(
      {
        url: urlData.publicUrl,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: extension.slice(1),
        message: "Archivo cargado exitosamente",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[upload] unexpected error", error)
    return NextResponse.json({ error: "Error inesperado al procesar el archivo" }, { status: 500 })
  }
}
