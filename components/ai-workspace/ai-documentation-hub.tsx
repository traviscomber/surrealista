"use client"

import { useState } from "react"
import { Search, FileText, FolderOpen, Calendar, Download, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para documentos generados por IA
const documents = [
  {
    id: 1,
    title: "Análisis de mercado inmobiliario en Pucón",
    description:
      "Estudio detallado del mercado inmobiliario en Pucón, incluyendo tendencias de precios y oportunidades de inversión.",
    type: "Análisis de Mercado",
    date: "2023-11-15",
    tags: ["Pucón", "Análisis", "Inversión"],
    aiAgent: "MarketAnalyst-GPT",
  },
  {
    id: 2,
    title: "Valoración de propiedades en Puerto Varas",
    description:
      "Metodología y resultados de valoración automatizada de propiedades en Puerto Varas basada en datos históricos.",
    type: "Valoración",
    date: "2023-12-02",
    tags: ["Puerto Varas", "Valoración", "Precios"],
    aiAgent: "PropertyValuation-AI",
  },
  {
    id: 3,
    title: "Segmentación de clientes potenciales",
    description:
      "Segmentación de clientes potenciales basada en comportamiento de navegación y preferencias de búsqueda.",
    type: "Segmentación",
    date: "2024-01-10",
    tags: ["Clientes", "Segmentación", "Marketing"],
    aiAgent: "CustomerInsight-AI",
  },
  {
    id: 4,
    title: "Predicción de tendencias para 2024",
    description: "Predicciones sobre tendencias del mercado inmobiliario en el sur de Chile para el año 2024.",
    type: "Predicción",
    date: "2024-01-20",
    tags: ["Tendencias", "Predicción", "2024"],
    aiAgent: "TrendPredictor-GPT",
  },
  {
    id: 5,
    title: "Optimización de listados de propiedades",
    description:
      "Recomendaciones para optimizar la presentación y descripción de propiedades basadas en análisis de engagement.",
    type: "Optimización",
    date: "2024-02-05",
    tags: ["Listados", "Optimización", "Engagement"],
    aiAgent: "ContentOptimizer-AI",
  },
]

export function AIDocumentationHub() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === "all" || doc.type === selectedType

    return matchesSearch && matchesType
  })

  const documentTypes = ["all", ...new Set(documents.map((doc) => doc.type))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Centro de Documentación IA</h2>
          <p className="text-gray-500">Gestiona y accede a documentos generados por agentes de IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Nueva Carpeta
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Solicitar Documento
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar documentos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setSelectedType}>
          <TabsList>
            {documentTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type === "all" ? "Todos" : type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>{doc.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(doc.date).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">{doc.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="font-medium">Generado por:</span> {doc.aiAgent}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-3 border-t">
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">No se encontraron documentos</h3>
          <p className="text-gray-500">Intenta con otros términos de búsqueda o filtros</p>
        </div>
      )}
    </div>
  )
}
