"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Rocket, Gauge, AlertTriangle, BarChart3, Shield, Target, TrendingUp, Globe } from "lucide-react"

interface Phase3Stats {
  totalUsers: number
  systemUptime: number
  performanceScore: number
  completionPercentage: number
  pendingTasks: number
  scalabilityMetrics: {
    concurrent: number
    throughput: number
    latency: number
  }
}

export default function Phase3MVPPage() {
  const [stats, setStats] = useState<Phase3Stats>({
    totalUsers: 0,
    systemUptime: 0,
    performanceScore: 0,
    completionPercentage: 0,
    pendingTasks: 0,
    scalabilityMetrics: { concurrent: 0, throughput: 0, latency: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadPhase3Stats()
  }, [])

  const loadPhase3Stats = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStats({
        totalUsers: 50,
        systemUptime: 99.9,
        performanceScore: 95,
        completionPercentage: 0,
        pendingTasks: 18,
        scalabilityMetrics: {
          concurrent: 100,
          throughput: 1000,
          latency: 150,
        },
      })
    } catch (error) {
      console.error("Error loading Phase 3 stats:", error)
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
          <Rocket className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fase 3 MVP - Optimización y Escalabilidad</h1>
            <p className="text-gray-600 text-lg">
              Optimización del rendimiento, escalabilidad y preparación para producción
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General de la Fase 3 - Semana 9-12/12
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Usuarios Concurrentes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.systemUptime}%</div>
                <div className="text-sm text-gray-600">Uptime Sistema</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getCompletionColor(stats.performanceScore)}`}>
                  {stats.performanceScore}%
                </div>
                <div className="text-sm text-gray-600">Score Rendimiento</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.pendingTasks}</div>
                <div className="text-sm text-gray-600">Tareas Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.scalabilityMetrics.latency}ms</div>
                <div className="text-sm text-gray-600">Latencia Promedio</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso de Optimización</span>
                  <span className="text-sm text-gray-600">{stats.completionPercentage}%</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-3" />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 Objetivos Fase 3</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                  <div>• Optimización de rendimiento</div>
                  <div>• Escalabilidad horizontal</div>
                  <div>• Seguridad empresarial</div>
                  <div>• Monitoreo avanzado</div>
                </div>
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
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="scalability" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Escalabilidad
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Despliegue
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos de la Fase 3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Optimización de rendimiento</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Escalabilidad horizontal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Seguridad empresarial</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Monitoreo y alertas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Backup y recuperación</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">🔄 Despliegue en producción</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Desarrollo</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-purple-200 bg-purple-50">
                  <Rocket className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <strong>Planificado:</strong> Fase 3 iniciará después de completar Fases 1 y 2. Arquitectura de
                    producción en diseño.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Optimización de Rendimiento
              </CardTitle>
              <CardDescription>Métricas y optimizaciones para mejorar el rendimiento del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Gauge className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Optimizaciones disponibles en Fase 3</p>
                <p className="text-sm">Iniciará después de completar Fases 1 y 2</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scalability Tab */}
        <TabsContent value="scalability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Escalabilidad del Sistema
              </CardTitle>
              <CardDescription>Configuración para soportar múltiples usuarios y alta carga</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Escalabilidad disponible en Fase 3</p>
                <p className="text-sm">Iniciará después de completar Fases 1 y 2</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad Empresarial
              </CardTitle>
              <CardDescription>Implementación de medidas de seguridad avanzadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Seguridad empresarial disponible en Fase 3</p>
                <p className="text-sm">Iniciará después de completar Fases 1 y 2</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Despliegue en Producción
              </CardTitle>
              <CardDescription>Configuración y despliegue del sistema en producción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Rocket className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Despliegue disponible en Fase 3</p>
                <p className="text-sm">Iniciará después de completar Fases 1 y 2</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
