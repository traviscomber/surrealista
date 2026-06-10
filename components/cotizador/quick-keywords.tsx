"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export interface QuickKeyword {
  id: string
  label: string
  category: "resources" | "crops" | "livestock" | "infrastructure" | "conservation" | "development"
}

export const QUICK_KEYWORDS: QuickKeyword[] = [
  // Recursos Hídricos
  { id: "agua", label: "#Agua", category: "resources" },
  { id: "riego", label: "#Riego", category: "resources" },
  { id: "derechos-agua", label: "#DerechosDeAgua", category: "resources" },
  { id: "orilla-lago", label: "#OrillaDeL ago", category: "resources" },
  { id: "orilla-rio", label: "#OrillaDeRío", category: "resources" },
  { id: "pozo", label: "#Pozo", category: "resources" },

  // Cultivos
  { id: "fruticola", label: "#Frutícola", category: "crops" },
  { id: "trumao", label: "#Trumao", category: "crops" },
  { id: "mecanizable", label: "#Mecanizable", category: "crops" },

  // Ganadería
  { id: "ganadero", label: "#Ganadero", category: "livestock" },
  { id: "lechero", label: "#Lechero", category: "livestock" },
  { id: "forestal", label: "#Forestal", category: "livestock" },

  // Conservación
  { id: "conservacion", label: "#Conservación", category: "conservation" },
  { id: "turismo", label: "#Turismo", category: "conservation" },
  { id: "bosque-nativo", label: "#BosqueNativo", category: "conservation" },
  { id: "carbono", label: "#PotencialCarbono", category: "conservation" },

  // Infraestructura
  { id: "infraestructura", label: "#Infraestructura", category: "infrastructure" },
  { id: "energia-trifasica", label: "#EnergíaTrifásica", category: "infrastructure" },
  { id: "aeródromo", label: "#Aeródromo", category: "infrastructure" },

  // Desarrollo Inmobiliario
  { id: "subdivisible", label: "#Subdivisible", category: "development" },
  { id: "inmobiliario", label: "#Inmobiliario", category: "development" },
]

const categoryColors: Record<QuickKeyword["category"], string> = {
  resources: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  crops: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  livestock: "bg-red-100 text-red-700 hover:bg-red-200",
  infrastructure: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  conservation: "bg-green-100 text-green-700 hover:bg-green-200",
  development: "bg-pink-100 text-pink-700 hover:bg-pink-200",
}

interface QuickKeywordsProps {
  selectedKeywords: string[]
  onChange: (keywords: string[]) => void
}

export function QuickKeywords({ selectedKeywords, onChange }: QuickKeywordsProps) {
  const handleToggle = (id: string) => {
    const newKeywords = selectedKeywords.includes(id)
      ? selectedKeywords.filter((k) => k !== id)
      : [...selectedKeywords, id]
    onChange(newKeywords)
  }

  const groupedKeywords = QUICK_KEYWORDS.reduce(
    (acc, keyword) => {
      if (!acc[keyword.category]) {
        acc[keyword.category] = []
      }
      acc[keyword.category].push(keyword)
      return acc
    },
    {} as Record<QuickKeyword["category"], QuickKeyword[]>
  )

  const categoryLabels: Record<QuickKeyword["category"], string> = {
    resources: "Recursos Hídricos",
    crops: "Cultivos",
    livestock: "Ganadería",
    infrastructure: "Infraestructura",
    conservation: "Conservación",
    development: "Desarrollo",
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Palabras Clave Rápidas</CardTitle>
          </div>
          <CardDescription>
            Selecciona palabras clave para clasificar rápidamente la propiedad
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {Object.entries(groupedKeywords).map(([category, keywords]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">
                {categoryLabels[category as QuickKeyword["category"]]}
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <button
                    key={keyword.id}
                    onClick={() => handleToggle(keyword.id)}
                    className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all cursor-pointer ${
                      selectedKeywords.includes(keyword.id)
                        ? categoryColors[keyword.category]
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {keyword.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {selectedKeywords.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Seleccionadas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedKeywords.map((keywordId) => {
                  const keyword = QUICK_KEYWORDS.find((k) => k.id === keywordId)
                  return keyword ? (
                    <Badge
                      key={keywordId}
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium"
                    >
                      {keyword.label}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
