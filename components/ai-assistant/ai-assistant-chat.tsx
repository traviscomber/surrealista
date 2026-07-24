"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Bot,
  Send,
  User,
  Sparkles,
  HelpCircle,
  FolderOpen,
  Search,
  TrendingUp,
  MapPin,
  FileText,
  Database,
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
    id: "market_metro",
    label: "🏙️ Mercado Metropolitana",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "¿Cómo está el mercado inmobiliario en la Metropolitana?",
    category: "analysis",
  },
  {
    id: "invest_advice",
    label: "💼 Asesoramiento Inversión",
    icon: <Sparkles className="h-4 w-4" />,
    prompt: "¿Dónde debería invertir en real estate en Chile?",
    category: "analysis",
  },
  {
    id: "price_analysis",
    label: "💰 Análisis de Precios",
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: "¿Cuáles son los precios promedio de terrenos en Valparaíso?",
    category: "analysis",
  },
  {
    id: "region_files",
    label: "🗺️ Archivos por Región",
    icon: <MapPin className="h-4 w-4" />,
    prompt: "¿Cuántos archivos KMZ tengo en Los Lagos?",
    category: "search",
  },
  {
    id: "property_search",
    label: "🔍 Buscar Propiedades",
    icon: <Search className="h-4 w-4" />,
    prompt: "¿Qué campos están disponibles en el sur de Chile?",
    category: "search",
  },
  {
    id: "statistics",
    label: "📊 Estadísticas",
    icon: <Database className="h-4 w-4" />,
    prompt: "Dame estadísticas completas de mis datos",
    category: "analysis",
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
        "¡Hola! Soy tu experto en real estate de Chile. Puedo ayudarte a:\n\n💼 **Analizar el mercado inmobiliario** - Tendencias de precios, zonas de inversión, y análisis comparativos\n🗺️ **Explorar tus datos geográficos** - Buscar archivos KMZ por región, visualizar ubicaciones y propiedades\n📊 **Obtener estadísticas** - Información sobre tus campos, terrenos y activos inmobiliarios\n💡 **Asesoramiento de inversión** - Recomendaciones basadas en datos del mercado chileno\n\n¿Qué deseas saber sobre el mercado inmobiliario o tus propiedades?",
      timestamp: new Date(),
      metadata: { type: "general", confidence: 1.0 },
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(uuidv4())
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showComplexQuestions, setShowComplexQuestions] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSupabase(
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
    )
  }, [])

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
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      const data = await response.json()

      return {
        id: uuidv4(),
        role: "assistant",
        content: data.response || "No pude procesar tu consulta.",
        timestamp: new Date(),
        metadata: { type: data.type || "general", confidence: 0.95 },
      }
    } catch (error: any) {
      console.error("AI Assistant error:", error)
      return {
        id: uuidv4(),
        role: "assistant",
        content: "Error al procesar tu consulta. Intenta de nuevo.",
        timestamp: new Date(),
        metadata: { type: "error", confidence: 0.5 },
      }
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
