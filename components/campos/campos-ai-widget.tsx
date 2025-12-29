"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Send, Sparkles } from "lucide-react"
import { useChat } from "ai/react"

interface CAMPOSAIWidgetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CAMPOSAIWidget({ isOpen, onOpenChange }: CAMPOSAIWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/campos-agent",
    initialMessages: [
      {
        id: "initial",
        role: "assistant",
        content:
          "¡Hola! Soy tu asistente IA especializado en CAMPOS. Puedo ayudarte a buscar propiedades por región, obtener estadísticas, analizar distribuciones geográficas y responder preguntas sobre tus datos. ¿En qué puedo ayudarte?",
      },
    ],
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const quickQuestions = [
    "¿En cuántas regiones tengo propiedades?",
    "Busca propiedades en Los Lagos",
    "¿Cuántos archivos KMZ tengo en total?",
    "Análisis de distribución geográfica",
  ]

  const handleQuickQuestion = (question: string) => {
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    // Temporarily set input value for submission
    const mockInput = question
    handleInputChange({ target: { value: question } } as any)

    // Use setTimeout to ensure input is updated before submission
    setTimeout(() => {
      const formData = new FormData()
      formData.append("message", question)
      handleSubmit(fakeEvent)
    }, 0)
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => onOpenChange(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] max-w-[calc(100vw-3rem)]">
          <Card className="h-full flex flex-col shadow-2xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Asistente IA CAMPOS
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                  En línea
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user" ? "bg-emerald-600" : "bg-gradient-to-r from-emerald-600 to-teal-600"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div
                      className={`rounded-lg p-3 text-sm max-w-[80%] ${
                        message.role === "user" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 1 && (
                  <div className="space-y-2 mt-2">
                    <div className="text-xs text-gray-500 px-2">Preguntas sugeridas:</div>
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="block w-full text-left text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg p-2 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
