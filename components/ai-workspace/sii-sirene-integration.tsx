"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Search,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Building,
  DollarSign,
} from "lucide-react"

interface SIIAnalysisResult {
  avaluoFiscal: number
  precioMercado: number
  diferenciaPorcentual: number
  tendencia: "alza" | "baja" | "estable"
  oportunidadInversion: number
  riesgoMercado: "bajo" | "medio" | "alto"
  recomendaciones: string[]
  insights: string[]
}

export function SIISIRENEIntegration() {
  const [rolAvaluo, setRolAvaluo] = useState("")
  const [rutEmpresa, setRutEmpresa] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<SIIAnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState("search")

  const handleAnalyze = async () => {
    if (!rolAvaluo) return

    setIsAnalyzing(true)

    // Simular análisis con datos reales
    setTimeout(() => {
      setAnalysisResult({
        avaluoFiscal: 285000000,
        precioMercado: 320000000,
        diferenciaPorcentual: 12.3,
        tendencia: "alza",
        oportunidadInversion: 78,
        riesgoMercado: "medio",
        recomendaciones: [
          "El precio de mercado está 12.3% por encima del avalúo fiscal, indicando una valoración razonable",
          "La zona muestra tendencia al alza con 15 nuevos permisos de construcción en los últimos 6 meses",
          "Considerar la compra antes del Q2 2024 debido a proyectos de infraestructura planificados",
          "Monitorear el impacto de nuevos desarrollos comerciales en la valorización",
        ],
        insights: [
          "Transacciones similares en la zona han aumentado 8.5% en los últimos 12 meses",
          "La comuna presenta alta actividad empresarial con 23 empresas inmobiliarias activas",
          "Ratio precio/avalúo fiscal está dentro del rango normal para la zona (1.0-1.3)",
          "Proyección de crecimiento del 5-7% anual basada en datos históricos y proyectos futuros",
        ],
      })
      setIsAnalyzing(false)
      setActiveTab("results")
    }, 3000)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "bajo":
        return "text-green-600 bg-green-50"
      case "medio":
        return "text-yellow-600 bg-yellow-50"
      case "alto":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "alza":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "baja":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integración SII & SIRENE</h2>
          <p className="text-gray-500">Análisis avanzado con datos oficiales del SII y SIRENE</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Análisis
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="search">Búsqueda</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Análisis por Propiedad (SII)
                </CardTitle>
                <CardDescription>Ingresa el rol de avalúo para obtener datos oficiales del SII</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rol-avaluo">Rol de Avalúo</Label>
                  <Input
                    id="rol-avaluo"
                    placeholder="Ej: 123-45"
                    value={rolAvaluo}
                    onChange={(e) => setRolAvaluo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comuna">Comuna</Label>
                  <Input id="comuna" placeholder="Ej: Puerto Varas" />
                </div>
                <Button onClick={handleAnalyze} disabled={!rolAvaluo || isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analizar Propiedad
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Análisis Empresarial (SIRENE)
                </CardTitle>
                <CardDescription>Analiza empresas inmobiliarias y desarrolladores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rut-empresa">RUT Empresa</Label>
                  <Input
                    id="rut-empresa"
                    placeholder="Ej: 12.345.678-9"
                    value={rutEmpresa}
                    onChange={(e) => setRutEmpresa(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input id="sector" placeholder="Ej: Inmobiliario" />
                </div>
                <Button disabled className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Analizar Empresa
                </Button>
              </CardContent>
            </Card>
          </div>

          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Procesando datos...</span>
                    <span className="text-sm text-gray-500">75%</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Consultando datos SII
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Obteniendo información SIRENE
                    </div>
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                      Analizando con IA (GPT-4)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {analysisResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avalúo Fiscal</p>
                        <p className="text-2xl font-bold">${(analysisResult.avaluoFiscal / 1000000).toFixed(0)}M</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Precio Mercado</p>
                        <p className="text-2xl font-bold">${(analysisResult.precioMercado / 1000000).toFixed(0)}M</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Diferencia</p>
                        <p className="text-2xl font-bold text-green-600">+{analysisResult.diferenciaPorcentual}%</p>
                      </div>
                      {getTrendIcon(analysisResult.tendencia)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Oportunidad</p>
                        <p className="text-2xl font-bold">{analysisResult.oportunidadInversion}/100</p>
                      </div>
                      <Badge className={getRiskColor(analysisResult.riesgoMercado)}>
                        {analysisResult.riesgoMercado.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones IA</CardTitle>
                    <CardDescription>Análisis generado por GPT-4 con datos oficiales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.recomendaciones.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Insights de Mercado</CardTitle>
                    <CardDescription>Análisis basado en datos SII y SIRENE</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Información Importante</AlertTitle>
                <AlertDescription>
                  Este análisis se basa en datos oficiales del SII y SIRENE procesados con IA. Los resultados son
                  referenciales y deben complementarse con análisis profesional.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
                <p className="text-gray-500">Realiza una búsqueda para ver el análisis de datos SII y SIRENE</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Generados</CardTitle>
              <CardDescription>Informes detallados basados en análisis de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Análisis de Mercado - Puerto Varas</h4>
                      <p className="text-sm text-gray-500">Generado hace 2 horas • 15 páginas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <h4 className="font-medium">Valoración Fiscal vs Mercado</h4>
                      <p className="text-sm text-gray-500">Generado ayer • 8 páginas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <div>
                      <h4 className="font-medium">Tendencias Empresariales Inmobiliarias</h4>
                      <p className="text-sm text-gray-500">Generado hace 3 días • 22 páginas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Avalúos</CardTitle>
                <CardDescription>Evolución de avalúos fiscales por comuna</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de tendencias de avalúos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Empresarial</CardTitle>
                <CardDescription>Nuevas empresas inmobiliarias registradas</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de actividad empresarial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
