"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, MapPin, Search, Filter, ChevronRight, AlertCircle, Lightbulb } from "lucide-react"
import { ContextualHelp, QuickTips } from "@/components/educational/contextual-help"

export function OnboardingGuide() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const steps = [
    {
      icon: MapPin,
      title: "Selecciona Regiones",
      description: "Haz clic en los checkboxes para elegir una o múltiples regiones donde quieres explorar datos",
    },
    {
      icon: Search,
      title: "Busca Información",
      description: "Usa la barra de búsqueda para encontrar archivos específicos por nombre o ubicación",
    },
    {
      icon: Filter,
      title: "Filtra Resultados",
      description: "Refina tus búsquedas combinando múltiples criterios para obtener exactamente lo que necesitas",
    },
    {
      icon: MapPin,
      title: "Visualiza en el Mapa",
      description: "Ve todos tus datos geográficos en tiempo real en el mapa interactivo de la derecha",
    },
  ]

  const helpItems = [
    {
      question: "¿Cómo cargo archivos KMZ?",
      answer: "Puedes cargar archivos KMZ desde la sección 'Mapas' en el menú superior. Los archivos se procesarán automáticamente y se mostrarán en el mapa.",
    },
    {
      question: "¿Puedo ver datos de múltiples regiones?",
      answer: "Sí! Selecciona varios checkboxes y el sistema cargará los datos de todas las regiones a la vez. Los datos se cargarán progresivamente.",
    },
    {
      question: "¿Qué información puedo buscar?",
      answer: "Puedes buscar por nombre de archivo, números de rol, ubicación geográfica o cualquier metadato asociado a tus campos.",
    },
  ]

  const tips = [
    "Selecciona múltiples regiones para comparar datos entre zonas geográficas",
    "Usa la búsqueda para encontrar rápidamente los campos que necesitas",
    "Haz zoom en el mapa para ver más detalles de cada ubicación",
    "Los datos se guardan automáticamente para que no pierdas tu trabajo",
  ]

  return (
    <div className="space-y-4">
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg text-teal-900">Hola! Bienvenido a CAMPOS</CardTitle>
              <CardDescription className="text-teal-800">
                Aquí puedes explorar, buscar y visualizar todos tus datos geográficos
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-teal-600 hover:text-teal-900 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-teal-100">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                      <Icon className="h-5 w-5 text-teal-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-teal-900">{step.title}</h4>
                    <p className="text-xs text-teal-700 leading-relaxed mt-1">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg border border-teal-100">
            <p className="text-xs text-teal-800">
              <strong className="text-teal-900">Consejo:</strong> Puedes seleccionar múltiples regiones a la vez y los datos se cargarán automáticamente. Los archivos aparecerán en el mapa mientras se procesan.
            </p>
          </div>
        </CardContent>
      </Card>

      <ContextualHelp title="Preguntas Frecuentes sobre CAMPOS" items={helpItems} />
      <QuickTips tips={tips} />
    </div>
  )
}
