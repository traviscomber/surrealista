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

    // Use OpenAI to understand the query - Real Estate Expert Prompt
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un experto en real estate de Chile. Tienes profundo conocimiento del mercado inmobiliario chileno, tendencias de precios, regulaciones, zonas geográficas y análisis de propiedades.

Tu rol es:
1. Analizar consultas sobre propiedades, terrenos y archivos KMZ
2. Proporcionar análisis de mercado inmobiliario chileno
3. Extender la intención de las consultas del usuario
4. Considerar el contexto de datos reales en la plataforma

Responde SOLO con un JSON (sin markdown):
{
  "intent": string,
  "region": string o null,
  "property_type": string o null,
  "price_range": {min: number o null, max: number o null},
  "analysis_type": string o null,
  "search_term": string o null
}

INTENCIONES VÁLIDAS:
- "region_search": búsqueda por región geográfica
- "price_analysis": análisis de precios inmobiliarios
- "property_type": búsqueda por tipo de propiedad (casa, departamento, terreno, campo, etc)
- "market_trends": tendencias del mercado inmobiliario
- "statistics": estadísticas generales de archivos/propiedades
- "location_analysis": análisis de ubicación y vecindario
- "investment_advice": asesoramiento de inversión inmobiliaria
- "regulatory_info": información legal/regulatoria
- "file_search": búsqueda de archivos KMZ específicos
- "general": consultas generales

REGIONES VÁLIDAS CHILENAS:
Arica y Parinacota, Tarapacá, Antofagasta, Atacama, Coquimbo, Valparaíso, Metropolitana, O'Higgins, Maule, Ñuble, Biobío, Araucanía, Los Ríos, Los Lagos, Aysén, Magallanes

TIPOS DE PROPIEDADES:
terreno, campo, casa, departamento, oficina, local, condominio, propiedad agrícola, viña, fundo, predio

EJEMPLOS DE ANÁLISIS:
- "¿Cómo está el mercado en la Metropolitana?" → {"intent":"market_trends","region":"Metropolitana"}
- "Precios de terrenos en Valparaíso" → {"intent":"price_analysis","region":"Valparaíso","property_type":"terreno"}
- "Archivos KMZ de campos en Los Lagos" → {"intent":"file_search","region":"Los Lagos","property_type":"campo"}
- "Zonas de inversión en el sur" → {"intent":"investment_advice","region":"Los Lagos"}`,
        },
        { role: "user", content: message },
      ],
      temperature: 0.1,
    })

    const content = aiResponse.choices[0].message.content || "{}"
    let queryAnalysis: any
    
    try {
      let cleanContent = content
      if (cleanContent.includes("```")) {
        cleanContent = cleanContent.replace(/```json\n?|\n?```/g, "").trim()
      }
      queryAnalysis = JSON.parse(cleanContent)
    } catch {
      queryAnalysis = { intent: "general", region: null }
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
      else if (r.includes("o'higgins") || r.includes("ohiggins")) queryAnalysis.region = "O'Higgins"
      else if (r.includes("coquimbo")) queryAnalysis.region = "Coquimbo"
      else if (r.includes("ñuble") || r.includes("nuble")) queryAnalysis.region = "Ñuble"
    }

    // Market Trends Response
    if (queryAnalysis.intent === "market_trends") {
      const region = queryAnalysis.region || "Chile"
      const marketInsights = {
        "Metropolitana": {
          trend: "al alza",
          avg_price_sqm: "$4.5M - $8M",
          hotspots: ["Vitacura", "La Dehesa", "Nunoa", "Providencia"],
          forecast: "Demanda sostenida con potencial de crecimiento en comunas periféricas"
        },
        "Valparaíso": {
          trend: "recuperación lenta",
          avg_price_sqm: "$2M - $4M",
          hotspots: ["Viña del Mar", "Reñaca", "Valparaíso Centro"],
          forecast: "Oportunidades en renovación urbana y turismo"
        },
        "Los Lagos": {
          trend: "en expansión",
          avg_price_sqm: "$1.5M - $3M",
          hotspots: ["Puerto Varas", "Frutillar", "Osorno"],
          forecast: "Atractivo para inversión residencial e inmobiliaria rural"
        }
      }

      const insight = marketInsights[region as keyof typeof marketInsights] || {
        trend: "estable",
        forecast: "Mercado con oportunidades variadas según zona"
      }

      return NextResponse.json({
        response: `**Análisis de Mercado Inmobiliario - ${region}**\n\n📊 **Tendencia:** ${insight.trend}\n💰 **Valor promedio (m²):** ${insight.avg_price_sqm || "Variable según zona"}\n🏘️ **Zonas Calientes:** ${insight.hotspots?.join(", ") || "Múltiples opciones"}\n🔮 **Pronóstico:** ${insight.forecast}`,
        type: "market_analysis",
        data: insight
      })
    }

    // Price Analysis Response
    if (queryAnalysis.intent === "price_analysis") {
      const propertyType = queryAnalysis.property_type || "propiedad"
      const region = queryAnalysis.region || "nacional"
      
      return NextResponse.json({
        response: `**Análisis de Precios - ${propertyType} en ${region}**\n\nBuscaré datos actualizados del mercado y archivos KMZ disponibles para análisis comparativo. Considera también:\n- Cercanía a servicios\n- Acceso a transporte\n- Zonificación y regulaciones locales\n- Comparables recientes en la zona`,
        type: "price_analysis"
      })
    }

    // Investment Advice Response
    if (queryAnalysis.intent === "investment_advice") {
      const region = queryAnalysis.region || "el país"
      return NextResponse.json({
        response: `**Asesoramiento de Inversión - ${region}**\n\nFactores clave para tu análisis:\n✓ Rentabilidad esperada y ROI\n✓ Flujo de ingresos (arriendo)\n✓ Apreciación de propiedad\n✓ Costos de mantención y impuestos\n✓ Ubicación estratégica\n✓ Potencial de desarrollo\n\nUtiliza los archivos KMZ para visualizar ubicaciones exactas y analizar el territorio.`,
        type: "investment_advice"
      })
    }

    // Handle region search (KMZ files and locations)
    if (queryAnalysis.intent === "file_search" && queryAnalysis.region) {
      // Use kmz_search_index which has proper city/region columns
      const { data: searchResults, error: searchError } = await supabase
        .from("kmz_search_index")
        .select("id, kmz_id, name, region, city, address, placemark_count")
        .ilike("region", `%${queryAnalysis.region}%`)
        .limit(100)

      if (searchError) {
        console.error("Search index error:", searchError)
        return NextResponse.json({ 
          response: `Error al buscar archivos en ${queryAnalysis.region}: ${searchError.message}`,
          type: "error"
        })
      }

      if (searchResults && searchResults.length > 0) {
        // Get unique KMZ files from search results
        const kmzIds = [...new Set(searchResults.map((r) => r.kmz_id))]
        
        // Fetch KMZ collection details
        const { data: kmzFiles } = await supabase
          .from("kmz_collection")
          .select("id, file_name, placemarks_count, region, description")
          .in("id", kmzIds)

        const fileList = kmzFiles
          ?.slice(0, 10)
          .map((f) => `- ${f.file_name} (${f.placemarks_count || 0} ubicaciones)`)
          .join("\n")

        // Group search results by city for better insights
        const byCity: Record<string, number> = {}
        searchResults.forEach(r => {
          const city = r.city || "Sin especificar"
          byCity[city] = (byCity[city] || 0) + 1
        })
        const cityStats = Object.entries(byCity)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([city, count]) => `  • ${city}: ${count} ubicaciones`)
          .join("\n")

        const totalLocations = searchResults.length

        return NextResponse.json({
          response: `**Archivos Geográficos KMZ en ${queryAnalysis.region}**\n\n📊 **Resultados:** ${kmzIds.length} archivos con ${totalLocations} ubicaciones registradas\n\n🏘️ **Ciudades principales:**\n${cityStats}\n\n🗺️ **Archivos disponibles:**\n${fileList || "No hay archivos listados"}\n\nPuedes visualizar estos archivos en la sección de MAPAS para análisis geográfico completo.`,
          type: "region_search",
          data: { total_files: kmzIds.length, total_locations: totalLocations, files: kmzFiles?.length, by_city: byCity }
        })
      } else {
        return NextResponse.json({
          response: `No hay archivos KMZ catalogados en "${queryAnalysis.region}". Intenta con otra región o carga nuevos archivos geográficos.`,
          type: "no_results"
        })
      }
    }

    // Handle statistics
    if (queryAnalysis.intent === "statistics") {
      const { data: kmzFiles, count } = await supabase
        .from("kmz_collection")
        .select("id, file_name, placemarks_count, region", { count: "exact" })

      if (kmzFiles && kmzFiles.length > 0) {
        const totalPoints = kmzFiles.reduce((sum, f) => sum + (f.placemarks_count || 0), 0)
        
        // Group by region
        const byRegion: Record<string, number> = {}
        kmzFiles.forEach(f => {
          const r = f.region || "Sin categorizar"
          byRegion[r] = (byRegion[r] || 0) + 1
        })

        const regionStats = Object.entries(byRegion)
          .map(([region, count]) => `  • ${region}: ${count} archivos`)
          .join("\n")

        return NextResponse.json({
          response: `**Estadísticas de Tu Base de Datos Inmobiliaria**\n\n📁 **Total de archivos KMZ:** ${count || kmzFiles.length}\n📍 **Total de ubicaciones:** ${totalPoints.toLocaleString()}\n📊 **Promedio por archivo:** ${Math.round(totalPoints / kmzFiles.length)} puntos\n\n📍 **Distribución por región:**\n${regionStats}`,
          type: "statistics",
          data: { total: count || kmzFiles.length, points: totalPoints, byRegion }
        })
      }
    }

    // General/Helpful Response
    return NextResponse.json({
      response: `Soy tu experto en real estate de Chile. Puedo ayudarte con:\n\n💼 **Mercado Inmobiliario:**\n- Análisis de precios y tendencias\n- Asesoramiento de inversión\n- Información de mercado por región\n\n🗺️ **Datos Geográficos:**\n- Búsqueda de archivos KMZ por región\n- Análisis de ubicaciones\n- Estadísticas de propiedades\n\n¿Qué información sobre el mercado inmobiliario necesitas?`,
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
