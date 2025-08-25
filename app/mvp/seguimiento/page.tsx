"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  GitBranch,
  Target,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Code,
  Bug,
  Star,
  FileText,
  Cpu,
  HardDrive,
  Network,
  Timer,
  Plus,
  Minus,
  ArrowUp,
  Database,
  FolderOpen,
  Globe,
  Palette,
  MessageSquare,
  Mail,
  AlertTriangle,
} from "lucide-react"

interface MVPStage {
  id: string
  name: string
  description: string
  duration: string
  status: "pending" | "in-progress" | "completed"
  progress: number
  tasks: Array<{
    id: string
    name: string
    status: "pending" | "in-progress" | "completed"
    priority: "high" | "medium" | "low"
  }>
}

interface Milestone {
  id: number
  title: string
  description: string
  status: "completed" | "in-progress" | "pending" | "blocked"
  progress: number
  dueDate: string
  tasks: {
    name: string
    completed: boolean
  }[]
}

interface DevelopmentMetrics {
  totalCommits: number
  linesOfCode: number
  testsWritten: number
  testCoverage: number
  bugsFixed: number
  bugsOpen: number
  performanceScore: number
  securityScore: number
  codeQuality: number
  deployments: number
  uptime: number
  responseTime: number
}

interface TeamProductivity {
  developer: string
  commitsThisWeek: number
  linesAdded: number
  linesRemoved: number
  pullRequests: number
  reviewsCompleted: number
  bugsFixed: number
}

const mvpStages: MVPStage[] = [
  {
    id: "stage-1",
    name: "Etapa 1: Ordenamiento del Repositorio",
    description: "Desarrollo de API de integración, interfaz web, migración y estandarización",
    duration: "Semanas 1-4 (2 semanas completadas de 4)",
    status: "in-progress",
    progress: 75,
    tasks: [
      {
        id: "api-integration",
        name: "API de Integración con Google Drive",
        status: "completed",
        priority: "high",
      },
      {
        id: "web-interface",
        name: "Construcción de Interfaz Web",
        status: "completed",
        priority: "high",
      },
      {
        id: "migration",
        name: "Migración y Estandarización",
        status: "completed",
        priority: "medium",
      },
      {
        id: "auth-system",
        name: "Sistema de Autenticación",
        status: "completed",
        priority: "high",
      },
      {
        id: "folder-standard",
        name: "Definición Estándar de Carpetas (6 categorías)",
        status: "completed",
        priority: "high",
      },
      {
        id: "file-processing",
        name: "Procesamiento de Archivos PDF/DOC",
        status: "completed",
        priority: "medium",
      },
      {
        id: "rol-extraction",
        name: "Extracción de Números de Rol",
        status: "completed",
        priority: "high",
      },
      {
        id: "folder-validation",
        name: "Validación de Estructura de Carpetas",
        status: "completed",
        priority: "medium",
      },
      {
        id: "mobile-interface",
        name: "Interfaz Móvil Optimizada",
        status: "completed",
        priority: "medium",
      },
      {
        id: "batch-processing",
        name: "Procesamiento en Lotes",
        status: "completed",
        priority: "medium",
      },
      {
        id: "testing-training",
        name: "Pruebas y Capacitación Etapa 1",
        status: "in-progress",
        priority: "medium",
      },
      {
        id: "error-handling",
        name: "Manejo de Errores y Logs",
        status: "in-progress",
        priority: "low",
      },
      {
        id: "performance-optimization",
        name: "Optimización de Rendimiento Inicial",
        status: "pending",
        priority: "low",
      },
    ],
  },
  {
    id: "stage-2",
    name: "Etapa 2: Estandarización de Material",
    description: "Plantillas estandarizadas, organización de recursos y automatización",
    duration: "Semanas 5-8 (4 semanas)",
    status: "pending",
    progress: 0,
    tasks: [
      {
        id: "document-templates",
        name: "Plantillas de Documentos Legales",
        status: "pending",
        priority: "high",
      },
      {
        id: "photo-templates",
        name: "Plantillas de Organización de Fotos",
        status: "pending",
        priority: "high",
      },
      {
        id: "naming-conventions",
        name: "Convenciones de Nomenclatura",
        status: "pending",
        priority: "high",
      },
      {
        id: "metadata-standards",
        name: "Estándares de Metadatos",
        status: "pending",
        priority: "medium",
      },
      {
        id: "quality-control",
        name: "Control de Calidad Automatizado",
        status: "pending",
        priority: "medium",
      },
      {
        id: "bulk-operations",
        name: "Operaciones en Lote",
        status: "pending",
        priority: "medium",
      },
      {
        id: "backup-system",
        name: "Sistema de Respaldos",
        status: "pending",
        priority: "medium",
      },
      {
        id: "version-control",
        name: "Control de Versiones de Documentos",
        status: "pending",
        priority: "low",
      },
      {
        id: "compliance-check",
        name: "Verificación de Cumplimiento Legal",
        status: "pending",
        priority: "low",
      },
      {
        id: "template-customization",
        name: "Personalización de Plantillas",
        status: "pending",
        priority: "low",
      },
      {
        id: "integration-testing-2",
        name: "Pruebas de Integración Etapa 2",
        status: "pending",
        priority: "medium",
      },
      {
        id: "user-training-2",
        name: "Capacitación de Usuarios Avanzada",
        status: "pending",
        priority: "medium",
      },
    ],
  },
  {
    id: "stage-3",
    name: "Etapa 3: Vinculación de Compradores",
    description: "Integración con Gmail, redes sociales, análisis de mensajería y centralización",
    duration: "Semanas 9-12 (4 semanas)",
    status: "pending",
    progress: 0,
    tasks: [
      {
        id: "gmail-oauth",
        name: "Configuración OAuth Gmail",
        status: "pending",
        priority: "high",
      },
      {
        id: "email-parsing",
        name: "Análisis de Correos Electrónicos",
        status: "pending",
        priority: "high",
      },
      {
        id: "lead-identification",
        name: "Identificación de Leads",
        status: "pending",
        priority: "high",
      },
      {
        id: "whatsapp-integration",
        name: "Integración WhatsApp Business",
        status: "pending",
        priority: "high",
      },
      {
        id: "facebook-monitoring",
        name: "Monitoreo Facebook/Instagram",
        status: "pending",
        priority: "medium",
      },
      {
        id: "sentiment-analysis",
        name: "Análisis de Sentimientos",
        status: "pending",
        priority: "medium",
      },
      {
        id: "lead-scoring",
        name: "Sistema de Puntuación de Leads",
        status: "pending",
        priority: "medium",
      },
      {
        id: "automated-responses",
        name: "Respuestas Automatizadas",
        status: "pending",
        priority: "medium",
      },
      {
        id: "crm-integration",
        name: "Integración con CRM",
        status: "pending",
        priority: "low",
      },
      {
        id: "analytics-dashboard",
        name: "Dashboard de Análisis de Compradores",
        status: "pending",
        priority: "low",
      },
      {
        id: "notification-system",
        name: "Sistema de Notificaciones",
        status: "pending",
        priority: "low",
      },
      {
        id: "integration-testing-3",
        name: "Pruebas de Integración Etapa 3",
        status: "pending",
        priority: "medium",
      },
      {
        id: "user-training-3",
        name: "Capacitación de Usuarios Etapa 3",
        status: "pending",
        priority: "medium",
      },
    ],
  },
]

const milestones: Milestone[] = [
  {
    id: "stage-1",
    title: "Etapa 1: Configuración Base y Google Drive",
    description: "Configuración inicial del sistema y conexión con Google Drive",
    duration: "Semanas 1-4 (2 de 4 completadas)",
    status: "in-progress",
    progress: 75,
    tasks: [
      { name: "Configurar Tailwind CSS", completed: true },
      { name: "Crear componentes base", completed: true },
      { name: "Setup de navegación", completed: true },
      { name: "Integración Google Drive API", completed: true },
      { name: "Procesamiento de casos de éxito", completed: true },
      { name: "Extracción de números de rol", completed: true },
      { name: "Sistema híbrido OCR + AI", completed: true },
      { name: "Interfaz móvil optimizada", completed: true },
      { name: "Validación estructura carpetas", completed: true },
    ],
  },
  {
    id: 2,
    title: "Finalización Etapa 1",
    description: "Completar todas las funcionalidades del repositorio de clientes",
    status: "pending",
    progress: 0,
    dueDate: "2025-09-13",
  },
  {
    id: 3,
    title: "Etapa 2: Material de Producto",
    description: "Desarrollo de plantillas y estandarización de materiales",
    status: "pending",
    progress: 0,
    dueDate: "2025-10-11",
  },
  {
    id: 4,
    title: "Etapa 3: Vinculación de Compradores",
    description: "Integración completa con sistemas de comunicación",
    status: "pending",
    progress: 0,
    dueDate: "2025-11-08",
  },
  {
    id: 5,
    title: "Entrega Final MVP",
    description: "Sistema completo funcionando en producción",
    status: "pending",
    progress: 0,
    dueDate: "2025-11-15",
  },
]

const MVPSeguimientoPage = () => {
  const [overallProgress, setOverallProgress] = useState(65)
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")

  useEffect(() => {
    if (milestones && milestones.length > 0) {
      const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0)
      setOverallProgress(Math.round(totalProgress / milestones.length))
    }
  }, [])

  const developmentMetrics: DevelopmentMetrics = {
    totalCommits: 78,
    linesOfCode: 3200,
    testsWritten: 24,
    testCoverage: 45.2,
    bugsFixed: 15,
    bugsOpen: 2,
    performanceScore: 85,
    securityScore: 92,
    codeQuality: 8.4,
    deployments: 12,
    uptime: 99.1,
    responseTime: 220,
  }

  const teamProductivity: TeamProductivity[] = [
    {
      developer: "Desarrollador Principal",
      commitsThisWeek: 35,
      linesAdded: 1847,
      linesRemoved: 423,
      pullRequests: 12,
      reviewsCompleted: 8,
      bugsFixed: 11,
    },
    {
      developer: "Sur-Realista Team",
      commitsThisWeek: 22,
      linesAdded: 1156,
      linesRemoved: 234,
      pullRequests: 9,
      reviewsCompleted: 12,
      bugsFixed: 6,
    },
  ]

  const completedMilestones = milestones?.filter((m) => m.status === "completed").length || 0
  const inProgressMilestones = milestones?.filter((m) => m.status === "in-progress").length || 0
  const pendingMilestones = milestones?.filter((m) => m.status === "pending").length || 0

  const totalEstimatedHours =
    milestones?.reduce(
      (sum, milestone) =>
        sum + (milestone.tasks?.reduce((taskSum, task) => taskSum + (task.completed ? 1 : 0), 0) || 0),
      0,
    ) || 0

  const totalActualHours =
    milestones?.reduce(
      (sum, milestone) =>
        sum + (milestone.tasks?.reduce((taskSum, task) => taskSum + (task.completed ? 1 : 0), 0) || 0),
      0,
    ) || 0

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-gray-100 text-gray-800", text: "Pendiente", icon: AlertTriangle },
      "in-progress": { color: "bg-blue-100 text-blue-800", text: "En Progreso", icon: TrendingUp },
      completed: { color: "bg-green-100 text-green-800", text: "Completado", icon: CheckCircle },
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
      low: { color: "bg-green-100 text-green-800", text: "Baja" },
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Activity className="h-5 w-5 text-blue-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            MVP Sur-Realista - Seguimiento Completo
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema integral de gestión de repositorio, estandarización y vinculación de compradores
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-500 text-white px-4 py-2 text-lg">{overallProgress}% Completado</Badge>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="day">Último día</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <GitBranch className="h-4 w-4" />
            Ver Commits
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              +20% con extracción de rol implementada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líneas de Código</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{developmentMetrics.linesOfCode.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              +1100 esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura Tests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{developmentMetrics.testCoverage}%</div>
            <Progress value={developmentMetrics.testCoverage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              +12.4% con nuevos tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{developmentMetrics.performanceScore}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              +7 puntos con optimizaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="stage-1" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Etapa 1
          </TabsTrigger>
          <TabsTrigger value="stage-2" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Etapa 2
          </TabsTrigger>
          <TabsTrigger value="stage-3" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Etapa 3
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Hitos
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Desarrollo
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mvpStages.map((stage) => (
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
                      <strong>Tareas:</strong> {stage.tasks?.filter((t) => t.status === "completed").length || 0} /{" "}
                      {stage.tasks?.length || 0} completadas
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Development Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Salud del Desarrollo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Calidad del Código</span>
                  <div className="flex items-center gap-2">
                    <Progress value={developmentMetrics.codeQuality} className="w-20 h-2" />
                    <span className="text-sm font-bold">{developmentMetrics.codeQuality}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Seguridad</span>
                  <div className="flex items-center gap-2">
                    <Progress value={developmentMetrics.securityScore} className="w-20 h-2" />
                    <span className="text-sm font-bold text-green-600">{developmentMetrics.securityScore}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <div className="flex items-center gap-2">
                    <Progress value={developmentMetrics.uptime} className="w-20 h-2" />
                    <span className="text-sm font-bold text-green-600">{developmentMetrics.uptime}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiempo de Respuesta</span>
                  <span className="text-sm font-bold">{developmentMetrics.responseTime}ms</span>
                </div>
              </CardContent>
            </Card>

            {/* Bug Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Seguimiento de Bugs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{developmentMetrics.bugsFixed}</div>
                    <p className="text-sm text-green-700">Bugs Resueltos</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{developmentMetrics.bugsOpen}</div>
                    <p className="text-sm text-red-700">Bugs Abiertos</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Críticos</span>
                    <Badge className="bg-red-100 text-red-800">2</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Altos</span>
                    <Badge className="bg-orange-100 text-orange-800">3</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Medios</span>
                    <Badge className="bg-yellow-100 text-yellow-800">2</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Bajos</span>
                    <Badge className="bg-green-100 text-green-800">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Seguimiento de Tiempo
              </CardTitle>
              <CardDescription>Comparación entre tiempo estimado vs tiempo real invertido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalEstimatedHours}h</div>
                  <p className="text-sm text-blue-700">Tiempo Estimado</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalActualHours}h</div>
                  <p className="text-sm text-green-700">Tiempo Real</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((totalActualHours / totalEstimatedHours) * 100)}%
                  </div>
                  <p className="text-sm text-purple-700">Precisión Estimación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>

                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Migración de Datos</div>
                          <div className="text-sm text-gray-600">Reorganización automatizada</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Especificaciones Técnicas</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>API:</strong> Google Drive API v3
                      </div>
                      <div>
                        <strong>API Key:</strong> Configurada (Sur-Realista)
                      </div>
                      <div>
                        <strong>Sincronización:</strong> Bidireccional en tiempo real
                      </div>
                      <div>
                        <strong>Casos de Éxito:</strong> 5 identificados y procesados
                      </div>
                      <div>
                        <strong>Funcionalidades:</strong> Edición, descarga directa
                      </div>
                      <div>
                        <strong>Nomenclatura:</strong> Sistema estandarizado
                      </div>
                      <div>
                        <strong>Scripts:</strong> Listos para migración real
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 1</h4>
                  <div className="space-y-3">
                    {mvpStages
                      ?.find((s) => s.id === "stage-1")
                      ?.tasks?.map((task) => (
                        <div key={task} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{task.name}</div>
                              {task.id === "api-integration" && task.status === "completed" && (
                                <div className="text-sm text-green-600">API key configurada y funcionando</div>
                              )}
                              {task.id === "web-interface" && task.status === "completed" && (
                                <div className="text-sm text-green-600">Interfaz completa con datos reales</div>
                              )}
                              {task.id === "migration" && task.status === "completed" && (
                                <div className="text-sm text-green-600">Sistema de migración preparado</div>
                              )}
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

        <TabsContent value="stage-2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Etapa 2: Estandarización de Material de Producto
              </CardTitle>
              <CardDescription>Desarrollo de plantillas profesionales y automatización de contenido</CardDescription>
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

                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 2</h4>
                  <div className="space-y-3">
                    {mvpStages
                      ?.find((s) => s.id === "stage-2")
                      ?.tasks?.map((task) => (
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

                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-3">Tareas de la Etapa 3</h4>
                  <div className="space-y-3">
                    {mvpStages
                      ?.find((s) => s.id === "stage-3")
                      ?.tasks?.map((task) => (
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

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma de Implementación
              </CardTitle>
              <CardDescription>Calendario detallado de 3 meses para la implementación completa del MVP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Semanas 1-4</div>
                    <div className="text-sm text-gray-600">Repositorio de Clientes</div>
                    <Progress value={35} className="mt-2 h-2" />
                    <div className="text-xs text-gray-500 mt-1">2 de 4 semanas completadas</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Semanas 5-8</div>
                    <div className="text-sm text-gray-600">Material de Producto</div>
                    <Progress value={0} className="mt-2 h-2" />
                    <div className="text-xs text-gray-500 mt-1">Inicio: 16 Sep 2025</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">Semanas 9-12</div>
                    <div className="text-sm text-gray-600">Vinculación Compradores</div>
                    <Progress value={0} className="mt-2 h-2" />
                    <div className="text-xs text-gray-500 mt-1">Inicio: 14 Oct 2025</div>
                  </div>
                </div>

                {/* Project Timeline Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Resumen del Proyecto - 3 Meses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Fechas Clave</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>
                          • <strong>Inicio:</strong> 5 Agosto 2025
                        </li>
                        <li>
                          • <strong>Etapa 1:</strong> 5 Ago - 13 Sep (4 semanas)
                        </li>
                        <li>
                          • <strong>Etapa 2:</strong> 16 Sep - 11 Oct (4 semanas)
                        </li>
                        <li>
                          • <strong>Etapa 3:</strong> 14 Oct - 8 Nov (4 semanas)
                        </li>
                        <li>
                          • <strong>Entrega Final:</strong> 15 Noviembre 2025
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Progreso Actual</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>
                          • <strong>Tiempo transcurrido:</strong> 2 semanas de 12
                        </li>
                        <li>
                          • <strong>Progreso general:</strong> 50% de Etapa 1
                        </li>
                        <li>
                          • <strong>Próximo hito:</strong> Finalizar Etapa 1
                        </li>
                        <li>
                          • <strong>Tiempo restante:</strong> 10 semanas
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Detailed Timeline */}
                <div className="space-y-6">
                  {mvpStages.map((stage, index) => (
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
                          <div className="text-sm text-gray-600">{stage.description}</div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Entregables</h4>
                          <div className="space-y-1">
                            {stage.tasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2 text-sm">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    task.status === "completed"
                                      ? "bg-green-500"
                                      : task.status === "in-progress"
                                        ? "bg-blue-500"
                                        : "bg-gray-300"
                                  }`}
                                ></div>
                                {task.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <div className="grid gap-6">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(milestone.status)}
                      <div>
                        <CardTitle className="text-lg">{milestone.title}</CardTitle>
                        <CardDescription className="mt-1">{milestone.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha límite:</span>
                      <span className="ml-2 font-medium">{milestone.dueDate}</span>
                    </div>
                  </div>

                  {/* Detailed Metrics for Milestone */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {milestone.tasks?.filter((task) => task.completed).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Tareas Completadas</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tareas Detalladas:</h4>
                    <div className="space-y-2">
                      {milestone.tasks?.map((task) => (
                        <div
                          key={task.name}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {task.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                              {task.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Actividad de Desarrollo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Commits</span>
                  <span className="text-lg font-bold">{developmentMetrics.totalCommits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deployments</span>
                  <span className="text-lg font-bold">{developmentMetrics.deployments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tests Escritos</span>
                  <span className="text-lg font-bold">{developmentMetrics.testsWritten}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Commits esta semana</span>
                    <Badge className="bg-blue-100 text-blue-800">47</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Pull Requests abiertas</span>
                    <Badge className="bg-green-100 text-green-800">4</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Reviews pendientes</span>
                    <Badge className="bg-yellow-100 text-yellow-800">6</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Calidad del Código
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Complejidad Ciclomática</span>
                    <Badge className="bg-green-100 text-green-800">Baja</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duplicación de Código</span>
                    <span className="text-sm font-bold">2.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deuda Técnica</span>
                    <Badge className="bg-yellow-100 text-yellow-800">4.2h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maintainability Index</span>
                    <span className="text-sm font-bold text-green-600">87/100</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Métricas por Módulo:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Frontend</span>
                      <span className="font-medium">A+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Backend</span>
                      <span className="font-medium">A</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IA Module</span>
                      <span className="font-medium">A-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Integrations</span>
                      <span className="font-medium">B+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Rendimiento Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{developmentMetrics.performanceScore}</div>
                  <p className="text-sm text-green-700">Lighthouse Score</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>First Contentful Paint</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Largest Contentful Paint</span>
                    <span className="font-medium">2.1s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Cumulative Layout Shift</span>
                    <span className="font-medium">0.05</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Time to Interactive</span>
                    <span className="font-medium">2.8s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  APIs y Integraciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Interna</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">98ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SII Chile</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">245ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CIREN</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">1.2s</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OpenAI</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">890ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">45ms</div>
                  <p className="text-sm text-blue-700">Tiempo Promedio Query</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conexiones Activas</span>
                    <span className="font-medium">12/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Queries Lentas</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Tamaño DB</span>
                    <span className="font-medium">2.4 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-6">
            {teamProductivity.map((member) => (
              <Card key={member.developer}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {member.developer}
                    </span>
                    <Badge className="bg-blue-100 text-blue-800">{member.commitsThisWeek} commits</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        <Plus className="h-4 w-4 inline mr-1" />
                        {member.linesAdded}
                      </div>
                      <p className="text-xs text-green-700">Líneas Añadidas</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        <Minus className="h-4 w-4 inline mr-1" />
                        {member.linesRemoved}
                      </div>
                      <p className="text-xs text-red-700">Líneas Removidas</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{member.pullRequests}</div>
                      <p className="text-xs text-blue-700">Pull Requests</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{member.reviewsCompleted}</div>
                      <p className="text-xs text-purple-700">Reviews</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{member.bugsFixed}</div>
                      <p className="text-xs text-orange-700">Bugs Fixed</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {Math.round((member.linesAdded / member.commitsThisWeek) * 10) / 10}
                      </div>
                      <p className="text-xs text-yellow-700">Líneas/Commit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Resumen del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {teamProductivity?.reduce((sum, member) => sum + member.commitsThisWeek, 0) || 0}
                  </div>
                  <p className="text-sm text-blue-700">Total Commits Semana</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {teamProductivity?.reduce((sum, member) => sum + member.pullRequests, 0) || 0}
                  </div>
                  <p className="text-sm text-green-700">Pull Requests Activas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {teamProductivity?.reduce((sum, member) => sum + member.reviewsCompleted, 0) || 0}
                  </div>
                  <p className="text-sm text-purple-700">Reviews Completadas</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {teamProductivity?.reduce((sum, member) => sum + member.bugsFixed, 0) || 0}
                  </div>
                  <p className="text-sm text-orange-700">Bugs Resueltos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Hitos Críticos
          </CardTitle>
          <CardDescription>Objetivos prioritarios para las próximas 2 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Reorganización Completa - Completada</h4>
                <p className="text-sm text-green-700 mt-1">
                  Sidebar reorganizado, navegación optimizada, enfoque en MVP y herramientas esenciales. Enlaces reales
                  de Google Drive actualizados.
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                  <span>Completado: 16 Ago 2025</span>
                  <span>Progreso: 100%</span>
                  <span>Estado: Activo</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-800">Enlaces Google Drive Reales - Actualizados</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Todos los componentes ahora apuntan a la carpeta real de casos de éxito:
                  folders/11JY7ME6h72wrjud9bYwduqYSbFRcH7i5
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                  <span>Actualizado: 16 Ago 2025</span>
                  <span>Progreso: 100%</span>
                  <span>Casos: 5 reales</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MVPSeguimientoPage
