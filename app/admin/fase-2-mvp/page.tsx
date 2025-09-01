"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Zap, AlertTriangle, BarChart3, Brain, Target, TrendingUp, Workflow } from "lucide-react"

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
        totalAutomations: 15,
        activeWorkflows: 8,
        aiAccuracy: 92,
        completionPercentage: 25,
        pendingTasks: 12,
        automationDistribution: {
          classification: 5,
          extraction: 6,
          validation: 4,
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
              Progreso General de la Fase 2 - Semana 5-8/12
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
                <div className="text-3xl font-bold text-purple-600">3.2s</div>
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

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">🚀 Objetivos Fase 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-orange-700">
                  <div>• Clasificación automática de documentos</div>
                  <div>• Extracción inteligente de datos</div>
                  <div>• Validación automática con IA</div>
                  <div>• Flujos de trabajo automatizados</div>
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
                  Objetivos de la Fase 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Clasificación automática de documentos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Extracción inteligente de metadatos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Validación automática con IA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Flujos de trabajo automatizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Análisis predictivo de calidad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Detección de anomalías</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Desarrollo</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-orange-200 bg-orange-50">
                  <Bot className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <strong>En Desarrollo:</strong> Fase 2 iniciará después de completar Fase 1. Arquitectura IA en
                    diseño.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Inteligencia Artificial y Machine Learning
              </CardTitle>
              <CardDescription>Modelos de IA para clasificación y extracción automática de documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Funcionalidades de IA disponibles en Fase 2</p>
                <p className="text-sm">Iniciará después de completar Fase 1</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Automatización de Flujos
              </CardTitle>
              <CardDescription>Configuración y gestión de procesos automatizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Automatización disponible en Fase 2</p>
                <p className="text-sm">Iniciará después de completar Fase 1</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Monitoreo y Métricas
              </CardTitle>
              <CardDescription>Seguimiento del rendimiento de automatizaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Monitoreo disponible en Fase 2</p>
                <p className="text-sm">Iniciará después de completar Fase 1</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
