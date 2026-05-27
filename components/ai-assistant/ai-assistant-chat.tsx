"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import OpenAI from "openai"
import {
  Bot,
  Send,
  User,
  Sparkles,
  FolderOpen,
  FileText,
  Search,
  HelpCircle,
  Database,
  MapPin,
  TrendingUp,
} from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    type?:
      | "property_recommendation"
      | "market_analysis"
      | "price_estimate"
      | "contact_info"
      | "general"
      | "search_results"
      | "connection_error"
      | "folder_list"
      | "kmz_list"
      | "no_data"
      | "search_help"
      | "no_results"
      | "help"
      | "error"
    properties?: any[]
    analysis?: any
    confidence?: number
    searchResults?: any
    isComplex?: boolean
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
    id: "list_folders",
    label: "📁 Listar carpetas",
    icon: <FolderOpen className="h-4 w-4" />,
    prompt: "¿Cuántos archivos KMZ tengo?",
    category: "search",
  },
  {
    id: "search_documents",
    label: "🔍 Buscar documentos",
    icon: <Search className="h-4 w-4" />,
    prompt: "Buscar contratos",
    category: "search",
  },
  {
    id: "kmz_stats",
    label: "📊 Estadísticas KMZ",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "Dame estadísticas completas de mis archivos KMZ",
    category: "analysis",
  },
  {
    id: "kmz_by_region",
    label: "🌎 KMZ por Región",
    icon: <MapPin className="h-4 w-4" />,
    prompt: "¿Cuántos archivos KMZ tengo por región?",
    category: "analysis",
  },
  {
    id: "kmz_files",
    label: "🗺️ Archivos KMZ",
    icon: <MapPin className="h-4 w-4" />,
    prompt: "¿Cuántos archivos KMZ tengo y en qué regiones?",
    category: "search",
  },
  {
    id: "recent_files",
    label: "📄 Archivos recientes",
    icon: <FileText className="h-4 w-4" />,
    prompt: "¿Qué archivos se han agregado recientemente?",
    category: "search",
  },
  {
    id: "file_stats",
    label: "📊 Estadísticas",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "Dame estadísticas de mis archivos y carpetas",
    category: "analysis",
  },
  {
    id: "search_by_region",
    label: "🌎 Buscar por región",
    icon: <MapPin className="h-4 w-4" />,
    prompt: "Muéstrame todos los archivos de la Región de Los Lagos",
    category: "search",
  },
  {
    id: "help",
    label: "❓ Ayuda",
    icon: <HelpCircle className="h-4 w-4" />,
    prompt: "ayuda",
    category: "info",
  },
]

const complexQuestions: QuickAction[] = []

const processBulkFiles = async (files: File[]) => {
  const results = []
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/v1/documents/classify", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      results.push({ file: file.name, ...result })
    } catch (error) {
      results.push({ file: file.name, error: error.message })
    }
  }
  return results
}

const analyzeDocumentContent = async (documentId: string) => {
  try {
    const response = await fetch(`/api/v1/documents/${documentId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    return await response.json()
  } catch (error) {
    console.error("Document analysis error:", error)
    return { error: "Failed to analyze document" }
  }
}

export function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente IA para consultar datos KMZ en tiempo real. Puedo ayudarte a buscar archivos, explorar ubicaciones, analizar datos geoespaciales y responder preguntas sobre tus archivos KMZ. ¿Qué te gustaría saber?",
      timestamp: new Date(),
      metadata: { type: "general", confidence: 1.0 },
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

  const searchDocuments = async (query: string, filters?: any) => {
    try {
      const response = await fetch("/api/v1/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, ...filters }),
      })
      return await response.json()
    } catch (error) {
      console.error("Search error:", error)
      return { results: [], total: 0 }
    }
  }

  const searchProperties = async (filters: any) => {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`/api/v1/properties?${params}`)
      return await response.json()
    } catch (error) {
      console.error("Property search error:", error)
      return { properties: [], total: 0 }
    }
  }

  // Process user query with OpenAI to extract intent and parameters
  const processQueryWithAI = async (userMessage: string) => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a KMZ file query analyzer. Extract the user's intent and parameters from their query about KMZ files in Chile.
            
Return a JSON object with:
- intent: "statistics" | "region_search" | "file_search" | "general" 
- region: extracted region name (e.g., "Los Ríos", "Los Lagos", "Metropolitana") or null
- search_term: search keyword or null
- exact_match: boolean - whether to do exact region match or fuzzy search

Regions in database: Los Lagos, Región Metropolitana, Los Ríos, Aysén, Magallanes, Valparaíso, Coquimbo, Atacama, Arica y Parinacota, Libertador General Bernardo O'Higgins, Maule, Ñuble, Araucanía, La Araucanía.

IMPORTANT: Always respond ONLY with valid JSON, no markdown, no extra text.`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.3,
      })

      const content = response.choices[0].message.content || "{}"
      console.log("[v0] OpenAI response:", content)
      
      // Clean up markdown if present
      let cleanContent = content
      if (content.includes("```json")) {
        cleanContent = content.split("```json")[1].split("```")[0].trim()
      } else if (content.includes("```")) {
        cleanContent = content.split("```")[1].split("```")[0].trim()
      }
      
      const parsed = JSON.parse(cleanContent)
      return parsed
    } catch (error) {
      console.error("[v0] Query processing error:", error)
      return { intent: "general", region: null, search_term: null }
    }
  }

  const getIntelligentResponse = async (userMessage: string): Promise<Message> => {
    const message = userMessage.toLowerCase()

    // Folder queries - redirect to CAMPOS
    if (message.includes("carpeta") || message.includes("folder")) {
      return {
        id: uuidv4(),
        role: "assistant",
        content: `📁 **Exploración de Carpetas:**\n\nLas carpetas se administran en la sección CAMPOS.\n\n💡 **Puedes preguntar:**\n• "¿Cuántos archivos KMZ tengo?"\n• "Muéstrame los archivos de [región]"\n• "Dame estadísticas de mis KMZ"`,
        timestamp: new Date(),
        metadata: { type: "folder_redirect", confidence: 0.95 },
      }
    }

    if (message.includes("kmz") || message.includes("mapa") || message.includes("región") || message.includes("region")) {
      try {
        // Use OpenAI to understand the query
        const queryAnalysis = await processQueryWithAI(userMessage)
        console.log("[v0] Query analysis:", queryAnalysis)

        if (queryAnalysis.intent === "region_search" && queryAnalysis.region) {
          // Search by region using kmz_placemarks
          const { data: placemarks } = await supabase
            .from("kmz_placemarks")
            .select("id, kmz_id, name, region, city, address")
            .ilike("region", `%${queryAnalysis.region}%`)
            .limit(100)

          if (placemarks && placemarks.length > 0) {
            const kmzIds = [...new Set(placemarks.map((p: any) => p.kmz_id))]
            const { data: kmzFilesForRegion } = await supabase
              .from("kmz_collection")
              .select("id, file_name, placemarks_count")
              .in("id", kmzIds)

            const fileList = kmzFilesForRegion
              ?.map((f: any) => `• **${f.file_name}** (${f.placemarks_count || 0} puntos)`)
              .join("\n")

            const placemarksList = placemarks
              .slice(0, 5)
              .map((p: any) => `• ${p.name} - ${p.city || p.address || "Ubicación"}`)
              .join("\n")

            return {
              id: uuidv4(),
              role: "assistant",
              content: `🗺️ **${placemarks.length} ubicaciones en ${queryAnalysis.region}:**\n\n${placemarksList}\n\n**Archivos KMZ (${kmzIds.length}):**\n${fileList}`,
              timestamp: new Date(),
              metadata: { type: "region_search", confidence: 0.95 },
            }
          } else {
            return {
              id: uuidv4(),
              role: "assistant",
              content: `🗺️ No encontré ubicaciones en "${queryAnalysis.region}". Verifica la región solicitada.`,
              timestamp: new Date(),
              metadata: { type: "no_results", confidence: 0.9 },
            }
          }
        } else if (queryAnalysis.intent === "statistics") {
          // Return statistics
          const { data: kmzFiles } = await supabase
            .from("kmz_collection")
            .select("id, file_name, placemarks_count")
            .limit(100)

          if (kmzFiles && kmzFiles.length > 0) {
            const totalPoints = kmzFiles.reduce((sum: number, f: any) => sum + (f.placemarks_count || 0), 0)
            const latestFiles = kmzFiles.slice(0, 5)

            return {
              id: uuidv4(),
              role: "assistant",
              content: `📊 **Estadísticas KMZ:**\n\n• **Total de archivos:** ${kmzFiles.length}\n• **Total de ubicaciones:** ${totalPoints.toLocaleString()}\n• **Promedio por archivo:** ${Math.round(totalPoints / kmzFiles.length)} puntos\n\n**Archivos recientes:**\n${latestFiles.map((f: any) => `• ${f.file_name} (${f.placemarks_count} puntos)`).join("\n")}`,
              timestamp: new Date(),
              metadata: { type: "statistics", confidence: 0.95 },
            }
          }
          return null
        } else {
          // General KMZ help
          return {
            id: uuidv4(),
            role: "assistant",
            content: `📍 **Asistente de KMZ disponible**\n\nPuedo ayudarte con:\n• "¿Cuántos archivos KMZ tengo?" - Estadísticas\n• "Muéstrame los archivos de [región]" - Búsqueda por región\n• "¿Qué regiones tengo?" - Regiones disponibles\n\n¿Qué deseas saber?`,
            timestamp: new Date(),
            metadata: { type: "general", confidence: 0.85 },
          }
        }
      } catch (error: any) {
        console.error("KMZ query error:", error)
        return {
          id: uuidv4(),
          role: "assistant",
          content: `Error al procesar tu consulta. Por favor intenta nuevamente.`,
          timestamp: new Date(),
          metadata: { type: "error", confidence: 0.5 },
        }
      }
    }
    }

    // Default fallback response
    return {
      id: uuidv4(),
      role: "assistant",
      content: `Hola! Soy tu asistente de KMZ. Puedo ayudarte con:\n• Estadísticas de tus archivos\n• Búsqueda por región\n• Información sobre ubicaciones\n\n¿En qué puedo ayudarte?`,
      timestamp: new Date(),
      metadata: { type: "general", confidence: 0.7 },
    }
  }

  const handleSendMessage = async () => {

                const fileList = kmzFilesForRegion
                  ?.map((f: any) => `• **${f.file_name}** (${f.placemarks_count || 0} puntos)`)
                  .join("\n")

                const placemarksList = placemarks
                  .slice(0, 5)
                  .map((p: any) => `• ${p.name} (${p.city || p.address || "Ubicación"})`)
                  .join("\n")

                return {
                  id: uuidv4(),
                  role: "assistant",
                  content: `🗺️ **Ubicaciones en ${requestedRegion}:**\n\n${placemarksList}\n\n**Archivos KMZ con ubicaciones en esta región:**\n${fileList || "N/A"}\n\n**Total:** ${placemarks.length} ubicaciones en ${kmzIds.length} archivo(s)`,
                  timestamp: new Date(),
                  metadata: { type: "kmz_list", confidence: 0.95 },
                }
              } else {
                return {
                  id: uuidv4(),
                  role: "assistant",
                  content: `🗺️ **No encontré ubicaciones en ${requestedRegion}**\n\nVerifica la ortografía de la región. Algunas regiones disponibles:\n• Los Lagos\n• Región Metropolitana\n• Los Ríos\n• Aysén\n• Magallanes\n\n¿Quieres ver todas las regiones disponibles?`,
                  timestamp: new Date(),
                  metadata: { type: "no_results", confidence: 0.9 },
                }
              }
            } catch (error) {
              console.error("Region search error:", error)
            }
          }
      } catch (error) {
        console.error("[v0] KMZ query error:", error)
        return {
          id: uuidv4(),
          role: "assistant",
          content: `❌ Error al consultar archivos KMZ: ${error.message}`,
          timestamp: new Date(),
          metadata: { type: "error", confidence: 1.0 },
        }
      }
    }

    if (message.includes("buscar") || message.includes("encontrar") || message.includes("search")) {
      const searchTerm = message.replace(/buscar|encontrar|search/gi, "").trim()

      if (!searchTerm) {
        return {
          id: uuidv4(),
          role: "assistant",
          content: `🔍 **Búsqueda de Archivos**\n\n**Formato:** "Buscar [término]"\n\n**Ejemplos:**\n• "Buscar contrato"\n• "Buscar Puerto Varas"\n• "Buscar escritura"\n• "Buscar avalúo"\n\nTambién puedo buscar en:\n• Nombres de archivos\n• Contenido de documentos\n• Carpetas específicas\n• Archivos KMZ por ubicación`,
          timestamp: new Date(),
          metadata: { type: "search_help", confidence: 1.0 },
        }
      }

      try {
        const { data: kmzFiles } = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, placemarks_count, created_at")
          .or(`file_name.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(10)

        if (kmzFiles && kmzFiles.length > 0) {
          const fileList = kmzFiles
            .map((f: any) => `�� **${f.file_name}** - ${f.region || "Sin región"} (${f.placemarks_count || 0} puntos)`)
            .join("\n")

          return {
            id: uuidv4(),
            role: "assistant",
            content: `🔍 **Resultados para "${searchTerm}":**\n\n${fileList}\n\n${""}💡 **Acciones:**\n• Pregunta por un archivo específico para más detalles\n• Refina tu búsqueda con términos más específicos`,
            timestamp: new Date(),
            metadata: { type: "search_results", confidence: 0.9, searchResults: kmzFiles },
          }
        } else {
          return {
            id: uuidv4(),
            role: "assistant",
            content: `📭 No se encontraron archivos con "${searchTerm}"\n\n**Sugerencias:**\n• Intenta con términos más generales\n• Verifica la ortografía\n• Busca por tipo de archivo (contrato, escritura, etc.)`,
            timestamp: new Date(),
            metadata: { type: "no_results", confidence: 1.0 },
          }
        }
      } catch (error) {
        return {
          id: uuidv4(),
          role: "assistant",
          content: `❌ Error en la búsqueda: ${error.message}`,
          timestamp: new Date(),
          metadata: { type: "error", confidence: 1.0 },
        }
      }
    }

    if (message.includes("ayuda") || message.includes("help") || message.includes("comandos")) {
      return {
        id: uuidv4(),
        role: "assistant",
        content: `��� **Guía del Asistente IA de Datos**\n\n**📁 CARPETAS Y ARCHIVOS:**\n• "¿Qué carpetas tengo?"\n• "Muéstrame la carpeta CAMPOS"\n• "¿Cuántos archivos hay en [carpeta]?"\n\n**🔍 BÚSQUEDA:**\n• "Buscar [término]"\n• "Encontrar contratos"\n• "Archivos de Puerto Varas"\n\n**🗺️ ARCHIVOS KMZ:**\n• "¿Cuántos KMZ tengo?"\n• "Estadísticas de KMZ"\n• "Archivos KMZ por región"\n• "¿Qué KMZ hay en [región]?"\n• "Detalles del archivo [nombre]"\n\n**📊 ESTADÍSTICAS:**\n• "Dame estadísticas de mis archivos"\n• "Estadísticas de KMZ completas"\n• "¿Cuántos puntos tengo en total?"\n\n**🌎 BUSCAR POR REGIÓN:**\n• "Muéstrame todos los archivos de Los Lagos"\n• "¿Qué KMZ hay en Región de Aysén?"\n\n**❓ AYUDA:**\n• "ayuda"\n\n**💡 TIPS:**\n• Usa lenguaje natural\n• Sé específico en tus consultas\n• Menciona regiones, tipos de archivo o ubicaciones\n• Puedo buscar en nombres, contenido y metadata`,
        timestamp: new Date(),
        metadata: { type: "help", confidence: 1.0 },
      }
    }

    // Default response
    return {
      id: uuidv4(),
      role: "assistant",
      content: `Entiendo tu consulta sobre "${userMessage}".\n\nPuedo ayudarte con:\n• 📁 Explorar carpetas y archivos en Drive\n• 🔍 Buscar documentos específicos\n• 🗺️ Consultar archivos KMZ y ubicaciones\n• 📊 Analizar datos y generar resúmenes\n\n¿Podrías ser más específico? Por ejemplo:\n• "¿Qué carpetas tengo?"\n• "Buscar contratos"\n• "¿Cuántos archivos KMZ tengo?"\n\nO escribe "ayuda" para ver todos los comandos disponibles.`,
      timestamp: new Date(),
      metadata: { type: "general", confidence: 0.7 },
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim()) return

    if (textToSend.startsWith("/")) {
      setShowQuickActions(false)
      setShowComplexQuestions(false)
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      await supabase.from("agent_interactions").insert({
        session_id: sessionId,
        role: "user",
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString(),
      })

      const assistantMessage = await getIntelligentResponse(textToSend)

      const processingTime = textToSend.length > 200 ? 3000 : 1500
      await new Promise((resolve) => setTimeout(resolve, processingTime))

      setMessages((prev) => [...prev, assistantMessage])

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
        content:
          "Disculpa, hubo un error procesando tu consulta. Por favor intenta nuevamente o contacta directamente a nuestros agentes al +56 9 1234 5678.",
        timestamp: new Date(),
        metadata: { type: "error", confidence: 0 },
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
    <Card className="border-2 h-[800px] flex flex-col w-full overflow-hidden">
      <CardContent className="p-0 flex-1 flex flex-col w-full">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Asistente IA de Datos</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>IA Conversacional • Datos en Tiempo Real</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSendMessage("ayuda")}
                className="text-white hover:bg-white/20"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Ayuda
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ maxHeight: "calc(100% - 180px)" }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              <div
                className={`flex items-start max-w-[70%] ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                    : "bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-gray-900"
                } rounded-lg px-4 py-3 break-words`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.metadata?.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(message.metadata.confidence * 100)}% confianza
                      </Badge>
                    )}
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg px-4 py-3 max-w-[70%]">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <span className="text-sm text-gray-600 ml-2">Consultando datos...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4 w-full flex-shrink-0">
          <div className="flex gap-2 w-full">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta sobre tus datos: carpetas, archivos, KMZ, documentos..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage()}
              size="sm"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>Consulta Conversacional • Datos en Tiempo Real</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
