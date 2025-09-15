"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Sparkles, FileText, MessageSquare } from "lucide-react"

export function AIWorkspace() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState("")

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setResult(`Resultado generado para: "${prompt}"`)
      setIsGenerating(false)
    }, 2000)
  }

  const aiTools = [
    {
      title: "Generador de Descripciones",
      description: "Crea descripciones atractivas para propiedades",
      icon: FileText,
      action: () => setPrompt("Genera una descripción para una casa de 3 habitaciones..."),
    },
    {
      title: "Asistente de Chat",
      description: "Mejora las respuestas automáticas del chat",
      icon: MessageSquare,
      action: () => setPrompt("Crea una respuesta profesional para consultas sobre precios..."),
    },
    {
      title: "Análisis de Mercado",
      description: "Genera insights sobre tendencias inmobiliarias",
      icon: Brain,
      action: () => setPrompt("Analiza las tendencias del mercado inmobiliario actual..."),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Workspace de IA</h1>
        <p className="text-gray-600">Herramientas de inteligencia artificial para Sur-Realista</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiTools.map((tool) => (
          <Card key={tool.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={tool.action}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <tool.icon className="w-5 h-5 text-blue-600" />
                {tool.title}
              </CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generador de Contenido IA
          </CardTitle>
          <CardDescription>Ingresa tu prompt y genera contenido personalizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe lo que quieres generar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />

          <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full">
            {isGenerating ? "Generando..." : "Generar Contenido"}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{result}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
