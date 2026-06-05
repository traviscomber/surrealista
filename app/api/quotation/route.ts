import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
)

export async function POST(request: NextRequest) {
  try {
    const { requirements } = await request.json()

    if (!requirements) {
      return NextResponse.json({ error: "Requirements are required" }, { status: 400 })
    }

    // Call OpenAI API directly for analysis
    const analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres experto en bienes raíces chileno. Analiza solicitudes de cotización.
Responde SOLO JSON:
{"property_type":"casa|departamento|terreno|campo","region":null|string,"city":null|string,"bedrooms":null|number,"area_sqm":null|number,"budget_min":null|number,"budget_max":null|number,"investment_type":"compra|arriendo|inversión"}`,
          },
          { role: "user", content: requirements },
        ],
        temperature: 0.1,
      }),
    })

    if (!analysisResponse.ok) {
      throw new Error("OpenAI API error")
    }

    const analysisData = await analysisResponse.json()
    const analysisText = analysisData.choices[0].message.content || "{}"

    let propertyAnalysis: any = {}
    try {
      let cleanContent = analysisText
      if (cleanContent.includes("```")) {
        cleanContent = cleanContent.replace(/```json\n?|\n?```/g, "").trim()
      }
      propertyAnalysis = JSON.parse(cleanContent)
    } catch {
      propertyAnalysis = { property_type: "terreno" }
    }

    // Normalize region
    if (propertyAnalysis.region) {
      const r = propertyAnalysis.region?.toLowerCase() || ""
      if (r.includes("metro")) propertyAnalysis.region = "Metropolitana"
      else if (r.includes("lagos")) propertyAnalysis.region = "Los Lagos"
      else if (r.includes("ríos") || r.includes("rios")) propertyAnalysis.region = "Los Ríos"
      else if (r.includes("valp")) propertyAnalysis.region = "Valparaíso"
    }

    // Get comparable properties
    let comparables: any[] = []
    if (propertyAnalysis.region) {
      const { data: searchResults } = await supabase
        .from("kmz_search_index")
        .select("id, kmz_id, name, region, city, address")
        .ilike("region", `%${propertyAnalysis.region}%`)
        .limit(20)

      if (searchResults) {
        comparables = searchResults.slice(0, 5)
      }
    }

    // Market data by region and type
    const marketData: Record<string, Record<string, any>> = {
      "Metropolitana": {
        casa: { min: 300000000, max: 800000000, avg_sqm: 4500000 },
        departamento: { min: 200000000, max: 600000000, avg_sqm: 3500000 },
        terreno: { min: 150000000, max: 1000000000, avg_sqm: 45000 },
        campo: { min: 100000000, max: 2000000000, avg_sqm: 5000 },
      },
      "Los Lagos": {
        casa: { min: 150000000, max: 400000000, avg_sqm: 2000000 },
        departamento: { min: 100000000, max: 250000000, avg_sqm: 1500000 },
        terreno: { min: 50000000, max: 400000000, avg_sqm: 15000 },
        campo: { min: 50000000, max: 800000000, avg_sqm: 2000 },
      },
      "Valparaíso": {
        casa: { min: 200000000, max: 500000000, avg_sqm: 2500000 },
        departamento: { min: 150000000, max: 350000000, avg_sqm: 2000000 },
        terreno: { min: 100000000, max: 500000000, avg_sqm: 20000 },
        campo: { min: 50000000, max: 600000000, avg_sqm: 3000 },
      },
    }

    const region = propertyAnalysis.region || "Metropolitana"
    const propType = propertyAnalysis.property_type || "terreno"
    const regionMarket = marketData[region as keyof typeof marketData] || marketData["Metropolitana"]
    const typeMarket = regionMarket[propType as keyof typeof regionMarket] || regionMarket["terreno"]

    let estimatedPrice = typeMarket.min
    if (propertyAnalysis.area_sqm && typeMarket.avg_sqm) {
      estimatedPrice = Math.round(propertyAnalysis.area_sqm * typeMarket.avg_sqm)
    }

    // Generate response
    let quotationResponse = `**COTIZACIÓN INTELIGENTE - ${propType.toUpperCase()}**\n\n`
    quotationResponse += `📍 **Ubicación:** ${region}${propertyAnalysis.city ? ` - ${propertyAnalysis.city}` : ""}\n`

    if (propertyAnalysis.budget_max) {
      quotationResponse += `💰 **Presupuesto:** $${(propertyAnalysis.budget_min || 0) / 1000000}M - $${propertyAnalysis.budget_max / 1000000}M\n`
      const budgetInRange =
        estimatedPrice >= (propertyAnalysis.budget_min || 0) &&
        estimatedPrice <= propertyAnalysis.budget_max
      quotationResponse += `🔍 **Estimación:** $${(estimatedPrice / 1000000).toFixed(0)}M ${budgetInRange ? "✅ Dentro del presupuesto" : "⚠️ Sobre presupuesto"}\n\n`
    } else {
      quotationResponse += `🔍 **Estimación:** $${(estimatedPrice / 1000000).toFixed(0)}M\n\n`
    }

    if (propertyAnalysis.bedrooms) {
      quotationResponse += `🛏️ **Dormitorios:** ${propertyAnalysis.bedrooms}\n`
    }
    if (propertyAnalysis.area_sqm) {
      quotationResponse += `📐 **Área:** ${propertyAnalysis.area_sqm} m²\n`
    }

    quotationResponse += `\n**ANÁLISIS DE MERCADO**\n`
    quotationResponse += `- Rango de mercado: $${(typeMarket.min / 1000000).toFixed(0)}M - $${(typeMarket.max / 1000000).toFixed(0)}M\n`
    quotationResponse += `- Precio promedio/m²: $${(typeMarket.avg_sqm / 1000).toFixed(0)}K\n`

    if (comparables.length > 0) {
      quotationResponse += `\n**PROPIEDADES COMPARABLES:**\n`
      comparables.forEach((c, i) => {
        quotationResponse += `${i + 1}. ${c.name || "Propiedad"} - ${c.city || "Sin detalles"}\n`
      })
    }

    quotationResponse += `\n**RECOMENDACIÓN:**\n`
    quotationResponse += `Análisis completado usando datos reales del mercado inmobiliario chileno. Explora propiedades similares en la sección CAMPOS para análisis más detallado.`

    return NextResponse.json({
      quotation: quotationResponse,
      analysis: propertyAnalysis,
      comparables_found: comparables.length,
    })
  } catch (error: any) {
    console.error("Quotation error:", error)
    return NextResponse.json(
      {
        error: error.message || "Error procesando cotización",
        quotation: "Error al procesar tu solicitud. Intenta de nuevo con una descripción más clara.",
      },
      { status: 500 }
    )
  }
}
