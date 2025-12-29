"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { streamCAMPOSAgent } from "@/app/actions/campos-agent"
import { Sparkles, Send, Loader2, Copy, Check } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  "¿En cuántas regiones tengo propiedades?",
  "Muéstrame estadísticas de mis CAMPOS",
  "¿Cuál es la región con más propiedades?",
  "Busca todas las propiedades en la región de Los Lagos",
  "¿Cuántos placemarks hay en total?",
]

export function CAMPOSAIAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (prompt: string = input) => {
    if (!prompt.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await streamCAMPOSAgent(prompt)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      // Add a placeholder for the assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: "streaming",
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          fullResponse += chunk

          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.id === "streaming") {
              return [...prev.slice(0, -1), { ...lastMessage, content: fullResponse }]
            }
            return prev
          })
        }
      }

      // Replace streaming message with final message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            {
              id: Date.now().toString(),
              role: "assistant",
              content: fullResponse,
              timestamp: new Date(),
            },
          ]
        }
        return prev
      })
    } catch (error) {
      console.error("[v0] Error in CAMPOS AI agent:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu pregunta. Intenta de nuevo.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto border rounded-lg bg-slate-50 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Sparkles className="h-12 w-12 text-emerald-600 opacity-50" />
            <div>
              <h3 className="font-semibold text-gray-900">Agente IA para CAMPOS</h3>
              <p className="text-sm text-gray-500 mt-1">Haz preguntas sobre tus propiedades, regiones y documentos</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Card key={message.id} className={`${message.role === "user" ? "bg-blue-50" : "bg-white"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        {message.role === "user" ? "Tú" : "Agente IA"}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="shrink-0"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {loading && (
              <Card className="bg-white">
                <CardContent className="pt-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <p className="text-sm text-gray-600">El agente está analizando tu pregunta...</p>
                </CardContent>
              </Card>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Preguntas sugeridas:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(prompt)}
                className="text-xs h-auto py-2 justify-start text-left"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Haz una pregunta sobre tus campos, propiedades o documentos..."
            className="resize-none h-20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleSendMessage()
              }
            }}
            disabled={loading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 h-20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">Usa Ctrl+Enter para enviar</p>
      </div>
    </div>
  )
}
