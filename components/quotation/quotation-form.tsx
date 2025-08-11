"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
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
        description: "Por favor, describe tus requerimientos.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real application, this would call an AI service
      // For now, we'll simulate a response after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate AI response
      const simulatedResponse = `
Basado en tus requerimientos, te recomiendo las siguientes propiedades:

1. **Casa en Puerto Varas** - $350.000.000
   - 3 dormitorios, 2 baños
   - 150m² construidos, 500m² de terreno
   - Vista al lago y volcán
   - [Ver propiedad](/propiedades/1)

2. **Parcela en Frutillar** - $280.000.000
   - 2 dormitorios, 2 baños
   - 120m² construidos, 5000m² de terreno
   - Acceso a lago
   - [Ver propiedad](/propiedades/2)

3. **Departamento en Puerto Montt** - $180.000.000
   - 2 dormitorios, 1 baño
   - 75m² construidos
   - Vista a la bahía
   - [Ver propiedad](/propiedades/3)

¿Te gustaría más información sobre alguna de estas propiedades?
      `

      setAiResponse(simulatedResponse)

      // Save the quotation to the database
      const { error } = await supabase.from("quotations").insert({
        requirements,
        ai_response: simulatedResponse,
        status: "completed",
      })

      if (error) throw error
    } catch (error) {
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
              <h3 className="text-lg font-semibold">Recomendaciones de IA</h3>
            </div>
            <div className="prose prose-sm max-w-none">
              {aiResponse.split("\n").map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
