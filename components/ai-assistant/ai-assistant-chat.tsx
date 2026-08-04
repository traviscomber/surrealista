"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Database, HelpCircle, Send, User } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    type?: string
    confidence?: number
  }
}

const initialMessage: Message = {
  id: "initial",
  role: "assistant",
  content:
    "Puedo ayudarte a consultar la información disponible en la plataforma: inventario KMZ, regiones, roles, propiedades y documentos conectados. Cuando una fuente no esté disponible o un dato requiera validación oficial, lo indicaré expresamente.",
  timestamp: new Date(),
  metadata: { type: "general" },
}

export function AIAssistantChat() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const recordInteraction = async (message: Message) => {
    const { error } = await supabase.from("agent_interactions").insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      metadata: message.metadata || {},
    })

    if (error) console.warn("[assistant] interaction log unavailable", error)
  }

  const getResponse = async (userMessage: string): Promise<Message> => {
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) throw new Error(`Assistant request failed with ${response.status}`)

      const data = await response.json()
      return {
        id: uuidv4(),
        role: "assistant",
        content:
          data.response ||
          "No encontré una respuesta verificable con las fuentes disponibles. Revisa el módulo correspondiente o reformula la consulta.",
        timestamp: new Date(),
        metadata: { type: data.type || "general", confidence: data.confidence },
      }
    } catch (error) {
      console.error("[assistant] request failed", error)
      return {
        id: uuidv4(),
        role: "assistant",
        content:
          "No fue posible procesar la consulta en este momento. Intenta nuevamente; si el problema continúa, revisa la disponibilidad del servicio.",
        timestamp: new Date(),
        metadata: { type: "error" },
      }
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || input).trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsLoading(true)
    void recordInteraction(userMessage)

    const assistantMessage = await getResponse(textToSend)
    setMessages((current) => [...current, assistantMessage])
    void recordInteraction(assistantMessage)
    setIsLoading(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSendMessage()
    }
  }

  return (
    <section className="flex h-[760px] w-full flex-col overflow-hidden border border-border bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="sr-panel-title truncate">Asistente de análisis</h2>
            <p className="sr-meta mt-0.5 truncate">Consulta las fuentes conectadas a la plataforma</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void handleSendMessage("Explica qué fuentes puedes consultar y cuáles son tus límites.")}>
          <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Alcance
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-background/45 px-5 py-5">
        <div className="space-y-5">
          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <article key={message.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser ? (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
                    <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                ) : null}

                <div
                  className={`max-w-[78%] px-4 py-3 text-sm leading-6 ${
                    isUser
                      ? "rounded-md bg-primary text-primary-foreground"
                      : "rounded-md border border-border bg-card text-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  <div className={`mt-2 flex items-center gap-3 text-[11px] ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <time>
                      {message.timestamp.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {!isUser && typeof message.metadata?.confidence === "number" ? (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                        Confianza informada: {Math.round(message.metadata.confidence * 100)}%
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {isUser ? (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                ) : null}
              </article>
            )
          })}

          {isLoading ? (
            <div className="flex items-center gap-3" role="status" aria-live="polite">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-primary">
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Consultando fuentes disponibles…
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t border-border bg-card px-5 py-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta por KMZ, regiones, roles, propiedades o documentos…"
            className="min-h-[46px] max-h-32 flex-1 resize-none"
            disabled={isLoading}
            aria-label="Consulta para el asistente"
          />
          <Button
            onClick={() => void handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="h-[46px] w-[46px] px-0"
            aria-label="Enviar consulta"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3" aria-hidden="true" />
          Las respuestas dependen de las fuentes conectadas y requieren validación cuando corresponda.
        </div>
      </footer>
    </section>
  )
}
