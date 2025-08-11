"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickReplies = [
    "¿Qué propiedades tienen disponibles?",
    "¿Cómo funciona el asistente IA?",
    "Quiero agendar una visita",
    "¿Cuáles son los precios promedio?",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (message.includes("propiedad") || message.includes("casa") || message.includes("terreno")) {
      return "Tenemos una amplia selección de propiedades en Puerto Varas, Pucón, Valdivia y otras ciudades del sur. ¿Te interesa alguna zona en particular? Puedes ver todas nuestras propiedades en la sección 'Propiedades' o usar nuestro cotizador IA."
    }

    if (message.includes("ia") || message.includes("inteligencia") || message.includes("asistente")) {
      return "Nuestro asistente IA utiliza tecnología avanzada para analizar el mercado inmobiliario, valorar propiedades y hacer recomendaciones personalizadas. Tiene una precisión del 94.2% y puede ayudarte con cotizaciones, análisis de mercado y más."
    }

    if (message.includes("visita") || message.includes("agendar") || message.includes("ver")) {
      return "¡Perfecto! Para agendar una visita, puedes contactarnos al +56 9 1234 5678 o completar el formulario de contacto. También puedes usar nuestros tours virtuales 360° disponibles en cada propiedad."
    }

    if (message.includes("precio") || message.includes("costo") || message.includes("valor")) {
      return "Los precios varían según la ubicación y características. En Puerto Varas: $200M-$500M, en Pucón: $180M-$450M, en Valdivia: $150M-$350M. Usa nuestro cotizador IA para obtener una valoración precisa de cualquier propiedad."
    }

    return "Gracias por tu consulta. Soy el asistente de Sur-Realista y estoy aquí para ayudarte con propiedades en el sur de Chile. ¿En qué puedo asistirte específicamente? También puedes llamarnos al +56 9 1234 5678."
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(text),
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                3
              </Badge>
            </div>
          )}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 max-w-[calc(100vw-3rem)]">
          <Card className="h-full flex flex-col shadow-2xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Asistente Sur-Realista
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                  En línea
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2 text-sm">
                        ¡Hola! Soy tu asistente inmobiliario. ¿En qué puedo ayudarte hoy?
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 px-2">Respuestas rápidas:</div>
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply)}
                          className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-2 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${message.sender === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user" ? "bg-blue-600" : "bg-gradient-to-r from-blue-600 to-purple-600"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <User className="h-3 w-3 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-2 text-sm max-w-[80%] ${
                        message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-white" />
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

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 text-sm"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => handleSendMessage(inputValue)}
                    size="sm"
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
