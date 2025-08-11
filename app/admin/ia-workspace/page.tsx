"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  Search,
  FileText,
  Settings,
  Zap,
  Globe,
  Shield,
  Users,
} from "lucide-react"

export default function IAWorkspacePage() {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const metrics = [
    {
      title: "Propiedades Analizadas",
      value: "1,247",
      change: "+12%",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      title: "Precisión del Modelo",
      value: "94.2%",
      change: "+2.1%",
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Recomendaciones Activas",
      value: "89",
      change: "+5",
      icon: Lightbulb,
      color: "text-yellow-600",
    },
    {
      title: "Ahorro en Tiempo",
      value: "156h",
      change: "+23h",
      icon: Zap,
      color: "text-purple-600",
    },
  ]

  const recentAnalyses = [
    {
      id: "1",
      property: "Casa Lago Villarrica",
      score: 92,
      status: "completed",
      date: "2024-01-15",
      recommendations: 3,
    },
    {
      id: "2",
      property: "Cabaña Puerto Varas",
      score: 87,
      status: "completed",
      date: "2024-01-14",
      recommendations: 5,
    },
    {
      id: "3",
      property: "Terreno Pucón Centro",
      score: 78,
      status: "processing",
      date: "2024-01-14",
      recommendations: 2,
    },
  ]

  const aiModels = [
    {
      name: "Valuación Automática",
      status: "active",
      accuracy: 94.2,
      lastTrained: "2024-01-10",
      description: "Modelo de machine learning para valuación automática de propiedades",
    },
    {
      name: "Análisis de Mercado",
      status: "active",
      accuracy: 89.7,
      lastTrained: "2024-01-08",
      description: "Predicción de tendencias y análisis comparativo de mercado",
    },
    {
      name: "Recomendaciones",
      status: "training",
      accuracy: 91.5,
      lastTrained: "2024-01-12",
      description: "Sistema de recomendaciones personalizadas para clientes",
    },
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IA Workspace</h1>
          <p className="text-gray-600 mt-2">Centro de control para análisis inteligente de propiedades</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar análisis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Nuevo Análisis
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-sm text-green-600">{metric.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="models">Modelos IA</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Análisis Recientes
                </CardTitle>
                <CardDescription>Últimos análisis de propiedades realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{analysis.property}</h4>
                        <p className="text-sm text-gray-600">{analysis.date}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={analysis.status === "completed" ? "default" : "secondary"}>
                          {analysis.status === "completed" ? "Completado" : "Procesando"}
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold text-lg">{analysis.score}</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Rendimiento IA
                </CardTitle>
                <CardDescription>Métricas de rendimiento de los modelos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Precisión General</span>
                    <span>94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Velocidad de Procesamiento</span>
                    <span>87.5%</span>
                  </div>
                  <Progress value={87.5} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Satisfacción Usuario</span>
                    <span>96.1%</span>
                  </div>
                  <Progress value={96.1} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Propiedades</CardTitle>
              <CardDescription>Herramientas avanzadas para análisis inteligente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col bg-transparent">
                  <Target className="h-8 w-8 mb-2" />
                  Análisis Individual
                </Button>
                <Button variant="outline" className="h-24 flex-col bg-transparent">
                  <BarChart3 className="h-8 w-8 mb-2" />
                  Análisis por Lotes
                </Button>
                <Button variant="outline" className="h-24 flex-col bg-transparent">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  Análisis de Mercado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modelos de IA</CardTitle>
              <CardDescription>Gestión y monitoreo de modelos de machine learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiModels.map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{model.name}</h4>
                      <Badge variant={model.status === "active" ? "default" : "secondary"}>
                        {model.status === "active" ? "Activo" : "Entrenando"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Precisión: {model.accuracy}%</span>
                      <span>Último entrenamiento: {model.lastTrained}</span>
                    </div>
                    <Progress value={model.accuracy} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Reportes Inteligentes
              </CardTitle>
              <CardDescription>Genera reportes automáticos con insights de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <FileText className="h-6 w-6 mb-2" />
                  Reporte de Mercado
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Análisis de Tendencias
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <Target className="h-6 w-6 mb-2" />
                  Reporte de Valuación
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent">
                  <Users className="h-6 w-6 mb-2" />
                  Análisis de Clientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Integraciones Externas
              </CardTitle>
              <CardDescription>Conecta con fuentes de datos externas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">SII Chile</h4>
                  <p className="text-sm text-gray-600 mb-3">Datos oficiales de propiedades</p>
                  <Badge variant="default">Conectado</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">SIRENE Francia</h4>
                  <p className="text-sm text-gray-600 mb-3">Base de datos empresarial</p>
                  <Badge variant="default">Conectado</Badge>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Banco Central</h4>
                  <p className="text-sm text-gray-600 mb-3">Indicadores económicos</p>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración IA
              </CardTitle>
              <CardDescription>Ajusta los parámetros de los modelos de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Parámetros de Análisis</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Umbral de Confianza</label>
                      <Progress value={85} className="h-2 mt-2" />
                      <p className="text-xs text-gray-500 mt-1">85% - Recomendado</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sensibilidad de Mercado</label>
                      <Progress value={70} className="h-2 mt-2" />
                      <p className="text-xs text-gray-500 mt-1">70% - Moderada</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Seguridad y Privacidad</h4>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Encriptación end-to-end activada</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
