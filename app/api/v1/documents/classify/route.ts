import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const classification = await classifyDocument(file)

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        file_type: file.type,
        file_size: file.size,
        classification: classification.category,
        suggested_folder: classification.folder,
        confidence_score: classification.confidence,
        metadata: classification.metadata,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      document: data,
      classification,
    })
  } catch (error) {
    console.error("Classification error:", error)
    return NextResponse.json({ error: "Failed to classify document" }, { status: 500 })
  }
}

async function classifyDocument(file: File) {
  const fileName = file.name.toLowerCase()
  const fileType = file.type

  let category = "unknown"
  let folder = "5_PDF_SUELTO"
  let confidence = 0.5
  let metadata = {}

  // Document type classification
  if (fileName.includes("escritura") || fileName.includes("titulo")) {
    category = "legal_document"
    folder = "2_DOCUMENTOS/a_Antecedentes"
    confidence = 0.9
  } else if (fileName.includes("contrato") || fileName.includes("promesa")) {
    category = "commercial_document"
    folder = "2_DOCUMENTOS/c_Comerciales"
    confidence = 0.9
  } else if (fileName.includes("avaluo") || fileName.includes("tasacion")) {
    category = "valuation_document"
    folder = "2_DOCUMENTOS/b_Tasacion"
    confidence = 0.9
  } else if (fileType.startsWith("image/")) {
    category = "photo"
    folder = "1_FOTOS"
    confidence = 0.8
  } else if (fileType.startsWith("video/")) {
    category = "video"
    folder = "4_MARKETING"
    confidence = 0.8
  } else if (fileName.includes(".kmz") || fileName.includes(".kml")) {
    category = "location_file"
    folder = "6_KMZ_SUELTO"
    confidence = 0.9
  }

  // Extract ROL if present
  const rolMatch = fileName.match(/\b\d{1,5}-\d{1,3}\b/)
  if (rolMatch) {
    metadata = { ...metadata, rol: rolMatch[0] }
    confidence += 0.1
  }

  return {
    category,
    folder,
    confidence: Math.min(confidence, 1.0),
    metadata,
  }
}
