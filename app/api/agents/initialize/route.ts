import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Define the 4 core agents
    const agents = [
      {
        name: "Folder Agent",
        role: "folder_organizer",
        description: "Organización y estructura de carpetas según estándar Sur-Realista de 6 categorías",
        capabilities: ["folder_analysis", "structure_validation", "organization_recommendations", "compliance_scoring"],
        model: "gpt-4",
        status: "active",
        parameters: {
          temperature: 0.3,
          max_tokens: 2000,
          standard_categories: [
            "1_FOTOS",
            "2_DOCUMENTOS",
            "3_COMUNICACIONES",
            "4_MARKETING",
            "5_PDF_SUELTO",
            "6_KMZ_SUELTO",
          ],
        },
        success_rate: 0.92,
      },
      {
        name: "Document Agent",
        role: "document_classifier",
        description: "Clasificación inteligente de documentos en categorías predefinidas",
        capabilities: ["document_classification", "content_analysis", "metadata_extraction", "category_suggestion"],
        model: "gpt-4",
        status: "active",
        parameters: {
          temperature: 0.2,
          max_tokens: 1500,
          document_types: ["legal", "financial", "marketing", "photos", "communications", "other"],
        },
        success_rate: 0.88,
      },
      {
        name: "Extraction Agent",
        role: "data_extractor",
        description: "OCR y extracción de datos de documentos (ROL, fechas, montos)",
        capabilities: [
          "ocr_processing",
          "rol_extraction",
          "date_extraction",
          "amount_extraction",
          "parallel_processing",
        ],
        model: "gpt-4-vision",
        status: "active",
        parameters: {
          temperature: 0.1,
          max_tokens: 2500,
          extraction_patterns: {
            rol_pattern: "\\d{3,4}-\\d{4}-[A-Z]",
            date_formats: ["YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY"],
            currency_symbols: ["$", "CLP", "USD", "UF"],
          },
        },
        success_rate: 0.9,
      },
      {
        name: "Validation Agent",
        role: "compliance_validator",
        description: "Validación de estándares PARA y estructura de 6 categorías",
        capabilities: [
          "structure_validation",
          "naming_validation",
          "content_validation",
          "metadata_validation",
          "issue_detection",
        ],
        model: "gpt-4",
        status: "active",
        parameters: {
          temperature: 0.2,
          max_tokens: 2000,
          validation_rules: {
            required_folders: [
              "1_FOTOS",
              "2_DOCUMENTOS",
              "3_COMUNICACIONES",
              "4_MARKETING",
              "5_PDF_SUELTO",
              "6_KMZ_SUELTO",
            ],
            naming_convention: "YYYY-MM-DD_description",
            severity_levels: {
              error: [8, 9, 10],
              warning: [4, 5, 6, 7],
              info: [1, 2, 3],
            },
          },
        },
        success_rate: 0.95,
      },
    ]

    // Delete existing agents with these names to avoid duplicates
    const agentNames = agents.map((a) => a.name)
    await supabase.from("ai_agents").delete().in("name", agentNames)

    // Insert the agents
    const { data, error } = await supabase.from("ai_agents").insert(agents).select()

    if (error) {
      console.error("[v0] Error inserting agents:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      agents: data,
      message: `${data?.length || 0} agentes inicializados exitosamente`,
    })
  } catch (error) {
    console.error("[v0] Error initializing agents:", error)
    return NextResponse.json({ error: "Failed to initialize agents", details: error }, { status: 500 })
  }
}
