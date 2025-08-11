"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Download, FileText, Database, CheckCircle, Package, Calendar, Filter } from 'lucide-react'

interface StandardizedExporterProps {
  stats: {
    totalProperties: number
    standardizedProperties: number
    qualityScore: number
    completionPercentage: number
  }
}

interface ExportFormat {
  id: string
  name: string
  description: string
  extension: string
  icon: React.ReactNode
  features: string[]
}

interface ExportFilter {
  id: string
  name: string
  description: string
  enabled: boolean
}

export default function StandardizedExporter({ stats }: StandardizedExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState("csv")
  const [exportFilters, setExportFilters] = useState<ExportFilter[]>([
    {
      id: "standardized-only",
      name: "Solo Propiedades Estandarizadas",
      description: "Exportar únicamente propiedades que han pasado por el proceso de estandarización",
      enabled: true
    },
    {
      id: "high-quality",
      name: "Alta Calidad (80%+)",
      description: "Incluir solo propiedades con puntuación de calidad superior al 80%",
      enabled: false
    },
    {
      id: "complete-fields",
      name: "Campos Completos",
      description: "Exportar solo propiedades con todos los campos requeridos completos",
      enabled: false
    },
    {
      id: "validated-contacts",
      name: "Contactos Validados",
      description: "Incluir solo propiedades con información de contacto validada",
      enabled: false
    }
  ])
  const [exporting, setExporting] = useState(false)

  const exportFormats: ExportFormat[] = [
    {
      id: "csv",
      name: "CSV Estandarizado",
      description: "Formato CSV con estructura estandarizada para importación",
      extension: ".csv",
      icon: <FileText className="h-5 w-5" />,
      features: ["Compatible con Excel", "Estructura estandarizada", "Encoding UTF-8"]
    },
    {
      id: "json",
      name: "JSON Estructurado",
      description: "Formato JSON con metadatos de calidad y validación",
      extension: ".json",
      icon: <Database className="h-5 w-5" />,
      features: ["Metadatos incluidos", "Estructura jerárquica", "Fácil integración API"]
    },
    {
      id: "excel",
      name: "Excel Avanzado",
      description: "Archivo Excel con múltiples hojas y formato avanzado",
      extension: ".xlsx",
      icon: <Package className="h-5 w-5" />,
      features: ["Múltiples hojas", "Formato condicional", "Gráficos de calidad"]
    }
  ]

  const toggleFilter = (filterId: string) => {
    setExportFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, enabled: !filter.enabled } : filter
    ))
  }

  const getEstimatedCount = () => {
    let count = stats.totalProperties
    
    if (exportFilters.find(f => f.id === "standardized-only")?.enabled) {
      count = stats.standardizedProperties
    }
    
    if (exportFilters.find(f => f.id === "high-quality")?.enabled) {
      count = Math.floor(count * 0.6) // Estimate 60% have high quality
    }
    
    if (exportFilters.find(f => f.id === "complete-fields")?.enabled) {
      count = Math.floor(count * 0.8) // Estimate 80% have complete fields
    }
    
    if (exportFilters.find(f => f.id === "validated-contacts")?.enabled) {
      count = Math.floor(count * 0.75) // Estimate 75% have validated contacts
    }
    
    return Math.max(1, count)
  }

  const handleExport = async () => {
    setExporting(true)
    
    try {
      const selectedFormatData = exportFormats.find(f => f.id === selectedFormat)
      const estimatedCount = getEstimatedCount()
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock data based on format
      let content = ""
      let mimeType = ""
      let filename = ""
      
      switch (selectedFormat) {
        case "csv":
          content = generateCSVContent(estimatedCount)
          mimeType = "text/csv;charset=utf-8"
          filename = `propiedades-estandarizadas-${new Date().toISOString().split('T')[0]}.csv`
          break
        case "json":
          content = generateJSONContent(estimatedCount)
          mimeType = "application/json"
          filename = `propiedades-estandarizadas-${new Date().toISOString().split('T')[0]}.json`
          break
        case "excel":
          // For demo purposes, we'll export as CSV but with Excel filename
          content = generateCSVContent(estimatedCount)
          mimeType = "text/csv;charset=utf-8"
          filename = `propiedades-estandarizadas-${new Date().toISOString().split('T')[0]}.xlsx`
          break
      }
      
      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error("Export error:", error)
      alert("Error durante la exportación")
    } finally {
      setExporting(false)
    }
  }

  const generateCSVContent = (count: number) => {
    const headers = [
      "ID",
      "Título",
      "Nombre Contacto",
      "Teléfono Contacto",
      "Email Contacto",
      "Región",
      "Propietario",
      "Rol",
      "Derechos de Agua",
      "Puntuación Calidad",
      "Estado Estandarización",
      "Fecha Última Actualización"
    ].join(",")
    
    const rows = Array.from({ length: count }, (_, i) => [
      `prop-${i + 1}`,
      `Propiedad Estandarizada ${i + 1}`,
      `Contacto ${i + 1}`,
      `+56912345${String(i).padStart(3, '0')}`,
      `contacto${i + 1}@email.com`,
      "Metropolitana",
      `Propietario ${i + 1}`,
      `${100 + i}-${String(i).padStart(2, '0')}`,
      i % 2 === 0 ? "Sí" : "No",
      Math.floor(Math.random() * 20) + 80, // Quality score 80-100
      "Estandarizada",
      new Date().toISOString().split('T')[0]
    ].join(","))
    
    return `${headers}\n${rows.join("\n")}`
  }

  const generateJSONContent = (count: number) => {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: count,
        qualityScore: stats.qualityScore,
        standardizationLevel: "Phase 1 Complete",
        filters: exportFilters.filter(f => f.enabled).map(f => f.name)
      },
      properties: Array.from({ length: count }, (_, i) => ({
        id: `prop-${i + 1}`,
        title: `Propiedad Estandarizada ${i + 1}`,
        contact: {
          name: `Contacto ${i + 1}`,
          phone: `+56912345${String(i).padStart(3, '0')}`,
          email: `contacto${i + 1}@email.com`
        },
        location: {
          region: "Metropolitana",
          address: `Dirección ${i + 1}`
        },
        owner: `Propietario ${i + 1}`,
        propertyRol: `${100 + i}-${String(i).padStart(2, '0')}`,
        waterRights: i % 2 === 0,
        quality: {
          score: Math.floor(Math.random() * 20) + 80,
          standardized: true,
          lastUpdated: new Date().toISOString()
        }
      }))
    }
    
    return JSON.stringify(data, null, 2)
  }

  return (
    <div className="space-y-6">
      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resumen de Exportación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalProperties}</div>
              <div className="text-sm text-gray-600">Total Propiedades</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.standardizedProperties}</div>
              <div className="text-sm text-gray-600">Estandarizadas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.qualityScore}%</div>
              <div className="text-sm text-gray-600">Calidad Promedio</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{getEstimatedCount()}</div>
              <div className="text-sm text-gray-600">Para Exportar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formato de Exportación
          </CardTitle>
          <CardDescription>
            Selecciona el formato que mejor se adapte a tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
            <div className="space-y-4">
              {exportFormats.map((format) => (
                <div key={format.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={format.id} id={format.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={format.id} className="flex items-center gap-2 font-medium cursor-pointer">
                        {format.icon}
                        {format.name}
                        <Badge variant="outline">{format.extension}</Badge>
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                      <div className="flex gap-2 mt-2">
                        {format.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Export Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Exportación
          </CardTitle>
          <CardDescription>
            Configura qué datos incluir en la exportación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exportFilters.map((filter) => (
              <div key={filter.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id={filter.id}
                  checked={filter.enabled}
                  onCheckedChange={() => toggleFilter(filter.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={filter.id} className="font-medium cursor-pointer">
                    {filter.name}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">{filter.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Datos Estandarizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Listo para exportar:</strong> {getEstimatedCount()} propiedades en formato{" "}
                {exportFormats.find(f => f.id === selectedFormat)?.name} con los filtros seleccionados.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de exportación: {new Date().toLocaleDateString()}
                </div>
                <div>Archivo: propiedades-estandarizadas-{new Date().toISOString().split('T')[0]}{exportFormats.find(f => f.id === selectedFormat)?.extension}</div>
              </div>
              
              <Button 
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2"
                size="lg"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar {getEstimatedCount()} Propiedades
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
