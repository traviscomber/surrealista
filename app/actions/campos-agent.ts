"use server"

import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type CAMPOSAgentContext = {
  title?: string | null
  role?: string | null
  owner?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string | null
  source?: string | null
  capturedAt?: string | null
}

const contextBlock = (context?: CAMPOSAgentContext | null) => {
  if (!context?.title) return "No hay un expediente seleccionado actualmente."

  return [
    `Predio: ${context.title}`,
    `ROL: ${context.role || "no disponible"}`,
    `Propietario: ${context.owner || "no disponible"}`,
    `Comuna o sector: ${context.commune || "no disponible"}`,
    `Superficie: ${context.area || "no disponible"}`,
    `Latitud: ${context.latitude || "no disponible"}`,
    `Longitud: ${context.longitude || "no disponible"}`,
    `Secciones detectadas: ${context.sections?.join(", ") || "ninguna"}`,
    context.text ? `Extracto del expediente:\n${context.text.slice(0, 8000)}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function streamCAMPOSAgent(userMessage: string, context?: CAMPOSAgentContext | null) {
  const result = streamText({
    model: "openai/gpt-4-turbo",
    system: `Eres el copiloto territorial experto de CAMPOS, el sistema de inteligencia y gestión de propiedades de Sur Realista.
Responde siempre en español claro, profesional y orientado a decisiones.
Usa primero el expediente activo incluido abajo. Distingue expresamente entre datos confirmados, inferencias y datos faltantes.
No inventes antecedentes legales, registrales, comerciales ni geográficos. Cuando falte evidencia, indícalo y recomienda la verificación concreta necesaria.
Puedes consultar la base de datos CAMPOS mediante herramientas para buscar ROL, regiones, archivos KMZ, estadísticas y documentos vinculados.

EXPEDIENTE ACTIVO
${contextBlock(context)}`,
    prompt: userMessage,
    tools: {
      searchKMZByRegion: tool({
        description: "Buscar archivos KMZ y propiedades por nombre de región",
        inputSchema: z.object({ region: z.string().describe("Nombre de la región") }),
        execute: async ({ region }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("id, file_name, region, placemarks_count, rol_numbers")
            .ilike("region", `%${region}%`)
            .eq("is_active", true)
            .limit(10)
          if (error) throw error
          return { region, results: data, count: data?.length || 0 }
        },
      }),
      getAllRegions: tool({
        description: "Obtener todas las regiones disponibles en CAMPOS",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase.from("kmz_collection").select("region").eq("is_active", true)
          if (error) throw error
          const regions = [...new Set(data?.map((item) => item.region) || [])].filter(Boolean)
          return { regions, totalCount: regions.length }
        },
      }),
      getCAMPOSStatistics: tool({
        description: "Obtener estadísticas generales de archivos, regiones y propiedades CAMPOS",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("placemarks_count, region, rol_numbers")
            .eq("is_active", true)
          if (error) throw error
          const totalFiles = data?.length || 0
          const totalPlacemarks = data?.reduce((sum, item) => sum + (item.placemarks_count || 0), 0) || 0
          const regions = [...new Set(data?.map((item) => item.region) || [])].filter(Boolean)
          const allRoles = new Set(data?.flatMap((item) => item.rol_numbers || []) || [])
          return { totalFiles, totalPlacemarks, totalRegions: regions.length, totalProperties: allRoles.size, regions }
        },
      }),
      searchByROL: tool({
        description: "Buscar propiedades por número de ROL",
        inputSchema: z.object({ rol: z.string().describe("Número de ROL") }),
        execute: async ({ rol }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("id, file_name, region, rol_numbers, placemarks_count, description")
            .contains("rol_numbers", [rol])
            .eq("is_active", true)
          if (error) throw error
          return { rol, results: data, found: (data?.length || 0) > 0 }
        },
      }),
      analyzeGeographicCluster: tool({
        description: "Analizar concentración geográfica de propiedades en una región",
        inputSchema: z.object({ region: z.string().describe("Nombre de la región") }),
        execute: async ({ region }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("file_name, placemarks_count, bounds")
            .ilike("region", `%${region}%`)
            .eq("is_active", true)
          if (error) throw error
          const totalPoints = data?.reduce((sum, item) => sum + (item.placemarks_count || 0), 0) || 0
          const average = data?.length ? Math.round(totalPoints / data.length) : 0
          return {
            region,
            filesInRegion: data?.length || 0,
            totalPlacemarks: totalPoints,
            averagePlacemarksPerFile: average,
            density: totalPoints > 100 ? "alta" : totalPoints > 30 ? "media" : "baja",
          }
        },
      }),
      searchLinkedDocuments: tool({
        description: "Buscar documentos y descripción vinculados a un archivo o predio",
        inputSchema: z.object({ kmzFileName: z.string().describe("Nombre del archivo KMZ o predio") }),
        execute: async ({ kmzFileName }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("id, file_name, description, google_docs_link, rol_numbers, region")
            .ilike("file_name", `%${kmzFileName}%`)
            .eq("is_active", true)
            .limit(10)
          if (error) throw error
          return { kmzFileName, found: (data?.length || 0) > 0, linkedDocuments: data || [] }
        },
      }),
    },
    maxOutputTokens: 2000,
    temperature: 0.35,
  })

  return result.toTextStreamResponse()
}
