"use client"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePDFGenerator } from "@/lib/hooks/use-pdf-generator"
import type { PropertyReportData } from "@/lib/services/pdf-service"
import { useToast } from "@/lib/hooks/use-toast"

interface PropertyReportButtonProps {
  data: PropertyReportData
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PropertyReportButton({ data, variant = "outline", size = "default" }: PropertyReportButtonProps) {
  const { generatePropertyReport, generating } = usePDFGenerator()
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      await generatePropertyReport(data)
      toast({
        title: "Reporte generado",
        description: "El reporte PDF se ha descargado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleGenerate} disabled={generating}>
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Generar Reporte PDF
        </>
      )}
    </Button>
  )
}
