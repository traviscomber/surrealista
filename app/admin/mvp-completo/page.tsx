"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, FileText, Users, Calendar, CheckCircle, AlertTriangle, Target, TrendingUp, FolderOpen, Palette, MessageSquare, Mail, Phone, Globe } from 'lucide-react'

interface MVPStage {
  id: string
  name: string
  description: string
  duration: string
  status: 'pending' | 'in-progress' | 'completed'
  progress: number
  tasks: Array<{
    id: string
    name: string
    status: 'pending' | 'in-progress' | 'completed'
    priority: 'high' | 'medium' | 'low'
  }>
}

interface MVPMetrics {
  totalTasks: number
  completedTasks: number
  overallProgress: number
  currentStage: string
  estimatedCompletion: string
  resourcesAllocated: number
}

export default function MVPCompletoPage() {
  const [stages, setStages] = useState<MVPStage[]>([])
  const [metrics, setMetrics] = useState<MVPMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    overallProgress: 0,
    currentStage: "",
    estimatedCompletion: "",
    resourcesAllocated: 0
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMVPData()
  }, [])

  const loadMVPData = async () => {
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mvpStages: MVPStage[] = [
      {
        id: "stage-1",
        name: "Etapa 1: Ordenamiento del Repositorio",
        description: "Desarrollo de API de integración, interfaz web, migración y estandarización",
        duration: "Mes 1",
        status: "in-progress",
        progress: 65,
        tasks: [
          {
            id: "api-integration",
            name: "API de Integración con Google Drive",
            status: "completed",
            priority: "high"
          },
          {
            id: "web-interface",
            name: "Construcción de Interfaz Web",
            status: "in-progress",
            priority: "high"
          },
          {
            id: "migration",
            name: "Migración y Estandarización",
            status: "in-progress",
            priority: "medium"
          },
          {
            id: "testing-training",
            name: "Pruebas y Capacitación",
            status: "pending",
            priority: "medium"
          }
        ]
      },
      {
        id: "stage-2",
        name: "Etapa 2: Estandarización de Material",
        description: "Plantillas estandarizadas, organización de recursos y automatización",
        duration: "Mes 2",
        status: "pending",
        progress: 0,
        tasks: [
          {
            id: "templates",
            name: "Plantillas Estandarizadas",
            status: "pending",
            priority: "high"
          },
          {
            id: "resource-organization",
            name: "Organización de Recursos",
            status: "pending",
            priority: "medium"
          },
          {
            id: "flexible-editing",
            name: "Edición Flexible",
            status: "pending",
            priority: "medium"
          },
          {
            id: "content-automation",
            name: "Automatización de Contenido",
            status: "pending",
            priority: "low"
          }
        ]
      },
      {
        id: "stage-3",
        name: "Etapa 3: Vinculación de Compradores",
        description: "Integración con Gmail, redes sociales, análisis de mensajería y centralización",
        duration: "Mes 3",
        status: "pending",
        progress: 0,
        tasks: [
          {
            id: "gmail-integration",
            name: "Integración con Gmail",
            status: "pending",
            priority: "high"
          },
          {
            id: "social-monitoring",
            name: "Monitoreo de Redes Sociales",
            status: "pending",
            priority: "medium"
          },
          {
            id: "message-analysis",
            name: "Análisis de Mensajería",
            status: "pending",
            priority: "medium"
          },
          {
            id: "data-centralization",
            name: "Centralización de Datos",
            status: "pending",
            priority: "high"
          }
        ]
      }
    ]

    const totalTasks = mvpStages.reduce((sum, stage) => sum + stage.tasks.length, 0)
    const completedTasks = mvpStages.reduce((sum, stage) => 
      sum + stage.tasks.filter(task => task.status === 'completed').length, 0
    )

    setStages(mvpStages)
    setMetrics({
      totalTasks,
      completedTasks,
      overallProgress: Math.round((completedTasks / totalTasks) * 100),
      currentStage: "Etapa 1",
      estimatedCompletion: "3 meses",
      resourcesAllocated: 85
    })
    
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-gray-100 text-gray-800", text: "Pendiente", icon: AlertTriangle },
      "in-progress": { color: "bg-blue-100 text-blue-800", text: "En Progreso", icon: TrendingUp },
      completed: { color: "bg-green-100 text-green-800", text: "Completado", icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: "bg-red-100 text-red-800", text: "Alta" },
      medium: { color: "bg-yellow-100 text-yellow-800", text: "Media" },
      low: { color: "bg-green-100 text-green-800", text: "Baja" }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MVP Completo - Sur Realista</h1>
            <p className="text-gray-600 text-lg">
              Sistema integral de gestión de repositorio, estandarización y vinculación de compradores
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General del MVP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.overallProgress}%</div>
                <div className="text-sm text-gray-600">Progreso Total</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.completedTasks}</div>
                <div className="text-sm text-gray-600">Tareas Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{metrics.totalTasks - metrics.completedTasks}</div>
                <div className="text-sm text-gray-600">Tareas Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.estimatedCompletion}</div>
                <div className="text-sm text-gray-600">Tiempo Estimado</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso del MVP</span>
                  <span className="text-sm text-gray-600">{metrics.overallProgress}%</span>
                </div>
                <Progress value={metrics.overallProgress} className="h-3" />
              </div>

              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estado Actual:</strong> {metrics.currentStage} en progreso. 
                  Recursos asignados: {metrics.resourcesAllocated}%
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="stage-1">Etapa 1</TabsTrigger>
          <TabsTrigger value="stage-2">Etapa 2</TabsTrigger>
          <TabsTrigger value="stage-3">Etapa 3</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stages.map((stage) => (
              <Card key={stage.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{stage.name}</CardTitle>
                  <CardDescription>{stage.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Duración: {stage.duration}</span>
                      {getStatusBadge(stage.status)}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Progreso</span>
                        <span className="text-sm text-gray-600">{stage.progress}%</span>
                      </div>
                      <Progress value={stage.progress} className="h-2" />
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Tareas:</strong> {stage.tasks.filter(t => t.status === 'completed').length} / {stage.tasks.length} completadas
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab(stage.id)}
                      className="w-full"
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stage 1 Tab */}
        <TabsContent value="stage-1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Etapa 1: Ordenamiento del Repositorio de Clientes
              </CardTitle>
              <CardDescription>
                Implementación técnica del repositorio, desarrollo de API y construcción de interfaz web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Componentes Principales</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">API de Integración</div>
                          <div className="text-sm text-gray-600">Conexión con Google Drive</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Interfaz Web</div>
                          <div className="text-sm text-gray-600">Panel de control intuitivo</div>
                        </div>
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Migración de Datos</div>
                          <div className="text-sm text-gray-600">Reorganización automatizada</div>
                        </div>
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Especificaciones Técnicas</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>API:</strong> Google Drive API v3</div>
                      <div><strong>Sincronización:</strong> Bidireccional en tiempo real</div>
                      <div><strong>Filtros:</strong> Dinámicos por tipo, fecha, estado</div>
                      <div><strong>Funcionalidades:</strong> Edición, descarga directa</div>
                      <div><strong>Nomenclatura:</strong> Sistema estandarizado</div>
                      <div><strong>Scripts:</strong> Automatización de migración</div>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 1</h4>
                  <div className="space-y-3">
                    {stages.find(s => s.id === 'stage-1')?.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{task.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={() => setActiveTab("overview")}>
                    Ir a Fase 1 Actual
                  </Button>
                  <Button variant="outline">
                    Ver Documentación Técnica
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage 2 Tab */}
        <TabsContent value="stage-2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Etapa 2: Estandarización de Material de Producto
              </CardTitle>
              <CardDescription>
                Desarrollo de plantillas profesionales y automatización de contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Plantillas Estandarizadas</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Elementos gráficos consistentes</div>
                      <div>• Diagramación profesional</div>
                      <div>• Tipografía de marca</div>
                      <div>• Identidad visual unificada</div>
                      <div>• Base para materiales de cliente</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Organización de Recursos</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Sistema de carpetas estructurado</div>
                      <div>• Categorización de fotografías</div>
                      <div>• Biblioteca de gráficos</div>
                      <div>• Recursos visuales organizados</div>
                      <div>• Localización rápida de assets</div>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h4 className="font-medium mb-3">Especificaciones Técnicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">Requisitos del Sistema</div>
                        <div className="text-sm text-gray-600 mt-1">
                          • Adobe InDesign/Microsoft Publisher<br/>
                          • PDF interactivo/HTML<br/>
                          • Multi-dispositivo compatible<br/>
                          • Integrado con Google Drive
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">Elementos de Diseño</div>
                        <div className="text-sm text-gray-600 mt-1">
                          • Biblioteca de componentes<br/>
                          • Paleta de colores corporativos<br/>
                          • Tipografías autorizadas<br/>
                          • Sistema de iconografía
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 2</h4>
                  <div className="space-y-3">
                    {stages.find(s => s.id === 'stage-2')?.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{task.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage 3 Tab */}
        <TabsContent value="stage-3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Etapa 3: Vinculación de Compradores con Productos
              </CardTitle>
              <CardDescription>
                Integración multicanal y análisis inteligente de comportamiento de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Integration Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Canales de Integración</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Mail className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium">Gmail</div>
                          <div className="text-sm text-gray-600">Análisis de conversaciones</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Redes Sociales</div>
                          <div className="text-sm text-gray-600">Monitoreo de interacciones</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-sm text-gray-600">Procesamiento de mensajes</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Análisis Inteligente</h4>
                    <div className="space-y-2 text-sm">
                      <div>• Identificación de intereses</div>
                      <div>• Patrones de comunicación</div>
                      <div>• Tendencias y preferencias</div>
                      <div>• Oportunidades de conexión</div>
                      <div>• Recomendaciones personalizadas</div>
                      <div>• Timing óptimo de contacto</div>
                    </div>
                  </div>
                </div>

                {/* Data Centralization */}
                <div>
                  <h4 className="font-medium mb-3">Centralización de Datos</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900 mb-2">Base de Datos Unificada</div>
                    <div className="text-sm text-blue-800">
                      Sistema que unifica toda la información recopilada de múltiples canales, 
                      creando perfiles completos de clientes vinculados con productos relevantes 
                      y generando recomendaciones basadas en historial e interacciones.
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacidad:</strong> Todas las integraciones respetan las políticas de 
                    privacidad y requieren consentimiento explícito del usuario.
                  </AlertDescription>
                </Alert>

                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 3</h4>
                  <div className="space-y-3">
                    {stages.find(s => s.id === 'stage-3')?.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{task.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma de Implementación
              </CardTitle>
              <CardDescription>
                Calendario detallado de 3 meses para la implementación completa del MVP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Mes 1</div>
                    <div className="text-sm text-gray-600">Repositorio de Clientes</div>
                    <Progress value={65} className="mt-2 h-2" />
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Mes 2</div>
                    <div className="text-sm text-gray-600">Material de Producto</div>
                    <Progress value={0} className="mt-2 h-2" />
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">Mes 3</div>
                    <div className="text-sm text-gray-600">Vinculación Compradores</div>
                    <Progress value={0} className="mt-2 h-2" />
                  </div>
                </div>

                {/* Detailed Timeline */}
                <div className="space-y-6">
                  {stages.map((stage, index) => (
                    <div key={stage.id} className="border-l-4 border-blue-200 pl-6 pb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-blue-600 rounded-full -ml-8"></div>
                        <h3 className="text-lg font-semibold">{stage.name}</h3>
                        {getStatusBadge(stage.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Duración:</strong> {stage.duration}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Objetivos Principales</h4>
                          <div className="text-sm text-gray-600">
                            {stage.description}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Entregables</h4>
                          <div className="space-y-1">
                            {stage.tasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                {task.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Implementation Notes */}
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Implementación Secuencial:</strong> Cada etapa construye sobre los logros 
                    de la anterior, minimizando riesgos y permitiendo ajustes según se requiera.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
