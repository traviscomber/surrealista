"use client"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePDFGenerator } from "@/lib/hooks/use-pdf-generator"
import type { FinancialReportData } from "@/lib/services/pdf-service"
import { useToast } from "@/lib/hooks/use-toast"

interface FinancialReportButtonProps {
  data: FinancialReportData
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function FinancialReportButton({ data, variant = "outline", size = "default" }: FinancialReportButtonProps) {
  const { generateFinancialReport, generating } = usePDFGenerator()
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      await generateFinancialReport(data)
      toast({
        title: "Reporte generado",
        description: "El reporte financiero PDF se ha descargado correctamente.",
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
          Generar Reporte Financiero
        </>
      )}
    </Button>
  )
}
