"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
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
        // Get all KMZ files
        const { data: kmzFiles } = await supabase
          .from("kmz_collection")
          .select("file_name, region, placemarks_count, created_at, file_id")
          .order("created_at", { ascending: false })

        // Get region statistics
        const { data: regionStats } = await supabase
          .from("kmz_collection")
          .select("region")

        if (kmzFiles && kmzFiles.length > 0) {
          // Calculate statistics
          const totalPoints = kmzFiles.reduce((sum: number, f: any) => sum + (f.placemarks_count || 0), 0)
          const regionCounts: Record<string, number> = {}
          regionStats?.forEach((item: any) => {
            if (item.region) {
              regionCounts[item.region] = (regionCounts[item.region] || 0) + 1
            }
          })

          // Check if user is asking for specific region
          const regionMatch = message.match(/región\s+de\s+(\w+)|region\s+de\s+(\w+)|(\w+)\s+region/i)
          const requestedRegion = regionMatch ? (regionMatch[1] || regionMatch[2] || regionMatch[3]) : null

          if (requestedRegion) {
            const regionFiles = kmzFiles.filter((f: any) => 
              f.region?.toLowerCase().includes(requestedRegion.toLowerCase())
            )
            
            if (regionFiles.length > 0) {
              const fileList = regionFiles
                .map((f: any) => `• **${f.file_name}** (${f.placemarks_count || 0} puntos)`)
                .join("\n")

              return {
                id: uuidv4(),
                role: "assistant",
                content: `🗺️ **Archivos KMZ en Región de ${requestedRegion}:**\n\n${fileList}\n\n**Total en región:** ${regionFiles.length} archivos con ${regionFiles.reduce((s: number, f: any) => s + (f.placemarks_count || 0), 0)} puntos`,
                timestamp: new Date(),
                metadata: { type: "kmz_list", confidence: 0.95 },
              }
            }
          }

          const kmzList = kmzFiles
            .slice(0, 8)
            .map((f: any) => `• **${f.file_name}** - ${f.region || "Sin región"} (${f.placemarks_count || 0} puntos)`)
            .join("\n")

          const regionSummary = Object.entries(regionCounts)
            .slice(0, 5)
            .map(([region, count]) => `• ${region}: ${count} archivos`)
            .join("\n")

          return {
            id: uuidv4(),
            role: "assistant",
            content: `🗺️ **Estadísticas de Archivos KMZ:**\n\n**Resumen General:**\n• Total de archivos: ${kmzFiles.length}\n• Total de puntos: ${totalPoints.toLocaleString()}\n• Regiones cubiertas: ${Object.keys(regionCounts).length}\n\n**Top Regiones:**\n${regionSummary}\n\n**Últimos archivos agregados:**\n${kmzList}${kmzFiles.length > 8 ? `\n\n... y ${kmzFiles.length - 8} archivos más` : ""}\n\n💡 **Puedes preguntar:**\n• "¿Qué KMZ hay en [región]?"\n• "Detalles de [nombre archivo]"\n• "¿Cuántos puntos tengo en total?"`,
            timestamp: new Date(),
            metadata: { type: "kmz_list", confidence: 0.95 },
          }
        } else {
          return {
            id: uuidv4(),
            role: "assistant",
            content: `📭 No se encontraron archivos KMZ en la base de datos.\n\n**Sugerencias:**\n• Carga archivos KMZ desde la página /campos\n• Verifica que los archivos se hayan guardado correctamente\n• Usa el botón "Cargar KMZ Offline" para subir archivos`,
            timestamp: new Date(),
            metadata: { type: "no_data", confidence: 1.0 },
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
          .select("file_name, region, placemarks_count, created_at, file_id")
          .or(`file_name.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(10)

        if (kmzFiles && kmzFiles.length > 0) {
          const fileList = kmzFiles
            .map((f: any) => `• **${f.file_name}** - ${f.region || "Sin región"} (${f.placemarks_count || 0} puntos)`)
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
        content: `🤖 **Guía del Asistente IA de Datos**\n\n**📁 CARPETAS Y ARCHIVOS:**\n• "¿Qué carpetas tengo?"\n• "Muéstrame la carpeta CAMPOS"\n• "¿Cuántos archivos hay en [carpeta]?"\n\n**🔍 BÚSQUEDA:**\n• "Buscar [término]"\n• "Encontrar contratos"\n• "Archivos de Puerto Varas"\n\n**🗺️ ARCHIVOS KMZ:**\n• "¿Cuántos KMZ tengo?"\n• "Estadísticas de KMZ"\n• "Archivos KMZ por región"\n• "¿Qué KMZ hay en [región]?"\n• "Detalles del archivo [nombre]"\n\n**📊 ESTADÍSTICAS:**\n• "Dame estadísticas de mis archivos"\n• "Estadísticas de KMZ completas"\n• "¿Cuántos puntos tengo en total?"\n\n**🌎 BUSCAR POR REGIÓN:**\n• "Muéstrame todos los archivos de Los Lagos"\n• "¿Qué KMZ hay en Región de Aysén?"\n\n**❓ AYUDA:**\n• "ayuda"\n\n**💡 TIPS:**\n• Usa lenguaje natural\n• Sé específico en tus consultas\n• Menciona regiones, tipos de archivo o ubicaciones\n• Puedo buscar en nombres, contenido y metadata`,
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
    <Card className="border-2 h-[700px] flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start max-w-[90%] ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                    : "bg-gray-50 border"
                } rounded-lg px-4 py-3`}
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
              <div className="flex items-start bg-gray-50 border rounded-lg px-4 py-3 max-w-[90%]">
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

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
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
