"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Shield,
  MapPin,
  Zap,
  DollarSign,
  Users,
  BookOpen,
  Settings,
  Phone,
  Mail,
} from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
  icon: React.ComponentType<{ className?: string }>
}

const faqData: FAQItem[] = [
  {
    id: "precision",
    question: "¿Qué tan precisa es la IA de Sur-Realista?",
    answer:
      "Nuestra IA tiene una precisión del 94.2% en valoraciones inmobiliarias, basada en análisis de más de 50,000 transacciones en el sur de Chile. Utiliza machine learning avanzado, datos de mercado en tiempo real, y factores geográficos específicos de la región para generar estimaciones altamente confiables.",
    icon: Brain,
  },
  {
    id: "security",
    question: "¿Es segura la información que proporciono?",
    answer:
      "Absolutamente. Implementamos encriptación de grado bancario (AES-256), cumplimos con estándares internacionales de seguridad, y todos los datos se almacenan en servidores seguros en Chile. Tu información personal nunca se comparte con terceros sin tu consentimiento explícito.",
    icon: Shield,
  },
  {
    id: "coverage",
    question: "¿En qué ciudades del sur funciona la IA?",
    answer:
      "Nuestra IA cubre completamente Puerto Varas, Pucón, Valdivia, Osorno, Frutillar, Puerto Montt, Temuco, Villarrica, y más de 25 comunas de las regiones de La Araucanía, Los Ríos y Los Lagos. Constantemente expandimos nuestra cobertura basada en la demanda del mercado.",
    icon: MapPin,
  },
  {
    id: "speed",
    question: "¿Qué tan rápido obtengo resultados?",
    answer:
      "Los análisis básicos se completan en 30-60 segundos. Evaluaciones completas con comparación de mercado, proyecciones financieras y recomendaciones personalizadas toman 2-3 minutos. Nuestros servidores optimizados garantizan respuestas casi instantáneas.",
    icon: Zap,
  },
  {
    id: "investment",
    question: "¿Cuánto cuesta usar la tecnología IA?",
    answer:
      "Consultas básicas son gratuitas. Análisis premium desde $15.000 CLP. Suscripción profesional $45.000 CLP/mes incluye análisis ilimitados, alertas de mercado, y acceso prioritario. Planes empresariales desde $150.000 CLP/mes con API dedicada.",
    icon: DollarSign,
  },
  {
    id: "advisory",
    question: "¿Reemplaza la IA a los asesores humanos?",
    answer:
      "No, la complementa. Nuestros asesores certificados interpretan los resultados de IA, proporcionan contexto local, negocian en tu nombre, y te acompañan en todo el proceso. La IA acelera el análisis, los humanos aportan experiencia y relaciones personales.",
    icon: Users,
  },
  {
    id: "learning",
    question: "¿Cómo aprende y mejora la IA?",
    answer:
      "Utiliza aprendizaje continuo con nuevas transacciones, feedback de usuarios, cambios regulatorios, y tendencias macroeconómicas. Se actualiza semanalmente con datos del Conservador de Bienes Raíces, SII, y fuentes inmobiliarias. Cada interacción mejora su precisión.",
    icon: BookOpen,
  },
  {
    id: "integration",
    question: "¿Se integra con otros sistemas?",
    answer:
      "Sí, ofrecemos API REST para integración con CRM inmobiliarios, sistemas de gestión, portales web, y aplicaciones móviles. Compatible con Salesforce, HubSpot, y principales plataformas inmobiliarias. Documentación completa disponible para desarrolladores.",
    icon: Settings,
  },
  {
    id: "support",
    question: "¿Qué soporte técnico ofrecen?",
    answer:
      "Soporte 24/7 vía chat, email y teléfono. Equipo técnico especializado en IA inmobiliaria. Tiempo de respuesta promedio: 15 minutos en horario comercial, 2 horas fuera de horario. Capacitación gratuita para equipos empresariales.",
    icon: Phone,
  },
]

export function AIFAQ() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Preguntas Frecuentes sobre IA
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Resolvemos tus dudas sobre nuestra tecnología de inteligencia artificial aplicada al mercado inmobiliario
            del sur de Chile.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqData.map((item) => {
            const Icon = item.icon
            const isOpen = openItems.includes(item.id)

            return (
              <Card key={item.id} className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader className="cursor-pointer" onClick={() => toggleItem(item.id)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-left">{item.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </CardTitle>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed pl-13">{item.answer}</p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">¿Tienes más preguntas?</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Nuestro equipo de expertos en IA inmobiliaria está disponible para resolver cualquier duda adicional que
                tengas sobre nuestra tecnología.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Contactar por Email
                </Button>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Export alias for compatibility
export const AIFaq = AIFAQ
