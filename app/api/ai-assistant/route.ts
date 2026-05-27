import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Use OpenAI to understand the query
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un analizador de consultas sobre archivos KMZ en Chile. Extrae la intención y parámetros.

Responde SOLO con un JSON (sin markdown):
{
  "intent": "region_search" | "statistics" | "file_search" | "general",
  "region": string o null,
  "search_term": string o null
}

REGLAS:
1. Si menciona una región (metropolitana, los lagos, los ríos, etc.) → intent="region_search"
2. Si pregunta cuántos archivos hay en total sin mencionar región → intent="statistics"
3. Si menciona "en la región X" o "de X" donde X es región → intent="region_search"

Regiones válidas: Metropolitana, Los Lagos, Los Ríos, Aysén, Magallanes, Valparaíso, Coquimbo, Atacama, Arica y Parinacota, O'Higgins, Maule, Ñuble, Araucanía, Biobío, Tarapacá, Antofagasta.

Ejemplos:
- "cuantos kmz hay en la metropolitana" → {"intent":"region_search","region":"Metropolitana"}
- "archivos en los ríos" → {"intent":"region_search","region":"Los Ríos"}
- "cuantos archivos tengo" → {"intent":"statistics","region":null}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.1,
    })

    const content = aiResponse.choices[0].message.content || "{}"
    let queryAnalysis: { intent: string; region: string | null; search_term: string | null }
    
    try {
      let cleanContent = content
      if (content.includes("```")) {
        cleanContent = content.replace(/```json\n?|\n?```/g, "").trim()
      }
      queryAnalysis = JSON.parse(cleanContent)
    } catch {
      queryAnalysis = { intent: "statistics", region: null, search_term: null }
    }

    // Normalize region name
    if (queryAnalysis.region) {
      const r = queryAnalysis.region.toLowerCase()
      if (r.includes("metro") || r === "rm") queryAnalysis.region = "Metropolitana"
      else if (r.includes("ríos") || r.includes("rios")) queryAnalysis.region = "Los Ríos"
      else if (r.includes("lagos")) queryAnalysis.region = "Los Lagos"
      else if (r.includes("arau")) queryAnalysis.region = "Araucanía"
      else if (r.includes("bio")) queryAnalysis.region = "Biobío"
      else if (r.includes("valp")) queryAnalysis.region = "Valparaíso"
      else if (r.includes("maule")) queryAnalysis.region = "Maule"
      else if (r.includes("aysén") || r.includes("aysen")) queryAnalysis.region = "Aysén"
      else if (r.includes("magall")) queryAnalysis.region = "Magallanes"
    }

    // Handle region search
    if (queryAnalysis.intent === "region_search" && queryAnalysis.region) {
      const { data: placemarks, error } = await supabase
        .from("kmz_placemarks")
        .select("id, kmz_id, name, region, city")
        .ilike("region", `%${queryAnalysis.region}%`)

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ 
          response: `Error al buscar en ${queryAnalysis.region}: ${error.message}`,
          type: "error"
        })
      }

      if (placemarks && placemarks.length > 0) {
        const kmzIds = [...new Set(placemarks.map((p) => p.kmz_id))]
        
        const { data: kmzFiles } = await supabase
          .from("kmz_collection")
          .select("id, file_name, placemarks_count")
          .in("id", kmzIds)

        const fileList = kmzFiles
          ?.slice(0, 10)
          .map((f) => `- ${f.file_name} (${f.placemarks_count || 0} puntos)`)
          .join("\n")

        return NextResponse.json({
          response: `**Archivos KMZ en ${queryAnalysis.region}:**\n\n**Total:** ${kmzIds.length} archivos con ${placemarks.length} ubicaciones\n\n**Archivos encontrados:**\n${fileList}`,
          type: "region_search",
          data: { total: kmzIds.length, placemarks: placemarks.length }
        })
      } else {
        return NextResponse.json({
          response: `No encontré archivos KMZ en la región "${queryAnalysis.region}". Verifica el nombre de la región.`,
          type: "no_results"
        })
      }
    }

    // Handle statistics
    if (queryAnalysis.intent === "statistics") {
      const { data: kmzFiles, count } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count", { count: "exact" })

      if (kmzFiles && kmzFiles.length > 0) {
        const totalPoints = kmzFiles.reduce((sum, f) => sum + (f.placemarks_count || 0), 0)
        const latestFiles = kmzFiles.slice(0, 5)

        return NextResponse.json({
          response: `**Estadísticas KMZ:**\n\n- **Total de archivos:** ${count || kmzFiles.length}\n- **Total de ubicaciones:** ${totalPoints.toLocaleString()}\n- **Promedio por archivo:** ${Math.round(totalPoints / kmzFiles.length)} puntos\n\n**Archivos recientes:**\n${latestFiles.map((f) => `- ${f.file_name} (${f.placemarks_count} puntos)`).join("\n")}`,
          type: "statistics",
          data: { total: count || kmzFiles.length, points: totalPoints }
        })
      }
    }

    // Fallback
    return NextResponse.json({
      response: `Puedo ayudarte con:\n- "¿Cuántos archivos KMZ tengo?" - Estadísticas\n- "Archivos en [región]" - Búsqueda por región\n\n¿Qué deseas saber?`,
      type: "help"
    })

  } catch (error: any) {
    console.error("AI Assistant error:", error)
    return NextResponse.json({ 
      error: error.message || "Error procesando consulta",
      response: "Error al procesar tu consulta. Intenta de nuevo."
    }, { status: 500 })
  }
}
