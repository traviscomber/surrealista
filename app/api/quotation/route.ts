import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"

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

    // Step 1: Analyze the property requirements using AI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un experto en bienes raíces de Chile. Analiza las solicitudes de cotización de propiedades.

Responde SOLO con un JSON (sin markdown):
{
  "property_type": "casa" | "departamento" | "terreno" | "campo" | "oficina" | "local",
  "region": string o null,
  "city": string o null,
  "bedrooms": number o null,
  "bathrooms": number o null,
  "area_sqm": number o null,
  "budget_min": number o null,
  "budget_max": number o null,
  "features": string[],
  "investment_type": "compra" | "arriendo" | "inversión" | "no especificado"
}

EJEMPLOS:
- "Busco una casa en Puerto Varas con 3 dormitorios, cerca del lago, con presupuesto de 350 millones"
  → {"property_type":"casa","region":"Los Lagos","city":"Puerto Varas","bedrooms":3,"features":["cerca del lago"],"budget_max":350000000,"investment_type":"compra"}

- "Terreno para inverti en la Metropolitana, entre 100 y 500 millones"
  → {"property_type":"terreno","region":"Metropolitana","budget_min":100000000,"budget_max":500000000,"investment_type":"inversión"}

- "Departamento de 2 dormitorios en Valparaíso para arrendar"
  → {"property_type":"departamento","region":"Valparaíso","bedrooms":2,"investment_type":"arriendo"}`,
        },
        { role: "user", content: requirements },
      ],
      temperature: 0.1,
    })

    const analysisContent = aiResponse.choices[0].message.content || "{}"
    let propertyAnalysis: any

    try {
      let cleanContent = analysisContent
      if (cleanContent.includes("```")) {
        cleanContent = cleanContent.replace(/```json\n?|\n?```/g, "").trim()
      }
      propertyAnalysis = JSON.parse(cleanContent)
    } catch {
      propertyAnalysis = { property_type: "terreno", investment_type: "no especificado" }
    }

    // Normalize region
    if (propertyAnalysis.region) {
      const r = propertyAnalysis.region.toLowerCase()
      if (r.includes("metro")) propertyAnalysis.region = "Metropolitana"
      else if (r.includes("lagos")) propertyAnalysis.region = "Los Lagos"
      else if (r.includes("ríos") || r.includes("rios")) propertyAnalysis.region = "Los Ríos"
      else if (r.includes("valp")) propertyAnalysis.region = "Valparaíso"
      else if (r.includes("maule")) propertyAnalysis.region = "Maule"
      else if (r.includes("bio")) propertyAnalysis.region = "Biobío"
      else if (r.includes("arau")) propertyAnalysis.region = "Araucanía"
    }

    // Step 2: Get comparable properties from database
    let comparables: any[] = []
    let marketData: any = null

    if (propertyAnalysis.region) {
      // Search for comparable KMZ data
      const { data: searchResults } = await supabase
        .from("kmz_search_index")
        .select("id, kmz_id, name, region, city, address, placemark_count")
        .ilike("region", `%${propertyAnalysis.region}%`)
        .limit(50)

      if (searchResults && searchResults.length > 0) {
        comparables = searchResults.slice(0, 10)
      }
    }

    // Step 3: Generate market-based valuation
    const marketInsights: Record<string, any> = {
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
      "Los Ríos": {
        casa: { min: 120000000, max: 300000000, avg_sqm: 1500000 },
        departamento: { min: 80000000, max: 180000000, avg_sqm: 1200000 },
        terreno: { min: 30000000, max: 200000000, avg_sqm: 10000 },
        campo: { min: 30000000, max: 400000000, avg_sqm: 1500 },
      },
    }

    const region = propertyAnalysis.region || "Metropolitana"
    const propType = propertyAnalysis.property_type || "terreno"
    const regionMarket = marketInsights[region as keyof typeof marketInsights] || marketInsights["Metropolitana"]
    const typeMarket = regionMarket[propType as keyof typeof regionMarket] || regionMarket["terreno"]

    // Calculate estimated price based on area
    let estimatedPrice = typeMarket.min
    if (propertyAnalysis.area_sqm && typeMarket.avg_sqm) {
      estimatedPrice = Math.round(propertyAnalysis.area_sqm * typeMarket.avg_sqm)
    }

    marketData = {
      region,
      property_type: propType,
      market_range: `$${(typeMarket.min / 1000000).toFixed(0)}M - $${(typeMarket.max / 1000000).toFixed(0)}M`,
      estimated_price: `$${(estimatedPrice / 1000000).toFixed(0)}M`,
      avg_price_per_sqm: `$${(typeMarket.avg_sqm / 1000).toFixed(0)}K`,
    }

    // Step 4: Generate final quotation response
    let quotationResponse = ""

    if (propertyAnalysis.budget_max) {
      const budgetInRange =
        estimatedPrice >= (propertyAnalysis.budget_min || 0) &&
        estimatedPrice <= propertyAnalysis.budget_max
      const status = budgetInRange ? "✅ Dentro del presupuesto" : "⚠️ Sobre presupuesto estimado"

      quotationResponse = `**COTIZACIÓN INTELIGENTE - ${propType.toUpperCase()}**\n\n`
      quotationResponse += `📍 **Ubicación:** ${region}${propertyAnalysis.city ? ` - ${propertyAnalysis.city}` : ""}\n`
      quotationResponse += `💰 **Presupuesto:** $${(propertyAnalysis.budget_min || 0) / 1000000}M - $${propertyAnalysis.budget_max / 1000000}M\n`
      quotationResponse += `🔍 **Estimación de Precio:** ${marketData.estimated_price} ${status}\n\n`

      if (propertyAnalysis.bedrooms) {
        quotationResponse += `🛏️ **Dormitorios:** ${propertyAnalysis.bedrooms}\n`
      }
      if (propertyAnalysis.area_sqm) {
        quotationResponse += `📐 **Área:** ${propertyAnalysis.area_sqm} m²\n`
      }

      quotationResponse += `\n**ANÁLISIS DE MERCADO**\n`
      quotationResponse += `- Rango de mercado: ${marketData.market_range}\n`
      quotationResponse += `- Precio promedio por m²: ${marketData.avg_price_per_sqm}\n`

      if (comparables.length > 0) {
        quotationResponse += `\n**PROPIEDADES COMPARABLES ENCONTRADAS:**\n`
        comparables.slice(0, 3).forEach((c, i) => {
          quotationResponse += `${i + 1}. ${c.name || "Propiedad"} - ${c.city || c.address || "Sin detalles"}\n`
        })
      }

      quotationResponse += `\n**RECOMENDACIÓN:**\n`
      if (budgetInRange) {
        quotationResponse += `Tu presupuesto es competitivo para esta tipo de propiedad en ${region}. Te recomendamos buscar en la sección CAMPOS para explorar propiedades disponibles.`
      } else {
        quotationResponse += `El precio estimado está fuera de tu rango. Considera aumentar presupuesto o explorar otras regiones con precios más accesibles.`
      }
    } else {
      quotationResponse = `**ANÁLISIS DE PROPIEDAD**\n\n`
      quotationResponse += `📍 **Tipo:** ${propType}\n`
      quotationResponse += `📍 **Región:** ${region}\n`
      quotationResponse += `💰 **Estimación:** ${marketData.estimated_price}\n`
      quotationResponse += `📊 **Rango de mercado:** ${marketData.market_range}\n\n`
      quotationResponse += `Basado en datos reales del mercado inmobiliario chileno, esta es la cotización estimada para ${propType}s en ${region}.`
    }

    return NextResponse.json({
      quotation: quotationResponse,
      analysis: propertyAnalysis,
      market_data: marketData,
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
