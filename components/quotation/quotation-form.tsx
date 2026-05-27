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
      // Search KMZ files based on user requirements
      const searchTerms = requirements.toLowerCase()
      
      // Query real KMZ data from Supabase
      const { data: kmzFiles, error: kmzError } = await supabase
        .from("kmz_collection")
        .select("file_name, region, placemarks_count, created_at, file_id")
        .order("created_at", { ascending: false })
        .limit(20)

      if (kmzError) throw kmzError

      // Filter based on search terms
      const matchingFiles = kmzFiles?.filter((f) => {
        const fileName = f.file_name?.toLowerCase() || ""
        const region = f.region?.toLowerCase() || ""
        return searchTerms.split(" ").some(
          (term) => term.length > 2 && (fileName.includes(term) || region.includes(term))
        )
      }) || []

      let response = ""

      if (matchingFiles.length > 0) {
        const fileList = matchingFiles
          .slice(0, 5)
          .map((f, i) => `${i + 1}. **${f.file_name}**\n   - Region: ${f.region || "Sin especificar"}\n   - Puntos/Ubicaciones: ${f.placemarks_count || 0}`)
          .join("\n\n")

        response = `Basado en tu busqueda, encontre ${matchingFiles.length} archivo(s) KMZ relevantes:\n\n${fileList}\n\nPuedes ver estos archivos en la seccion CAMPOS para explorar las ubicaciones en el mapa.`
      } else if (kmzFiles && kmzFiles.length > 0) {
        const totalPoints = kmzFiles.reduce((sum, f) => sum + (f.placemarks_count || 0), 0)
        const regions = [...new Set(kmzFiles.map((f) => f.region).filter(Boolean))]
        
        response = `No encontre coincidencias exactas para "${requirements}", pero tenemos:\n\n- **${kmzFiles.length}** archivos KMZ disponibles\n- **${totalPoints.toLocaleString()}** ubicaciones/puntos totales\n- Regiones: ${regions.slice(0, 5).join(", ") || "Varias"}\n\nVisita la seccion CAMPOS para explorar todas las propiedades disponibles.`
      } else {
        response = `Actualmente no hay archivos KMZ cargados en el sistema.\n\nPara comenzar:\n1. Ve a la seccion CAMPOS\n2. Carga archivos KMZ con ubicaciones de propiedades\n3. Vuelve aqui para buscar propiedades`
      }

      setAiResponse(response)
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
