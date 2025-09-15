import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id

    const { data: document, error } = await supabase.from("documents").select("*").eq("id", documentId).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const analysis = await analyzeDocumentWithAI(document)

    await supabase
      .from("documents")
      .update({
        content_analysis: analysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}

async function analyzeDocumentWithAI(document: any) {
  const analysis = {
    document_type: document.classification || "unknown",
    key_information: [],
    entities: [],
    confidence: 0.8,
    summary: "",
    recommendations: [],
  }

  // Extract key information based on document type
  if (document.classification === "legal_document") {
    analysis.key_information = [
      "ROL de avalúo",
      "Propietario registrado",
      "Fecha de inscripción",
      "Superficie del terreno",
    ]
    analysis.summary = "Documento legal que establece la propiedad del inmueble"
    analysis.recommendations = ["Verificar vigencia del documento", "Confirmar datos con Conservador de Bienes Raíces"]
  } else if (document.classification === "commercial_document") {
    analysis.key_information = ["Precio de venta", "Condiciones de pago", "Fecha de entrega", "Garantías incluidas"]
    analysis.summary = "Documento comercial para transacción inmobiliaria"
    analysis.recommendations = ["Revisar cláusulas especiales", "Verificar documentos de respaldo"]
  }

  return analysis
}
