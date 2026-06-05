"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Bot, Loader2 } from "lucide-react"

export function QuotationForm() {
  const { toast } = useToast()
  const [requirements, setRequirements] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requirements.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe la propiedad que buscas.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements }),
      })

      if (!response.ok) {
        throw new Error("Error en la cotización")
      }

      const data = await response.json()
      setAiResponse(data.quotation)
      
      toast({
        title: "Cotización generada",
        description: "Análisis completado usando datos reales del mercado inmobiliario chileno.",
      })
    } catch (error) {
      console.error("Quotation error:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <Textarea
            placeholder="Describe la propiedad que estás buscando. Por ejemplo: Busco una casa en Puerto Varas con 3 dormitorios, cerca del lago, con un presupuesto de 350 millones."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Obtener Recomendaciones
            </>
          )}
        </Button>
      </form>

      {aiResponse && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Bot className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Cotización Inteligente</h3>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {aiResponse.split("\n\n").map((paragraph, pIdx) => (
                <div key={pIdx} className="mb-4">
                  {paragraph.split("\n").map((line, lIdx) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <h4 key={lIdx} className="font-semibold text-base mb-2 text-foreground">
                          {line.replace(/\*\*/g, "")}
                        </h4>
                      )
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <p key={lIdx} className="ml-4 mb-1 text-muted-foreground">
                          {line}
                        </p>
                      )
                    }
                    if (line.startsWith("✅") || line.startsWith("⚠️")) {
                      return (
                        <p key={lIdx} className="font-semibold mb-1 text-foreground">
                          {line}
                        </p>
                      )
                    }
                    return (
                      <p key={lIdx} className="mb-1 text-muted-foreground">
                        {line}
                      </p>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
