"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, MessageCircle, Search, TrendingUp, MapPin, Home, Send, Sparkles } from "lucide-react"
import Link from "next/link"

const AI_FEATURES = [
  {
    icon: Search,
    title: "Búsqueda Inteligente",
    description: "Encuentra propiedades usando lenguaje natural",
    example: "Busca: 'Cabaña tranquila cerca del lago para jubilación'",
  },
  {
    icon: TrendingUp,
    title: "Análisis de Mercado",
    description: "Obtén valoraciones y tendencias del mercado inmobiliario",
    example: "Pregunta: '¿Cómo está el mercado en Puerto Varas?'",
  },
  {
    icon: MapPin,
    title: "Recomendaciones Personalizadas",
    description: "Sugerencias basadas en tus preferencias y presupuesto",
    example: "Dile: 'Busco invertir $200M en turismo rural'",
  },
  {
    icon: Home,
    title: "Asesoría Especializada",
    description: "Consejos sobre ubicaciones, precios y oportunidades",
    example: "Consulta: '¿Qué zona es mejor para una cabaña de alquiler?'",
  },
]

const SAMPLE_CONVERSATIONS = [
  {
    user: "Busco una cabaña frente al lago para fines de semana",
    ai: "¡Perfecto! Te recomiendo ver cabañas en Pucón frente al lago Villarrica o en Puerto Varas con vista al Llanquihue. ¿Tienes preferencia por alguna zona específica?",
    properties: 3,
  },
  {
    user: "¿Cuál es el mejor lugar para invertir en turismo?",
    ai: "Basado en datos actuales, Pucón y Puerto Varas tienen alta demanda turística. Castro en Chiloé está emergiendo como destino. Te muestro propiedades con potencial de rentabilidad.",
    properties: 5,
  },
  {
    user: "Quiero una parcela para construir mi casa de retiro",
    ai: "Excelente elección. Valdivia y Frutillar ofrecen parcelas tranquilas con servicios básicos. ¿Prefieres bosque nativo o vista a montañas?",
    properties: 7,
  },
]

export default function AIAssistantSection() {
  const [currentConversation, setCurrentConversation] = useState(0)
  const [userMessage, setUserMessage] = useState("")

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      window.location.href = `/asistente-ia?q=${encodeURIComponent(userMessage)}`
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 rounded-3xl shadow-2xl">
              <Brain className="h-16 w-16 text-white" />
            </div>
          </div>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 px-6 py-3 rounded-full text-lg font-bold mb-8 border border-blue-200">
            <Sparkles className="h-5 w-5" />
            Tecnología de Vanguardia
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Tu Asistente IA{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Inmobiliario
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Revolucionamos la búsqueda de propiedades con inteligencia artificial. Encuentra tu hogar ideal de manera
            más rápida y precisa que nunca.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* AI Features */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-10">¿Qué puede hacer por ti?</h3>
            <div className="space-y-8">
              {AI_FEATURES.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <Card
                    key={index}
                    className="border-l-4 border-l-transparent bg-gradient-to-r from-blue-50 to-green-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-l-blue-500 group"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                          <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                          <div className="bg-white rounded-xl p-4 border-l-4 border-l-blue-500 shadow-sm">
                            <p className="text-sm text-gray-700 italic font-medium">"{feature.example}"</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Interactive Demo */}
          <div>
            <Card className="shadow-2xl border-0 overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Asistente IA Sur Realista</h3>
                    <p className="text-blue-100">Especialista en propiedades del sur de Chile</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">En línea</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* Sample Conversation */}
                <div className="h-96 overflow-y-auto p-8 space-y-6">
                  {SAMPLE_CONVERSATIONS.map((conv, index) => (
                    <div key={index} className={`${index === currentConversation ? "block" : "hidden"}`}>
                      {/* User Message */}
                      <div className="flex justify-end mb-6">
                        <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-2xl rounded-br-md max-w-sm shadow-lg">
                          <p className="font-medium">{conv.user}</p>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-full shadow-lg">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl rounded-bl-md max-w-md shadow-lg">
                          <p className="text-gray-800 leading-relaxed">{conv.ai}</p>
                          <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                            <Home className="h-4 w-4" />
                            {conv.properties} propiedades encontradas
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conversation Selector */}
                <div className="border-t p-6 bg-gray-50">
                  <div className="flex gap-3 mb-6">
                    {SAMPLE_CONVERSATIONS.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentConversation(index)}
                        className={`px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                          index === currentConversation
                            ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg"
                            : "bg-white text-gray-600 hover:bg-gray-100 shadow-md"
                        }`}
                      >
                        Ejemplo {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Try It Input */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Prueba preguntando algo..."
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 h-12 px-6 rounded-xl shadow-lg"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center mt-10">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-12 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-bold"
              >
                <Link href="/asistente-ia">
                  <Brain className="mr-3 h-6 w-6" />
                  Probar Asistente IA Gratis
                </Link>
              </Button>
              <p className="text-gray-500 mt-4 font-medium">
                Sin registro • Respuestas instantáneas • Especializado en el sur de Chile
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-center">
            <div className="group">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-blue-100 font-medium">Consultas Procesadas</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-green-100 font-medium">Precisión en Recomendaciones</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100 font-medium">Disponibilidad</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6 mb-4 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-green-100 font-medium">Propiedades Analizadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
