"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, Sparkles } from "lucide-react"
import { useChat } from "ai/react"

export type CAMPOSAgentContext = {
  title?: string | null
  role?: string | null
  owner?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string
  source?: string
  capturedAt?: string
}

interface CAMPOSAIWidgetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  context?: CAMPOSAgentContext | null
}

export function CAMPOSAIWidget({ isOpen, onOpenChange, context }: CAMPOSAIWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/campos-agent",
    body: {
      context,
    },
    initialMessages: [
      {
        id: "initial",
        role: "assistant",
        content:
          "¡Hola! Soy tu asistente IA especializado en CAMPOS. Puedo ayudarte a analizar expedientes territoriales, propiedades, documentos y datos geográficos.",
      },
    ],
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] max-w-[calc(100vw-3rem)]">
          <Card className="h-full flex flex-col shadow-2xl">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Asistente IA CAMPOS
                <Badge className="ml-auto text-xs">En línea</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate">{contextLabel}</p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}>
                    {message.content}
                  </div>
                ))}
                {isLoading && <div className="text-sm text-muted-foreground">Analizando expediente...</div>}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
                <Input value={input} onChange={handleInputChange} placeholder="Pregunta sobre el predio..." disabled={isLoading} />
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
