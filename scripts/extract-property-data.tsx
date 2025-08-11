"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Download, ExternalLink, Database } from "lucide-react"

interface PropertyData {
  id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  square_meters: number
  property_type: string
  description: string
  features: string[]
  images: string[]
  source_url: string // Nueva columna agregada
  extracted_at: string
}

interface ExtractionResult {
  success: boolean
  total_processed: number
  total_extracted: number
  errors: string[]
  properties: PropertyData[]
}

export default function ExtractPropertyData() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [selectedSource, setSelectedSource] = useState<string>("portalinmobiliario")

  const sources = [
    {
      id: "portalinmobiliario",
      name: "Portal Inmobiliario",
      url: "https://www.portalinmobiliario.com",
      description: "Principal portal inmobiliario de Chile",
    },
    {
      id: "yapo",
      name: "Yapo.cl",
      url: "https://www.yapo.cl",
      description: "Clasificados online con sección inmobiliaria",
    },
    {
      id: "toctoc",
      name: "TocToc.com",
      url: "https://www.toctoc.com",
      description: "Plataforma inmobiliaria digital",
    },
  ]

  const extractData = async () => {
    setLoading(true)
    setProgress(0)
    setResult(null)

    try {
      // Simular proceso de extracción con progreso
      const steps = [
        "Conectando a la fuente de datos...",
        "Obteniendo listados de propiedades...",
        "Extrayendo datos básicos...",
        "Procesando imágenes...",
        "Extrayendo características...",
        "Guardando URLs de origen...", // Nuevo paso para source_url
        "Validando datos...",
        "Guardando en base de datos...",
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        setProgress(((i + 1) / steps.length) * 100)
      }

      // Datos demo con source_url incluido
      const mockResult: ExtractionResult = {
        success: true,
        total_processed: 150,
        total_extracted: 142,
        errors: ["8 propiedades sin precio válido", "2 propiedades con imágenes faltantes"],
        properties: [
          {
            id: "ext_001",
            title: "Casa con Vista al Lago Llanquihue",
            price: 285000000,
            location: "Puerto Varas, Los Lagos",
            bedrooms: 4,
            bathrooms: 3,
            square_meters: 180,
            property_type: "casa",
            description: "Hermosa casa con vista panorámica al lago Llanquihue...",
            features: ["vista al lago", "jardín", "terraza", "chimenea"],
            images: ["/images/property-sample-1.png", "/images/property-sample-2.png"],
            source_url: "https://www.portalinmobiliario.com/venta/casa/puerto-varas/12345", // URL de origen
            extracted_at: new Date().toISOString(),
          },
          {
            id: "ext_002",
            title: "Departamento Moderno Centro Pucón",
            price: 195000000,
            location: "Pucón, La Araucanía",
            bedrooms: 2,
            bathrooms: 2,
            square_meters: 85,
            property_type: "departamento",
            description: "Moderno departamento en el centro de Pucón...",
            features: ["balcón", "estacionamiento", "bodega"],
            images: ["/images/property-sample-3.png", "/images/property-sample-4.png"],
            source_url: "https://www.portalinmobiliario.com/venta/departamento/pucon/67890", // URL de origen
            extracted_at: new Date().toISOString(),
          },
          {
            id: "ext_003",
            title: "Parcela con Bosque Nativo Valdivia",
            price: 120000000,
            location: "Valdivia, Los Ríos",
            bedrooms: 0,
            bathrooms: 0,
            square_meters: 5000,
            property_type: "terreno",
            description: "Hermosa parcela con bosque nativo y río...",
            features: ["bosque nativo", "río", "acceso vehicular"],
            images: ["/images/property-sample-5.png", "/images/property-sample-6.png"],
            source_url: "https://www.portalinmobiliario.com/venta/parcela/valdivia/54321", // URL de origen
            extracted_at: new Date().toISOString(),
          },
        ],
      }

      setResult(mockResult)
    } catch (error) {
      console.error("Error extracting data:", error)
      setResult({
        success: false,
        total_processed: 0,
        total_extracted: 0,
        errors: ["Error de conexión con la fuente de datos"],
        properties: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!result) return

    const dataStr = JSON.stringify(result.properties, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `extracted_properties_${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Extractor de Datos de Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fuente de Datos:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedSource === source.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedSource(source.id)}
                  >
                    <div className="font-medium">{source.name}</div>
                    <div className="text-sm text-gray-600">{source.description}</div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {source.url}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={extractData} disabled={loading} className="flex-1">
                {loading ? "Extrayendo..." : "Iniciar Extracción"}
              </Button>
              {result && (
                <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de extracción</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Resultado de la Extracción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.total_processed}</div>
                  <div className="text-sm text-gray-600">Propiedades Procesadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.total_extracted}</div>
                  <div className="text-sm text-gray-600">Extraídas Exitosamente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Errores encontrados:</h4>
                  <div className="space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <strong>Actualización:</strong> El extractor ahora captura y guarda la URL de origen de cada propiedad
                en la columna <code>source_url</code> para mantener trazabilidad completa de los datos.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Propiedades Extraídas (Muestra)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.properties.slice(0, 3).map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-gray-600">{property.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${(property.price / 1000000).toFixed(0)}M</div>
                        <Badge variant="outline">{property.property_type}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                      <div>Dormitorios: {property.bedrooms}</div>
                      <div>Baños: {property.bathrooms}</div>
                      <div>m²: {property.square_meters}</div>
                      <div>Características: {property.features.length}</div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      <strong>URL de origen:</strong>{" "}
                      <a
                        href={property.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 inline-flex"
                      >
                        {property.source_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {property.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {property.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{property.features.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
