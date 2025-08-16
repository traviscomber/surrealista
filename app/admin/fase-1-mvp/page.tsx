"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Upload,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react"
import GoogleDriveImporter from "@/components/data-management/google-drive-importer"
import DataStandardizer from "@/components/data-management/data-standardizer"
import QualityController from "@/components/data-management/quality-controller"
import StandardizedExporter from "@/components/data-management/standardized-exporter"

interface Phase1Stats {
  totalProperties: number
  standardizedProperties: number
  qualityScore: number
  completionPercentage: number
  pendingTasks: number
  dataQualityDistribution: {
    high: number
    medium: number
    low: number
  }
}

export default function Phase1MVPPage() {
  const [stats, setStats] = useState<Phase1Stats>({
    totalProperties: 0,
    standardizedProperties: 0,
    qualityScore: 0,
    completionPercentage: 0,
    pendingTasks: 0,
    dataQualityDistribution: { high: 0, medium: 0, low: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadPhase1Stats()
  }, [])

  const loadPhase1Stats = async () => {
    setLoading(true)
    try {
      // Simulate API call to get Phase 1 statistics
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalProperties: 47,
        standardizedProperties: 23,
        qualityScore: 73,
        completionPercentage: 49,
        pendingTasks: 24,
        dataQualityDistribution: {
          high: 15,
          medium: 18,
          low: 14,
        },
      })
    } catch (error) {
      console.error("Error loading Phase 1 stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadge = (level: string, count: number) => {
    const colors = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {level === "high" ? "Alta" : level === "medium" ? "Media" : "Baja"}: {count}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fase 1 MVP - Organización de Datos</h1>
            <p className="text-gray-600 text-lg">
              Sistema completo para ordenar y estandarizar la base de información de Google Drive
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General de la Fase 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalProperties}</div>
                <div className="text-sm text-gray-600">Propiedades Totales</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.standardizedProperties}</div>
                <div className="text-sm text-gray-600">Estandarizadas</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getCompletionColor(stats.qualityScore)}`}>
                  {stats.qualityScore}%
                </div>
                <div className="text-sm text-gray-600">Calidad Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</div>
                <div className="text-sm text-gray-600">Tareas Pendientes</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso de Estandarización</span>
                  <span className="text-sm text-gray-600">{stats.completionPercentage}%</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-3" />
              </div>

              <div className="flex gap-2">
                {getQualityBadge("high", stats.dataQualityDistribution.high)}
                {getQualityBadge("medium", stats.dataQualityDistribution.medium)}
                {getQualityBadge("low", stats.dataQualityDistribution.low)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="standardize" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Estandarizar
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Control Calidad
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phase 1 Objectives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos de la Fase 1
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Importar datos desde Google Drive</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Validar y limpiar información</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">Estandarizar campos y formatos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">Establecer sistema de calidad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <span className="text-sm">Exportar base de datos organizada</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>En Progreso:</strong> {stats.pendingTasks} propiedades requieren estandarización manual.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Campos Completos:</strong>
                      <div className="mt-1">
                        <Progress value={78} className="h-2" />
                        <span className="text-xs text-gray-600">78%</span>
                      </div>
                    </div>
                    <div>
                      <strong>Formato Estándar:</strong>
                      <div className="mt-1">
                        <Progress value={35} className="h-2" />
                        <span className="text-xs text-gray-600">35%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Pasos Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab("import")}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="outline"
                >
                  <Upload className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">1. Importar Datos</div>
                    <div className="text-xs text-gray-600">Subir archivos de Google Drive</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setActiveTab("standardize")}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="outline"
                >
                  <Settings className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">2. Estandarizar</div>
                    <div className="text-xs text-gray-600">Aplicar reglas de formato</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setActiveTab("quality")}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                  variant="outline"
                >
                  <CheckCircle className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">3. Validar Calidad</div>
                    <div className="text-xs text-gray-600">Revisar y corregir datos</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importación desde Google Drive
              </CardTitle>
              <CardDescription>
                Importa y procesa archivos CSV desde Google Drive con validación automática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleDriveImporter onImportComplete={loadPhase1Stats} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standardize Tab */}
        <TabsContent value="standardize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Estandarización de Datos
              </CardTitle>
              <CardDescription>Aplica reglas de estandarización para uniformar el formato de los datos</CardDescription>
            </CardHeader>
            <CardContent>
              <DataStandardizer onStandardizationComplete={loadPhase1Stats} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Control de Calidad
              </CardTitle>
              <CardDescription>Revisa y mejora la calidad de los datos importados</CardDescription>
            </CardHeader>
            <CardContent>
              <QualityController onQualityUpdate={loadPhase1Stats} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Datos Estandarizados
              </CardTitle>
              <CardDescription>Exporta la base de datos organizada en diferentes formatos</CardDescription>
            </CardHeader>
            <CardContent>
              <StandardizedExporter stats={stats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
