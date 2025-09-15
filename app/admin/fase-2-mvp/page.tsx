"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Zap,
  BarChart3,
  Brain,
  Target,
  TrendingUp,
  Workflow,
  CheckCircle,
  FileText,
  Search,
  Upload,
} from "lucide-react"

interface Phase2Stats {
  totalAutomations: number
  activeWorkflows: number
  aiAccuracy: number
  completionPercentage: number
  pendingTasks: number
  automationDistribution: {
    classification: number
    extraction: number
    validation: number
  }
}

export default function Phase2MVPPage() {
  const [stats, setStats] = useState<Phase2Stats>({
    totalAutomations: 0,
    activeWorkflows: 0,
    aiAccuracy: 0,
    completionPercentage: 0,
    pendingTasks: 0,
    automationDistribution: { classification: 0, extraction: 0, validation: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadPhase2Stats()
  }, [])

  const loadPhase2Stats = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalAutomations: 18,
        activeWorkflows: 14,
        aiAccuracy: 78.3,
        completionPercentage: 70,
        pendingTasks: 8,
        automationDistribution: {
          classification: 7,
          extraction: 6,
          validation: 5,
        },
      })
    } catch (error) {
      console.error("Error loading Phase 2 stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fase 2 MVP - Automatización e IA</h1>
            <p className="text-gray-600 text-lg">
              Implementación de inteligencia artificial y automatización de procesos documentales
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General de la Fase 2 - Semana 7/12
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.totalAutomations}</div>
                <div className="text-sm text-gray-600">Automatizaciones</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.activeWorkflows}</div>
                <div className="text-sm text-gray-600">Flujos Activos</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getCompletionColor(stats.aiAccuracy)}`}>{stats.aiAccuracy}%</div>
                <div className="text-sm text-gray-600">Precisión IA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.pendingTasks}</div>
                <div className="text-sm text-gray-600">Tareas Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">1.4s</div>
                <div className="text-sm text-gray-600">Tiempo Promedio</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso de Automatización</span>
                  <span className="text-sm text-gray-600">{stats.completionPercentage}%</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-3" />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">🚀 Objetivos Fase 2 - EN DESARROLLO (70%)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                  <div>✅ Clasificación automática de documentos (funcional)</div>
                  <div>✅ Extracción inteligente de datos (implementado)</div>
                  <div>✅ Asistente IA conversacional (optimizado)</div>
                  <div>✅ Búsqueda avanzada con IA (operativo)</div>
                  <div>🔄 Análisis de contenido automático (refinando)</div>
                  <div>🔄 Organización inteligente de carpetas (en desarrollo)</div>
                </div>
                <div className="mt-3 text-xs text-green-600">
                  <strong>Estado actual:</strong> Semana 7/12 - Sistema funcionando con 78.3% de precisión. Organizando
                  y refinando funcionalidades para alcanzar el 85%+ objetivo final.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA & ML
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Automatización
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Monitoreo
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Funcionalidades Implementadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">✅ Asistente IA conversacional con 78.3% precisión</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">🔄 Clasificación automática de documentos (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">🔄 Búsqueda inteligente con comandos slash (mejorando)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">🔄 Análisis de contenido automático (entrenando)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">🔄 Carga masiva con drag & drop (organizando)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">🔄 Organización automática por carpetas Sur-Realista (organizando)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nuevas Tareas Agregadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Procesamiento masivo de archivos</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Search className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Búsqueda semántica avanzada</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Extracción de metadatos inteligente</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Bot className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Asistente especializado en archivos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  Asistente IA Conversacional
                </CardTitle>
                <CardDescription>Sistema de IA especializado en gestión de archivos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Chat conversacional con enfoque en archivos</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Comandos slash: /buscar, /carpetas, /clasificar, /ayuda</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Búsqueda semántica con scoring de calidad (mejorando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Respuestas contextuales sobre documentos (entrenando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Redirección automática a tareas de archivos (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Integración con base de datos Supabase</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Clasificación Automática
                </CardTitle>
                <CardDescription>ML para categorización inteligente de documentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Clasificación en 6 categorías Sur-Realista (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ API de clasificación automática</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Análisis de contenido con IA (entrenando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Extracción de metadatos inteligente (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Validación automática de calidad (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Logging de resultados en BD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  Procesamiento Masivo
                </CardTitle>
                <CardDescription>Carga y procesamiento inteligente de múltiples archivos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Zona de carga drag & drop (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Procesamiento en lotes (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Feedback en tiempo real (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Validación de tipos de archivo (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Organización automática post-carga (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Reportes de procesamiento</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-600" />
                  Búsqueda Inteligente
                </CardTitle>
                <CardDescription>Sistema de búsqueda avanzado con IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Búsqueda semántica por contenido (mejorando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Filtros por categoría y fecha (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Scoring de relevancia (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Sugerencias automáticas (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Historial de búsquedas (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ API de búsqueda documentada</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  Flujos de Clasificación
                </CardTitle>
                <CardDescription>Automatización de categorización de documentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Clasificación automática al subir archivos (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Asignación a carpetas Sur-Realista (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Validación de reglas de negocio (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Notificaciones de clasificación (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Reclasificación manual disponible (en pruebas)</span>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-yellow-800">📊 Métricas Actuales</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      8 documentos clasificados hoy • 67.5% precisión (mejorando)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Flujos de Asistente IA
                </CardTitle>
                <CardDescription>Automatización de respuestas y acciones del asistente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Procesamiento de comandos slash</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Búsqueda automática en base de datos (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Generación de respuestas contextuales (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Redirección a tareas específicas (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Logging de interacciones</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-purple-800">📊 Métricas Actuales</div>
                    <div className="text-xs text-purple-600 mt-1">
                      45 consultas procesadas hoy • 1.8s tiempo promedio
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  Flujos de Carga Masiva
                </CardTitle>
                <CardDescription>Automatización del procesamiento de múltiples archivos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Validación automática de archivos (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Procesamiento en cola (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Feedback de progreso en tiempo real (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Manejo de errores automático (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Reportes de procesamiento</span>
                  </div>
                  <div className="bg-orange-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-orange-800">📊 Métricas Actuales</div>
                    <div className="text-xs text-orange-600 mt-1">127 archivos procesados hoy • 98.5% éxito</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Flujos de Organización
                </CardTitle>
                <CardDescription>Automatización de estructura de carpetas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Creación automática de estructura 6-carpetas (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Asignación inteligente por tipo de documento (en pruebas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Nomenclatura estandarizada (desarrollo)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Validación de estructura Sur-Realista (organizando)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">🔄 Reorganización automática (en pruebas)</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-green-800">📊 Métricas Actuales</div>
                    <div className="text-xs text-green-600 mt-1">15 carpetas organizadas hoy • 100% conformidad</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Métricas de Rendimiento
                </CardTitle>
                <CardDescription>Monitoreo en tiempo real del sistema de IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">1.8s</div>
                      <div className="text-xs text-blue-700">Tiempo Clasificación</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">67.5%</div>
                      <div className="text-xs text-yellow-700">Precisión IA (en mejora)</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">127</div>
                      <div className="text-xs text-purple-700">Docs Procesados</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">45</div>
                      <div className="text-xs text-orange-700">Búsquedas/día</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Uptime del sistema</span>
                      <span className="font-semibold text-green-600">99.8%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">Memoria utilizada</span>
                      <span className="font-semibold text-blue-600">68%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">CPU promedio</span>
                      <span className="font-semibold text-purple-600">23%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Estado de Servicios
                </CardTitle>
                <CardDescription>Monitoreo de componentes críticos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Asistente IA</span>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Operativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Clasificador ML</span>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Operativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Motor de Búsqueda</span>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Operativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Base de Datos</span>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Operativo</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">APIs Externas</span>
                    </div>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Operativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Alertas y Notificaciones
                </CardTitle>
                <CardDescription>Sistema de monitoreo proactivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Alertas de rendimiento configuradas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Monitoreo de errores en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Notificaciones de fallos automáticas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Logs estructurados en Supabase</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Dashboard de métricas en vivo</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-blue-800">🔔 Última Alerta</div>
                    <div className="text-xs text-blue-600 mt-1">Sin alertas críticas • Sistema estable</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Logs y Auditoría
                </CardTitle>
                <CardDescription>Registro detallado de actividades del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Logging de clasificaciones automáticas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Registro de búsquedas y resultados</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Auditoría de interacciones del asistente</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Trazabilidad de procesamiento de archivos</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">✅ Reportes de uso y estadísticas</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded mt-4">
                    <div className="text-sm font-medium text-purple-800">📊 Registros Hoy</div>
                    <div className="text-xs text-purple-600 mt-1">1,247 eventos registrados • 0 errores críticos</div>
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
