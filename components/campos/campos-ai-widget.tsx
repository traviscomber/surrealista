"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, Sparkles } from "lucide-react"

export type CAMPOSAgentContext = {
  title?: string | null
  role?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string | null
  source?: string | null
  capturedAt?: string | null
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

interface CAMPOSAIWidgetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  context?: CAMPOSAgentContext | null
}

const initialMessage: ChatMessage = {
  id: "initial",
  role: "assistant",
  content:
    "Soy el copiloto territorial de CAMPOS. Analizo expedientes, documentos y contexto geográfico sin sustituir evidencia registral.",
}

const buildBriefing = (context?: CAMPOSAgentContext | null) => {
  if (!context?.title) {
    return "Selecciona un expediente para activar el análisis territorial."
  }

  return [
    `Expediente activo: ${context.title}`,
    context.role ? `ROL: ${context.role}` : null,
    context.commune ? `Comuna: ${context.commune}` : null,
    context.area ? `Superficie: ${context.area}` : null,
    "Puedes preguntar por riesgos, documentos, ubicación o análisis territorial. Los antecedentes de dominio requieren evidencia documental verificable.",
  ]
    .filter(Boolean)
    .join("\n")
}

export function CAMPOSAIWidget({ isOpen, onOpenChange, context }: CAMPOSAIWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const briefingRef = useRef("")
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const nextBriefing = buildBriefing(context)
    if (!isOpen || briefingRef.current === nextBriefing || !context?.title) return

    briefingRef.current = nextBriefing
    setMessages((current) => [
      ...current,
      {
        id: `briefing-${Date.now()}`,
        role: "assistant",
        content: `Contexto cargado:\n\n${nextBriefing}`,
      },
    ])
  }, [context, isOpen])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    }
    const assistantId = `assistant-${Date.now()}`

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/campos-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const detail = payload?.error === "Unauthorized"
          ? "Tu sesión no está autorizada para usar el copiloto CAMPOS."
          : payload?.error || "No fue posible procesar la consulta."
        throw new Error(detail)
      }

      if (!response.body) {
        throw new Error("El servidor no entregó una respuesta utilizable.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages((current) =>
          current.map((item) => (item.id === assistantId ? { ...item, content } : item)),
        )
      }

      content += decoder.decode()
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: content || "La consulta terminó sin contenido disponible." }
            : item,
        ),
      )
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No fue posible procesar la consulta."
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: detail }
            : item,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const contextLabel = context?.title
    ? `${context.title}${context.role ? ` · ROL ${context.role}` : ""}`
    : "Sin expediente seleccionado"

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button onClick={() => onOpenChange(!isOpen)} className="h-14 w-14 rounded-full" size="icon">
          {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 h-[500px] w-96 max-w-[calc(100vw-3rem)]">
          <Card className="flex h-full flex-col shadow-2xl">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" />
                Asistente IA CAMPOS
                <Badge className="ml-auto text-xs">En línea</Badge>
              </CardTitle>
              <p className="truncate text-xs text-muted-foreground">{contextLabel}</p>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col p-0">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg p-3 text-sm ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {message.content}
                  </div>
                ))}
                {isLoading && <div className="text-sm text-muted-foreground">Analizando expediente...</div>}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pregunta sobre el predio..."
                  disabled={isLoading}
                  maxLength={4000}
                />
                <Button type="submit" disabled={!input.trim() || isLoading} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
