import { Suspense } from "react"
import ComprehensivePropertyAnalysis from "@/components/integrations/comprehensive-property-analysis"

export default function AnalisisIntegralPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Análisis Integral de Propiedades</h1>
        <p className="text-gray-600 mt-2">
          Análisis completo combinando datos de SII, SIRENE, CBR, OpenStreetMap y Banco Central
        </p>
      </div>

      <Suspense fallback={<div>Cargando análisis...</div>}>
        <ComprehensivePropertyAnalysis />
      </Suspense>
    </div>
  )
}
