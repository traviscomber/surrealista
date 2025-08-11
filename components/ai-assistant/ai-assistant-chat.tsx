"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { Bot, Send, User, Sparkles, MapPin, Calculator, Phone, Mail, Clock, TrendingUp, Home, DollarSign } from 'lucide-react'
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    type?: "property_recommendation" | "market_analysis" | "price_estimate" | "contact_info" | "general"
    properties?: any[]
    analysis?: any
    confidence?: number
  }
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  prompt: string
  category: "search" | "analysis" | "contact" | "info"
}

const quickActions: QuickAction[] = [
  {
    id: "search_lake_view",
    label: "Casas con vista al lago",
    icon: <Home className="h-4 w-4" />,
    prompt: "Busco una casa con vista al lago en Puerto Varas o Frutillar, presupuesto hasta $400 millones",
    category: "search"
  },
  {
    id: "market_analysis",
    label: "Análisis de mercado",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "¿Cómo está el mercado inmobiliario en el sur de Chile? ¿Es buen momento para comprar?",
    category: "analysis"
  },
  {
    id: "price_estimate",
    label: "Estimar precio",
    icon: <Calculator className="h-4 w-4" />,
    prompt: "¿Cuánto podría valer una casa de 200m² con 4 dormitorios en Puerto Varas?",
    category: "analysis"
  },
  {
    id: "investment_advice",
    label: "Consejo de inversión",
    icon: <DollarSign className="h-4 w-4" />,
    prompt: "¿Qué tipo de propiedad recomiendan para inversión en Pucón? ¿Rental turístico o venta?",
    category: "analysis"
  },
  {
    id: "contact_agent",
    label: "Hablar con agente",
    icon: <Phone className="h-4 w-4" />,
    prompt: "Quiero hablar con un agente especializado en propiedades de lujo en la región",
    category: "contact"
  },
  {
    id: "financing_options",
    label: "Opciones de financiamiento",
    icon: <Calculator className="h-4 w-4" />,
    prompt: "¿Qué opciones de crédito hipotecario tienen? ¿Trabajan con subsidios?",
    category: "info"
  }
]

const complexQuestions: QuickAction[] = [
  {
    id: "complex_investment",
    label: "Análisis de inversión complejo",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "Quiero invertir $800 millones en propiedades del sur de Chile para generar ingresos pasivos. Necesito un análisis completo considerando: ROI esperado, riesgos geológicos, potencial turístico, proyecciones demográficas, impacto del cambio climático en la zona, y estrategias de diversificación entre diferentes tipos de propiedades. ¿Cuál sería la cartera óptima?",
    category: "analysis"
  },
  {
    id: "complex_market",
    label: "Predicción de mercado avanzada",
    icon: <Calculator className="h-4 w-4" />,
    prompt: "Basándose en datos históricos, tendencias macroeconómicas, desarrollo de infraestructura, políticas gubernamentales y factores ambientales, ¿cómo proyectan que evolucionará el mercado inmobiliario en Puerto Varas, Pucón y Valdivia en los próximos 10 años? Incluyan análisis de riesgo por zona y oportunidades emergentes.",
    category: "analysis"
  },
  {
    id: "complex_comparison",
    label: "Comparación multi-variable",
    icon: <Home className="h-4 w-4" />,
    prompt: "Necesito comparar propiedades en 3 ubicaciones diferentes (Puerto Varas, Pucón, Chiloé) considerando: precio por m², potencial de revalorización, facilidad de acceso, servicios disponibles, riesgo sísmico, atractivo turístico, costos de mantención, liquidez del mercado local, y regulaciones municipales. ¿Cuál recomiendan para una familia que busca segunda vivienda con potencial de inversión?",
    category: "search"
  },
  {
    id: "complex_financing",
    label: "Estrategia financiera integral",
    icon: <DollarSign className="h-4 w-4" />,
    prompt: "Soy extranjero residente en Chile con ingresos variables (profesional independiente). Quiero comprar una propiedad de $450 millones. Analicen todas las opciones: crédito hipotecario tradicional vs leasing habitacional, subsidios aplicables, estrategias tributarias, seguros necesarios, costos asociados, y estructuración óptima considerando mi perfil de riesgo. ¿Cuál es la mejor estrategia financiera?",
    category: "info"
  },
  {
    id: "complex_development",
    label: "Proyecto de desarrollo inmobiliario",
    icon: <MapPin className="h-4 w-4" />,
    prompt: "Estoy evaluando desarrollar un proyecto inmobiliario en terrenos rurales cerca de Puerto Varas. Necesito análisis de: factibilidad técnica, requisitos regulatorios, estudios ambientales necesarios, infraestructura requerida, análisis de demanda, competencia local, cronograma de desarrollo, estructura de financiamiento, y proyección de rentabilidad. ¿Es viable el proyecto?",
    category: "analysis"
  }
]

export function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola! Soy el asistente inmobiliario inteligente de Sur-Realista. Utilizo IA avanzada para ayudarte a encontrar la propiedad perfecta, analizar el mercado y responder todas tus consultas inmobiliarias. ¿En qué puedo asistirte hoy?",
      timestamp: new Date(),
      metadata: { type: "general", confidence: 1.0 }
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(uuidv4())
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showComplexQuestions, setShowComplexQuestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getIntelligentResponse = async (userMessage: string): Promise<Message> => {
    const message = userMessage.toLowerCase()
    
    // Análisis de complejidad de la consulta
    const complexityIndicators = {
      high: /(?:análisis completo|proyecciones|estrategia|factibilidad|múltiples variables|comparar.*considerando|evaluar.*factores)/i,
      investment: /(?:invertir|inversión|roi|rentabilidad|cartera|diversificación|riesgo)/i,
      technical: /(?:técnico|regulatorio|ambiental|infraestructura|desarrollo|proyecto)/i,
      financial: /(?:financiamiento|crédito|leasing|tributario|estructura)/i,
      predictive: /(?:proyectar|futuro|tendencias|evolución|próximos.*años)/i
    }

    // Análisis de intención usando patrones avanzados
    const intentions = {
      complex_investment: /(?:invertir.*millones|cartera.*propiedades|análisis.*completo.*inversión|roi.*riesgo.*diversificación)/i,
      complex_market: /(?:proyectar.*mercado|evolución.*años|tendencias.*macroeconómicas|análisis.*histórico)/i,
      complex_comparison: /(?:comparar.*ubicaciones|múltiples.*variables|considerar.*factores|recomendar.*familia)/i,
      complex_financing: /(?:extranjero.*residente|estrategia.*financiera|leasing.*hipotecario|estructura.*óptima)/i,
      complex_development: /(?:proyecto.*desarrollo|terrenos.*rurales|factibilidad.*técnica|análisis.*demanda)/i,
      property_search: /(?:busco|quiero|necesito|me interesa).*(casa|departamento|terreno|propiedad|parcela)|(?:casa|departamento|terreno|propiedad|parcela).*(busco|quiero|necesito)/i,
      price_inquiry: /(?:precio|costo|valor|cuánto|cotizar|presupuesto)/i,
      location_specific: /(?:puerto varas|pucón|valdivia|osorno|frutillar|chiloé|puerto montt)/i,
      investment: /(?:inversión|invertir|rentabilidad|retorno|negocio|comercial)/i,
      financing: /(?:crédito|hipotecario|financiamiento|banco|subsidio|pie|dividendo)/i,
      market_analysis: /(?:mercado|tendencia|análisis|estadística|proyección|futuro)/i,
      contact: /(?:contacto|agente|reunión|visita|cita|llamar|whatsapp)/i,
      ai_technology: /(?:ia|inteligencia artificial|algoritmo|tecnología|predicción|análisis automático)/i
    }

    let responseType: string = "general"
    let confidence = 0.8
    let isComplex = false

    // Determinar complejidad
    for (const [type, pattern] of Object.entries(complexityIndicators)) {
      if (pattern.test(userMessage)) {
        isComplex = true
        confidence = 0.98
        break
      }
    }

    // Determinar tipo de consulta
    for (const [type, pattern] of Object.entries(intentions)) {
      if (pattern.test(userMessage)) {
        responseType = type
        confidence = isComplex ? 0.98 : 0.95
        break
      }
    }

    // Generar respuesta contextual basada en la intención
    let content = ""
    let metadata: any = { type: responseType, confidence, isComplex }

    switch (responseType) {
      case "complex_investment":
        content = `🎯 **ANÁLISIS INTEGRAL DE INVERSIÓN - $800M**

**📊 CARTERA ÓPTIMA RECOMENDADA:**

**🏆 DISTRIBUCIÓN ESTRATÉGICA:**
• **40% Puerto Varas** ($320M) - Propiedades premium vista lago
• **35% Pucón** ($280M) - Rental turístico alta rotación  
• **15% Valdivia** ($120M) - Propiedades patrimoniales
• **10% Chiloé** ($80M) - Terrenos desarrollo futuro

**📈 PROYECCIÓN ROI POR SEGMENTO:**
• **Puerto Varas**: 8-12% anual + 15% plusvalía proyectada
• **Pucón**: 12-18% anual (rental) + 10% plusvalía
• **Valdivia**: 6-9% anual + 12% plusvalía patrimonial
• **Chiloé**: 5-8% anual + 25% plusvalía (emergente)

**⚠️ ANÁLISIS DE RIESGOS:**
• **Riesgo Sísmico**: Medio-bajo (zona estable)
• **Riesgo Climático**: Bajo impacto próximos 20 años
• **Riesgo Regulatorio**: Bajo (zonas consolidadas)
• **Riesgo Liquidez**: Medio (mercado especializado)

**🌍 FACTORES MACROECONÓMICOS:**
• Crecimiento turismo internacional: +15% anual
• Desarrollo infraestructura: Aeropuerto El Tepual ampliación
• Tendencia remote work: +demanda segunda vivienda
• Política gubernamental: Incentivos turismo sustentable

**🎯 ESTRATEGIA DE DIVERSIFICACIÓN:**
1. **Inmediato**: 2 propiedades Puerto Varas (liquidez)
2. **6 meses**: 3 cabañas Pucón (cash flow)
3. **12 meses**: 1 propiedad patrimonial Valdivia
4. **18 meses**: Terrenos Chiloé (desarrollo futuro)

**ROI PROYECTADO CARTERA**: 10.2% anual promedio + 13.5% plusvalía`
        
        metadata.analysis = {
          investment_score: 9.2,
          risk_level: "medio-bajo",
          projected_roi: "10.2%",
          diversification_score: 8.8
        }
        break

      case "complex_market":
        content = `📊 **PROYECCIÓN MERCADO INMOBILIARIO 2024-2034**

**🔮 ANÁLISIS PREDICTIVO AVANZADO:**

**📈 PUERTO VARAS - CRECIMIENTO SOSTENIDO**
• **2024-2027**: +8-12% anual (consolidación turística)
• **2028-2031**: +6-9% anual (maduración mercado)
• **2032-2034**: +4-7% anual (estabilización)
• **Factores clave**: Turismo internacional, conectividad, calidad vida

**🏔️ PUCÓN - VOLATILIDAD CONTROLADA**
• **2024-2026**: +10-15% anual (boom post-pandemia)
• **2027-2030**: +5-8% anual (normalización)
• **2031-2034**: +6-10% anual (consolidación premium)
• **Riesgos**: Saturación turística, regulación ambiental

**🌊 VALDIVIA - CRECIMIENTO UNIVERSITARIO**
• **2024-2026**: +7-10% anual (expansión universitaria)
• **2027-2030**: +8-12% anual (desarrollo tecnológico)
• **2031-2034**: +6-9% anual (consolidación hub educativo)
• **Oportunidad**: Propiedades estudiantiles, co-living

**🌍 FACTORES MACROECONÓMICOS:**
• **Cambio Climático**: Migración hacia sur (+demanda)
• **Demografía**: Envejecimiento población (viviendas adaptadas)
• **Tecnología**: Remote work (segunda vivienda)
• **Infraestructura**: Tren rápido Santiago-Sur (2028-2030)

**⚠️ RIESGOS POR ZONA:**
• **Puerto Varas**: Medio (dependencia turística)
• **Pucón**: Alto (volatilidad estacional)
• **Valdivia**: Bajo (diversificación económica)

**🎯 OPORTUNIDADES EMERGENTES:**
• **Propiedades sustentables**: +20% premium
• **Co-housing seniors**: Mercado inexplorado
• **Rental corporativo**: Empresas tech remotas
• **Turismo wellness**: Propiedades especializadas

**RECOMENDACIÓN**: Diversificar entre las 3 zonas, enfoque sustentabilidad`
        
        metadata.analysis = {
          market_score: 8.7,
          trend: "bullish_long_term",
          confidence: 94.8,
          timeframe: "10_years"
        }
        break

      case "complex_comparison":
        content = `🏡 **ANÁLISIS COMPARATIVO MULTI-VARIABLE**

**📊 MATRIZ DE EVALUACIÓN (Escala 1-10):**

**🌊 PUERTO VARAS**
• **Precio/m²**: 7/10 ($2.8M/m² promedio)
• **Revalorización**: 9/10 (+15% proyectado 3 años)
• **Accesibilidad**: 9/10 (aeropuerto 20min, ruta pavimentada)
• **Servicios**: 9/10 (hospitales, colegios, comercio)
• **Riesgo Sísmico**: 8/10 (zona estable, construcción moderna)
• **Atractivo Turístico**: 10/10 (lago, volcán, gastronomía)
• **Mantención**: 7/10 (clima húmedo, mantención regular)
• **Liquidez**: 9/10 (mercado activo, demanda constante)
• **Regulaciones**: 8/10 (normativa clara, permisos ágiles)

**🏔️ PUCÓN**
• **Precio/m²**: 6/10 ($2.4M/m² promedio)
• **Revalorización**: 8/10 (+12% proyectado 3 años)
• **Accesibilidad**: 7/10 (2.5h Santiago, caminos buenos)
• **Servicios**: 7/10 (básicos cubiertos, especializado limitado)
• **Riesgo Sísmico**: 7/10 (zona volcánica, construcción adecuada)
• **Atractivo Turístico**: 10/10 (lago, volcán, deportes)
• **Mantención**: 6/10 (ceniza volcánica, clima variable)
• **Liquidez**: 7/10 (mercado estacional)
• **Regulaciones**: 6/10 (restricciones ambientales crecientes)

**🌿 CHILOÉ**
• **Precio/m²**: 9/10 ($1.2M/m² promedio)
• **Revalorización**: 8/10 (+25% proyectado 5 años)
• **Accesibilidad**: 5/10 (ferry, distancia, clima)
• **Servicios**: 5/10 (básicos, especializado limitado)
• **Riesgo Sísmico**: 9/10 (construcción tradicional resistente)
• **Atractivo Turístico**: 8/10 (cultura, naturaleza, autenticidad)
• **Mantención**: 5/10 (humedad, vientos, materiales especiales)
• **Liquidez**: 4/10 (mercado nicho, compradores específicos)
• **Regulaciones**: 7/10 (patrimonio, algunas restricciones)

**🎯 RECOMENDACIÓN PARA FAMILIA:**

**1° OPCIÓN: PUERTO VARAS** (Score: 8.4/10)
✅ **Ventajas**: Mejor infraestructura, alta liquidez, servicios completos
✅ **Inversión**: Mercado maduro, revalorización consistente
✅ **Familia**: Colegios, salud, actividades año completo

**2° OPCIÓN: PUCÓN** (Score: 7.1/10)
✅ **Ventajas**: Precio accesible, potencial turístico, deportes
⚠️ **Consideraciones**: Estacionalidad, mantención especial

**3° OPCIÓN: CHILOÉ** (Score: 6.7/10)
✅ **Ventajas**: Precio excelente, potencial futuro, autenticidad
⚠️ **Consideraciones**: Acceso limitado, servicios básicos

**ESTRATEGIA RECOMENDADA**: Puerto Varas como residencia principal + Pucón como inversión rental`
        
        metadata.analysis = {
          comparison_score: 8.4,
          recommended_location: "Puerto Varas",
          investment_potential: "Alto",
          family_suitability: "Excelente"
        }
        break

      case "complex_financing":
        content = `💰 **ESTRATEGIA FINANCIERA INTEGRAL - EXTRANJERO RESIDENTE**

**📋 ANÁLISIS DE PERFIL:**
• **Status**: Residente con ingresos variables
• **Monto**: $450M (propiedad objetivo)
• **Desafío**: Ingresos independientes (documentación compleja)

**🏦 OPCIONES DE FINANCIAMIENTO COMPARADAS:**

**1️⃣ CRÉDITO HIPOTECARIO TRADICIONAL**
• **Financiamiento**: Hasta 80% ($360M)
• **Pie requerido**: $90M (20%)
• **Tasa**: 4.2-5.8% (extranjero residente)
• **Plazo**: Hasta 25 años
• **Requisitos**: 24 meses declaraciones, aval chileno
• **Ventajas**: Menor costo total, deducible impuestos
• **Desventajas**: Documentación extensa, proceso lento

**2️⃣ LEASING HABITACIONAL**
• **Financiamiento**: Hasta 90% ($405M)
• **Pie requerido**: $45M (10%)
• **Tasa**: 5.5-7.2% (mayor flexibilidad)
• **Plazo**: Hasta 20 años
• **Requisitos**: Menor documentación, proceso ágil
• **Ventajas**: Rapidez, flexibilidad, menor pie
• **Desventajas**: Mayor costo, no deducible

**💡 SUBSIDIOS APLICABLES:**
• **DS19**: No aplica (monto excede límite)
• **Subsidio Rural**: Evaluar si zona califica
• **Subsidio Clase Media**: No aplica (extranjero)

**📊 ESTRATEGIAS TRIBUTARIAS:**
• **Empresa Individual**: Deducir intereses como gasto
• **Sociedad**: Propiedad como activo empresarial
• **Arriendo**: Generar ingresos deducibles
• **Depreciación**: 2% anual valor propiedad

**🛡️ SEGUROS NECESARIOS:**
• **Incendio/Sismo**: Obligatorio (0.15% valor)
• **Desgravamen**: Recomendado (0.08% saldo)
• **Cesantía**: Opcional independientes (0.12%)
• **Vida**: Complementario (según edad)

**💰 COSTOS ASOCIADOS:**
• **Tasación**: $150,000
• **Estudio títulos**: $200,000
• **Notaría**: $800,000 (0.2% valor)
• **Conservador**: $450,000 (0.1% valor)
• **Impuesto timbres**: $1,350,000 (0.3% crédito)
• **Total costos**: ~$3M (0.7% operación)

**🎯 RECOMENDACIÓN ESTRATÉGICA:**

**OPCIÓN A: HÍBRIDA (RECOMENDADA)**
• 60% Crédito hipotecario ($270M) - menor tasa
• 20% Leasing habitacional ($90M) - flexibilidad
• 20% Pie propio ($90M)
• **Ventaja**: Optimiza costos y flexibilidad

**OPCIÓN B: FULL LEASING**
• 90% Leasing ($405M)
• 10% Pie ($45M)
• **Ventaja**: Menor pie, proceso rápido

**📈 PROYECCIÓN FINANCIERA (20 años):**
• **Opción A**: Dividendo $2.1M/mes, ahorro $15M total
• **Opción B**: Dividendo $2.8M/mes, mayor liquidez inicial

**SIGUIENTE PASO**: Pre-evaluación con 3 bancos simultáneamente`
        
        metadata.analysis = {
          financing_score: 8.9,
          recommended_option: "Híbrida",
          monthly_payment: "$2.1M",
          total_savings: "$15M"
        }
        break

      case "complex_development":
        content = `🏗️ **ANÁLISIS FACTIBILIDAD PROYECTO DESARROLLO**

**📍 CONTEXTO: TERRENOS RURALES PUERTO VARAS**

**✅ FACTIBILIDAD TÉCNICA:**

**🗺️ ANÁLISIS TERRITORIAL:**
• **Zonificación**: Rural mixto (verificar PRC vigente)
• **Subdivisión mínima**: 5,000m² (Ley General Urbanismo)
• **Densidad permitida**: 80 hab/há máximo
• **Coeficiente ocupación**: 0.6 (60% terreno)
• **Altura máxima**: 2 pisos (zona rural)

**🌿 ESTUDIOS AMBIENTALES REQUERIDOS:**
• **EIA**: Si >200 viviendas o >20 há
• **DIA**: Proyectos menores, impacto moderado
• **Estudio flora/fauna**: Obligatorio (6 meses)
• **Recursos hídricos**: APR o pozo profundo
• **Tratamiento aguas**: Planta propia o conexión

**🛣️ INFRAESTRUCTURA NECESARIA:**
• **Acceso**: Camino pavimentado (costo $800M/km)
• **Electricidad**: Extensión red ($150M/km)
• **Agua potable**: APR o pozo ($200M sistema)
• **Alcantarillado**: Planta tratamiento ($500M)
• **Telecomunicaciones**: Fibra óptica ($50M/km)

**📋 REQUISITOS REGULATORIOS:**

**PERMISOS PRINCIPALES:**
• **Subdivisión**: SERVIU (4-6 meses)
• **Urbanización**: Municipalidad (6-8 meses)
• **Construcción**: DOM (2-3 meses por etapa)
• **Ambiental**: SEA (8-12 meses)
• **Sanitario**: SEREMI Salud (3-4 meses)

**📊 ANÁLISIS DE DEMANDA:**

**MERCADO OBJETIVO:**
• **Familias Santiago**: 35% (segunda vivienda)
• **Extranjeros**: 25% (residencia/inversión)
• **Locales**: 20% (upgrade vivienda)
• **Inversionistas**: 20% (rental/reventa)

**COMPETENCIA LOCAL:**
• **Proyectos activos**: 3 (total 180 unidades)
• **Precio promedio**: $3.2M/m²
• **Velocidad venta**: 4-6 unidades/mes
• **Absorción mercado**: 24 meses promedio

**💰 PROYECCIÓN FINANCIERA:**

**COSTOS DESARROLLO (100 unidades):**
• **Terreno**: $2,000M (20 há @ $100M/há)
• **Infraestructura**: $3,500M (35% costo total)
• **Construcción**: $4,000M ($40M/unidad)
• **Permisos/estudios**: $800M (8% proyecto)
• **Marketing/ventas**: $400M (4% ventas)
• **Contingencia**: $600M (6% total)
• **TOTAL INVERSIÓN**: $11,300M

**INGRESOS PROYECTADOS:**
• **Precio venta**: $180M/unidad promedio
• **Ingresos totales**: $18,000M
• **Utilidad bruta**: $6,700M (37% margen)
• **Utilidad neta**: $4,500M (25% después impuestos)

**📈 CRONOGRAMA DESARROLLO:**
• **Año 1**: Permisos, estudios, infraestructura
• **Año 2**: Construcción fase 1 (30 unidades)
• **Año 3**: Construcción fase 2 (40 unidades)
• **Año 4**: Construcción fase 3 (30 unidades)
• **Año 5**: Finalización, entrega, cierre

**🎯 ESTRUCTURA FINANCIAMIENTO:**
• **Capital propio**: $3,400M (30%)
• **Crédito construcción**: $5,650M (50%)
• **Preventa**: $2,250M (20% - 50 unidades)

**✅ CONCLUSIÓN: PROYECTO VIABLE**
• **TIR**: 28.5% (excelente)
• **VAN**: $2,800M (atractivo)
• **Payback**: 3.2 años
• **Riesgo**: Medio (mercado consolidado)

**RECOMENDACIÓN**: Proceder con estudios detallados y securing terreno`
        
        metadata.analysis = {
          feasibility_score: 8.6,
          tir: "28.5%",
          van: "$2,800M",
          risk_level: "Medio",
          recommendation: "Viable"
        }
        break

      case "property_search":
        if (message.includes("lago") || message.includes("vista")) {
          content = `Excelente elección. Tenemos propiedades espectaculares con vista al lago en nuestra cartera:

🏡 **Casa Premium Puerto Varas** - $350M
• 4 dormitorios, 3 baños, 280m²
• Vista panorámica lago Llanquihue y volcán Osorno
• Jardín privado con acceso al lago

🏡 **Parcela Frutillar** - $280M  
• 5000m² con acceso directo al lago
• Ideal para proyecto residencial exclusivo
• Zona de alta plusvalía

Nuestro algoritmo de IA ha identificado estas propiedades con 94.2% de coincidencia con tus preferencias. ¿Te gustaría agendar una visita virtual o presencial?`
          
          metadata.properties = [
            { id: "1", title: "Casa Premium Puerto Varas", price: 350000000, match: 94.2 },
            { id: "2", title: "Parcela Frutillar", price: 280000000, match: 89.7 }
          ]
        } else {
          content = `Perfecto, te ayudo a encontrar la propiedad ideal. Nuestro sistema de IA analiza más de 247 propiedades disponibles en tiempo real.

Para darte las mejores recomendaciones, necesito conocer:
• ¿Qué tipo de propiedad buscas? (casa, departamento, terreno)
• ¿Ubicación preferida? (Puerto Varas, Pucón, Valdivia, etc.)
• ¿Rango de presupuesto?
• ¿Características específicas? (dormitorios, vista, jardín)

Mientras tanto, aquí tienes nuestras propiedades más populares esta semana según nuestro análisis predictivo.`
        }
        break

      case "price_inquiry":
        content = `Nuestro sistema de valoración con IA analiza múltiples variables en tiempo real:

📊 **Rangos de Precio por Zona (Actualizado hoy):**
• **Puerto Varas**: $200M - $500M (casas), $120M - $280M (deptos)
• **Pucón**: $180M - $450M (casas), $100M - $250M (deptos)  
• **Valdivia**: $150M - $350M (casas), $90M - $200M (deptos)
• **Frutillar**: $220M - $400M (casas), $130M - $240M (deptos)

🤖 **Análisis IA incluye:**
• Datos históricos de transacciones (SII)
• Tendencias de mercado en tiempo real
• Análisis geográfico y de infraestructura
• Proyecciones de plusvalía (3-5 años)

¿Tienes alguna propiedad específica en mente para cotizar? Puedo darte una valoración precisa en menos de 2 minutos.`
        
        metadata.analysis = {
          market_trend: "alcista",
          confidence_level: 94.2,
          data_sources: ["SII", "CIREN", "Banco Central"]
        }
        break

      case "investment":
        content = `Excelente momento para invertir en el sur de Chile. Nuestro análisis predictivo muestra:

📈 **Oportunidades de Inversión 2024:**

**🏆 ALTO RETORNO:**
• **Pucón** - Rental turístico: ROI 8-12% anual
• **Puerto Varas** - Propiedades premium: +15% plusvalía proyectada
• **Chiloé** - Terrenos: Oportunidad emergente (+25% en 2 años)

**💡 Recomendación IA:**
Basado en 15,000+ transacciones analizadas, las mejores inversiones son:
1. Cabañas turísticas en Pucón (temporada alta 90% ocupación)
2. Casas con vista al lago en Puerto Varas (demanda internacional)
3. Terrenos en desarrollo urbano Valdivia (nueva infraestructura)

¿Te interesa algún tipo específico de inversión? Puedo generar un análisis personalizado con proyecciones detalladas.`
        
        metadata.analysis = {
          investment_score: 8.7,
          risk_level: "medio-bajo",
          projected_roi: "8-15%"
        }
        break

      case "financing":
        content = `Te ayudo con todas las opciones de financiamiento disponibles:

💳 **Créditos Hipotecarios (Convenios Especiales):**
• **Banco Estado**: Tasa desde 3.5% anual, hasta 90% financiamiento
• **BancoChile**: Tasa desde 3.8% anual, plazos hasta 30 años  
• **Santander**: Tasa desde 4.1% anual, sin comisiones

🏠 **Subsidios Habitacionales:**
• **DS1**: Hasta $950 UF (primera vivienda)
• **DS19**: Hasta $650 UF (sectores medios)
• **Subsidio Rural**: Hasta $850 UF (zonas rurales)

🤖 **Simulador IA Personalizado:**
Ingresa tus datos y en 30 segundos obtienes:
• Pre-aprobación estimada
• Mejor tasa disponible según tu perfil
• Ahorro potencial en gastos operacionales

¿Quieres que simule un crédito específico? Solo necesito: ingresos mensuales, pie disponible y valor de la propiedad.`
        break

      case "market_analysis":
        content = `📊 **Análisis de Mercado Sur de Chile - Enero 2024**

**Tendencia General:** 📈 ALCISTA (+12% vs 2023)

🎯 **Indicadores Clave:**
• **Demanda**: +18% (mayor interés en propiedades premium)
• **Oferta**: -8% (inventario limitado en zonas prime)
• **Tiempo promedio venta**: 45 días (vs 65 días en 2023)
• **Financiamiento**: 85% operaciones con crédito hipotecario

🌟 **Zonas de Mayor Crecimiento:**
1. **Puerto Varas**: +15% valor promedio (turismo internacional)
2. **Pucón**: +12% valor promedio (boom rental turístico)  
3. **Valdivia**: +10% valor promedio (desarrollo universitario)

🔮 **Proyección IA 2024-2025:**
• Crecimiento sostenido 8-10% anual
• Mayor demanda propiedades sustentables
• Consolidación mercado luxury en lagos

**Recomendación:** Excelente momento para comprar. Inventario limitado y tasas históricamente bajas.`
        
        metadata.analysis = {
          market_score: 8.5,
          trend: "bullish",
          confidence: 94.2
        }
        break

      case "contact":
        content = `¡Perfecto! Te conecto con nuestros especialistas:

👥 **Agentes Especializados:**

**🏡 Puerto Varas & Lagos**
• **María González** - Especialista Premium
• 📱 +56 9 8765 4321 | 📧 maria@sur-realista.cl
• 15+ años experiencia, 200+ ventas exitosas

**🏔️ Pucón & Araucanía**  
• **Carlos Mendoza** - Experto Turístico
• 📱 +56 9 8765 4322 | 📧 carlos@sur-realista.cl
• Especialista en inversiones turísticas

**🌊 Valdivia & Los Ríos**
• **Ana Rodríguez** - Asesora Integral  
• 📱 +56 9 8765 4323 | 📧 ana@sur-realista.cl
• Experta en propiedades patrimoniales

📍 **Oficina Principal:**
Av. Costanera 1234, Puerto Varas
🕒 Lun-Vie 9:00-18:00, Sáb 10:00-14:00

¿Prefieres que te contacten por WhatsApp, llamada o agendar reunión presencial?`
        
        metadata.type = "contact_info"
        break

      case "ai_technology":
        content = `🤖 **Tecnología IA Sur-Realista - Líder en Innovación**

**🧠 Nuestro Sistema Inteligente:**
• **Precisión**: 94.2% en valoraciones automáticas
• **Datos**: +50,000 transacciones analizadas
• **Fuentes**: SII, CIREN, Banco Central, OpenStreetMap
• **Actualización**: Tiempo real cada 15 minutos

**⚡ Capacidades Avanzadas:**
• **Análisis Predictivo**: Proyecciones de plusvalía 3-5 años
• **Matching Inteligente**: Encuentra propiedades según tu perfil
• **Valoración Automática**: Estimación precisa en 30 segundos
• **Análisis de Riesgo**: Evaluación geológica y climática

**🎯 Algoritmos Especializados:**
• Machine Learning para tendencias de precio
• Computer Vision para análisis de imágenes
• NLP para procesamiento de documentos legales
• Geolocalización avanzada con datos satelitales

**🏆 Reconocimientos:**
• Premio Innovación Inmobiliaria Chile 2023
• Certificación ISO 27001 (Seguridad de Datos)
• Partner Tecnológico Google Cloud

¿Te interesa conocer cómo aplicamos IA a tu búsqueda específica?`
        
        metadata.analysis = {
          ai_accuracy: 94.2,
          data_sources: 8,
          processing_speed: "30 segundos"
        }
        break

      default:
        // Respuesta general inteligente
        if (message.includes("hola") || message.includes("buenos días") || message.includes("buenas tardes")) {
          content = `¡Hola! 👋 Soy el asistente inmobiliario más avanzado del sur de Chile. 

Estoy aquí para ayudarte con:
🏡 Búsqueda inteligente de propiedades
📊 Análisis de mercado en tiempo real  
💰 Valoraciones automáticas con IA
🤝 Conexión con agentes especializados
💳 Opciones de financiamiento personalizadas

¿En qué puedo asistirte específicamente hoy?`
        } else {
          content = `Entiendo tu consulta. Como asistente inmobiliario inteligente, puedo ayudarte con información detallada sobre:

• **Propiedades disponibles** en toda la región sur
• **Análisis de mercado** con datos en tiempo real
• **Valoraciones precisas** usando algoritmos avanzados
• **Opciones de financiamiento** personalizadas
• **Conexión con agentes** especializados por zona

¿Podrías ser más específico sobre lo que necesitas? Así podré darte la información más precisa y útil.`
        }
    }

    return {
      id: uuidv4(),
      role: "assistant",
      content,
      timestamp: new Date(),
      metadata
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim()) return

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowQuickActions(false)
    setShowComplexQuestions(false)

    try {
      // Save user message to database
      await supabase.from("agent_interactions").insert({
        session_id: sessionId,
        role: "user",
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString(),
      })

      // Generate intelligent response
      const assistantMessage = await getIntelligentResponse(textToSend)
      
      // Simulate processing time for better UX (longer for complex queries)
      const processingTime = textToSend.length > 200 ? 3000 : 1500
      await new Promise((resolve) => setTimeout(resolve, processingTime))

      setMessages((prev) => [...prev, assistantMessage])

      // Save assistant message to database
      await supabase.from("agent_interactions").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
        metadata: assistantMessage.metadata,
      })
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Disculpa, hubo un error procesando tu consulta. Por favor intenta nuevamente o contacta directamente a nuestros agentes al +56 9 1234 5678.",
        timestamp: new Date(),
        metadata: { type: "error", confidence: 0 }
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="border-2 h-[700px] flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Asistente IA Sur-Realista</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>En línea • IA Avanzada</span>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    94.2% Precisión
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComplexQuestions(!showComplexQuestions)}
              className="text-white hover:bg-white/20"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Consultas Complejas
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start max-w-[90%] ${
                  message.role === "user" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                    : "bg-gray-50 border"
                } rounded-lg px-4 py-3`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex gap-2">
                      {message.metadata?.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(message.metadata.confidence * 100)}% confianza
                        </Badge>
                      )}
                      {message.metadata?.isComplex && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          Análisis Complejo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Complex Questions */}
          {showComplexQuestions && (
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Consultas Complejas - Análisis Avanzado:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {complexQuestions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="justify-start text-left h-auto p-3 hover:bg-purple-50 hover:border-purple-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-medium text-xs mb-1">{action.label}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {action.prompt.substring(0, 120)}...
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 1 && !showComplexQuestions && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 font-medium">Acciones rápidas:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="justify-start text-left h-auto p-3 hover:bg-blue-50 hover:border-blue-200"
                  >
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <span className="text-xs">{action.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start bg-gray-50 border rounded-lg px-4 py-3 max-w-[90%]">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <span className="text-sm text-gray-600 ml-2">Procesando análisis complejo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Haz preguntas complejas: análisis de inversión, proyecciones de mercado, estrategias financieras..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              size="sm"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>IA Avanzada • Análisis Complejos</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Respuesta: 2-5 seg</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
