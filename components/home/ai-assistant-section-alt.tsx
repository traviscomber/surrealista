"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bot, ArrowRight } from "lucide-react"
import { AnimatedSection } from "@/components/ui/animated-section"

export function AIAssistantSectionAlt() {
  // Esta es una versión alternativa que podemos usar si la primera no funciona
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <AnimatedSection direction="left">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1080&q=80"
                alt="Asistente IA para búsqueda de propiedades"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Error loading AI assistant image (alt)")
                  e.currentTarget.src = `/placeholder.svg?height=400&width=600&query=AI%20assistant%20futuristic`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent mix-blend-multiply"></div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="space-y-6">
              <div className="inline-block p-2 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Asistente IA para encontrar tu propiedad ideal</h2>
              <p className="text-lg text-gray-600">
                Nuestro asistente de inteligencia artificial analiza tus preferencias y necesidades para recomendarte
                las propiedades que mejor se adaptan a ti. Responde preguntas, ofrece consejos personalizados y te guía
                en todo el proceso.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/20 p-1 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Recomendaciones personalizadas basadas en tus preferencias</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/20 p-1 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Respuestas instantáneas a tus preguntas sobre propiedades</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/20 p-1 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Información detallada sobre zonas, servicios y amenidades</span>
                </li>
              </ul>
              <Button asChild className="group mt-4">
                <Link href="/asistente-ia" className="flex items-center">
                  Probar Asistente IA
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
