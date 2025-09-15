import { SIICoordinateExtractor } from "@/components/sii/sii-coordinate-extractor"

export default function SIIExtractorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Extractor de Coordenadas SII</h1>
        <p className="text-muted-foreground mt-2">
          Herramienta para extraer coordenadas de propiedades desde el sitio oficial del SII
        </p>
      </div>

      <SIICoordinateExtractor />
    </div>
  )
}
