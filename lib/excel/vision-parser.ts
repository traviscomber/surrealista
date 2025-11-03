"use server"

import { generateText } from "ai"

export interface VisionParseResult {
  success: boolean
  data: any[]
  error?: string
  rawText?: string
}

export async function parseExcelWithVision(imageBase64: string): Promise<VisionParseResult> {
  try {
    console.log("[v0] Starting Vision-based Excel parsing...")

    const { text } = await generateText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza esta imagen de una hoja de Excel con datos de clientes. Extrae TODOS los datos en formato JSON.

Estructura esperada para cada cliente:
{
  "first_name": "nombre",
  "last_name": "apellido paterno",
  "second_last_name": "apellido materno",
  "rut": "RUT",
  "email": "email",
  "phone": "teléfono",
  "mobile": "celular",
  "company_name": "empresa",
  "position": "cargo",
  "address": "dirección",
  "city": "ciudad",
  "region": "región",
  "country": "país",
  "notes": "notas"
}

IMPORTANTE:
- Extrae TODOS los clientes que veas en la imagen
- Si un campo está vacío, omítelo del JSON
- Devuelve un array JSON con todos los clientes
- NO agregues texto adicional, solo el JSON
- Si hay múltiples filas, devuelve múltiples objetos en el array`,
            },
            {
              type: "image",
              image: imageBase64,
            },
          ],
        },
      ],
    })

    console.log("[v0] Vision API response:", text)

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return {
        success: false,
        error: "No se pudo extraer datos JSON de la respuesta",
        rawText: text,
      }
    }

    const data = JSON.parse(jsonMatch[0])

    console.log("[v0] Parsed data from vision:", data)

    return {
      success: true,
      data,
      rawText: text,
    }
  } catch (error) {
    console.error("[v0] Error in vision parsing:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
