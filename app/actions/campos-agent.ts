"use server"

import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function streamCAMPOSAgent(userMessage: string) {
  const result = streamText({
    model: "openai/gpt-4-turbo",
    system: `You are an expert AI agent for CAMPOS (property management system). 
You help users understand their property data, KMZ files, regions, and geographic information in Spanish.
You have access to real-time database queries and can provide detailed analysis about properties, regions, and documents.
Always be helpful, specific, and provide actionable insights.`,
    prompt: userMessage,
    tools: {
      searchKMZByRegion: tool({
        description: "Search KMZ files and properties by region name",
        inputSchema: z.object({
          region: z.string().describe("The region name to search"),
        }),
        execute: async ({ region }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("id, file_name, region, placemarks_count, rol_numbers")
            .ilike("region", `%${region}%`)
            .eq("is_active", true)
            .limit(10)

          if (error) throw error
          return {
            region,
            results: data,
            count: data?.length || 0,
          }
        },
      }),

      getAllRegions: tool({
        description: "Get all available regions in the CAMPOS system",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase.from("kmz_collection").select("region").eq("is_active", true)

          if (error) throw error

          const regions = [...new Set(data?.map((d) => d.region) || [])].filter(Boolean)
          return {
            regions,
            totalCount: regions.length,
          }
        },
      }),

      getCAMPOSStatistics: tool({
        description: "Get statistics about CAMPOS including total files, regions, and properties",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("placemarks_count, region, rol_numbers")
            .eq("is_active", true)

          if (error) throw error

          const totalFiles = data?.length || 0
          const totalPlacemarks = data?.reduce((sum, d) => sum + (d.placemarks_count || 0), 0) || 0
          const regions = [...new Set(data?.map((d) => d.region) || [])].filter(Boolean)
          const allRoles = new Set(data?.flatMap((d) => d.rol_numbers || []) || [])

          return {
            totalFiles,
            totalPlacemarks,
            totalRegions: regions.length,
            totalProperties: allRoles.size,
            regions,
          }
        },
      }),

      searchByROL: tool({
        description: "Search properties by their ROL (property identifier) number",
        inputSchema: z.object({
          rol: z.string().describe("The ROL number to search"),
        }),
        execute: async ({ rol }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("id, file_name, region, rol_numbers, placemarks_count")
            .contains("rol_numbers", [rol])
            .eq("is_active", true)

          if (error) throw error
          return {
            rol,
            results: data,
            found: (data?.length || 0) > 0,
          }
        },
      }),

      analyzeGeographicCluster: tool({
        description: "Analyze geographic clusters and density of properties in a region",
        inputSchema: z.object({
          region: z.string().describe("Region name to analyze"),
        }),
        execute: async ({ region }) => {
          const { data, error } = await supabase
            .from("kmz_collection")
            .select("file_name, placemarks_count, bounds")
            .eq("region", region)
            .eq("is_active", true)

          if (error) throw error

          const totalPoints = data?.reduce((sum, d) => sum + (d.placemarks_count || 0), 0) || 0
          const avgPoints = data && data.length > 0 ? Math.round(totalPoints / data.length) : 0

          return {
            region,
            filesInRegion: data?.length || 0,
            totalPlacemarks: totalPoints,
            averagePlacemarksPerFile: avgPoints,
            density: totalPoints > 100 ? "high" : totalPoints > 30 ? "medium" : "low",
          }
        },
      }),

      searchLinkedDocuments: tool({
        description: "Search documents linked to KMZ/property files",
        inputSchema: z.object({
          kmzFileName: z.string().describe("Name of the KMZ file to find linked documents"),
        }),
        execute: async ({ kmzFileName }) => {
          const { data: kmzData, error: kmzError } = await supabase
            .from("kmz_collection")
            .select("id, file_name")
            .ilike("file_name", `%${kmzFileName}%`)
            .eq("is_active", true)
            .single()

          if (kmzError || !kmzData) {
            return {
              kmzFileName,
              found: false,
              documents: [],
            }
          }

          const { data: linkedDocs, error: docError } = await supabase
            .from("kmz_collection")
            .select("id, file_name, description")
            .eq("id", kmzData.id)

          if (docError) throw docError

          return {
            kmzFileName: kmzData.file_name,
            found: true,
            linkedDocuments: linkedDocs,
          }
        },
      }),
    },
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return result.toTextStreamResponse()
}
