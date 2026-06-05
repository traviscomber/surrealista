import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface TasacionRequest {
  property: {
    type: string
    area: number
    bedrooms: number
    bathrooms: number
    yearBuilt?: number
    location: string
    region: string
    city: string
    features?: string[]
  }
  comparables?: Array<{
    price: number
    area: number
    bedrooms: number
    bathrooms: number
    location: string
    similarity: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI at runtime
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const body: TasacionRequest = await request.json()

    if (!body.property) {
      return NextResponse.json(
        { error: 'Property data is required' },
        { status: 400 }
      )
    }

    // Crear mensaje para OpenAI con análisis de mercado
    const prompt = `
    Eres un experto en tasación de propiedades inmobiliarias en Chile.
    
    PROPIEDAD A TASAR:
    - Tipo: ${body.property.type}
    - Área: ${body.property.area} m²
    - Dormitorios: ${body.property.bedrooms}
    - Baños: ${body.property.bathrooms}
    - Año construcción: ${body.property.yearBuilt || 'No especificado'}
    - Ubicación: ${body.property.location}, ${body.property.city}, ${body.property.region}
    - Características: ${body.property.features?.join(', ') || 'Estándar'}
    
    ${
      body.comparables && body.comparables.length > 0
        ? `PROPIEDADES COMPARABLES EN LA ZONA:
    ${body.comparables
      .map(
        (comp, i) => `
    ${i + 1}. Precio: UF ${comp.price.toLocaleString('es-CL')} 
       Área: ${comp.area} m²
       Dormitorios: ${comp.bedrooms}
       Baños: ${comp.bathrooms}
       Similitud: ${(comp.similarity * 100).toFixed(0)}%`
      )
      .join('\n')}
    `
        : `No se proporcionaron propiedades comparables. Utiliza tu conocimiento del mercado inmobiliario chileno.`
    }
    
    Basándote en el análisis del mercado inmobiliario chileno y las propiedades comparables (si están disponibles):
    
    1. Calcula el precio recomendado en UF
    2. Proporciona un rango de precios (mínimo y máximo)
    3. Indica el precio por metro cuadrado en UF
    4. Analiza el potencial de inversión
    5. Identifica factores que impactan el precio
    6. Proporciona insights sobre el mercado actual
    
    Responde en formato JSON con la estructura:
    {
      "precioRecomendado": número,
      "precioMinimo": número,
      "precioMaximo": número,
      "precioPorM2": número,
      "potencialInversion": "alto|medio|bajo",
      "margenUF": número,
      "factoresPositivos": [string],
      "factoresNegativos": [string],
      "insightMercado": string,
      "recomendacion": string
    }
    
    Sé preciso y realista en tus cálculos.
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    // Extraer el contenido de la respuesta
    const content = completion.choices[0].message.content || ''

    // Parsear JSON de la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error: 'No se pudo extraer datos de tasación',
          rawResponse: content,
        },
        { status: 500 }
      )
    }

    const tasacionData = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      tasacion: tasacionData,
      property: body.property,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Tasacion error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      )
    }

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
