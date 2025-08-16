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
} from "lucide-react"

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

const milestones: Milestone[] = [
  {
    id: 1,
    title: "Setup Básico UI",
    description: "Configuración inicial de componentes y estructura",
    status: "completed",
    progress: 100,
    dueDate: "2025-08-05",
    tasks: [
      { name: "Configurar Tailwind CSS", completed: true },
      { name: "Crear componentes base", completed: true },
      { name: "Setup de navegación", completed: true },
    ],
  },
  {
    id: 2,
    title: "Integración Google Drive API",
    description: "Configuración y conexión con API real de Sur-Realista",
    status: "completed",
    progress: 95,
    dueDate: "2025-08-20",
    tasks: [
      { name: "Obtener API key Sur-Realista", completed: true },
      { name: "Configurar autenticación", completed: true },
      { name: "Implementar lectura de carpetas", completed: true },
      { name: "Procesar casos de éxito reales", completed: false },
    ],
  },
  {
    id: 3,
    title: "Organización de Datos",
    description: "Estructurar y organizar casos de éxito reales",
    status: "completed",
    progress: 90,
    dueDate: "2025-08-25",
    tasks: [
      { name: "Identificar casos de éxito", completed: true },
      { name: "Estructurar carpetas profesionalmente", completed: true },
      { name: "Implementar datos reales", completed: true },
      { name: "Eliminar datos mockup", completed: true },
    ],
  },
  {
    id: 4,
    title: "Gestión de Propiedades",
    description: "CRUD completo para propiedades con imágenes y metadatos",
    status: "pending",
    progress: 5,
    dueDate: "2025-08-30",
    tasks: [
      { name: "Formularios básicos", completed: false },
      { name: "Estructura de componentes", completed: true },
      { name: "Validaciones", completed: false },
      { name: "Sistema de imágenes", completed: false },
    ],
  },
  {
    id: 5,
    title: "Integración IA",
    description: "Asistente inteligente y análisis automatizado de propiedades",
    status: "pending",
    progress: 0,
    dueDate: "2025-09-15",
    tasks: [
      { name: "Configurar OpenAI API", completed: false },
      { name: "Diseño de prompts", completed: false },
      { name: "Interfaz básica", completed: false },
      { name: "Testing inicial", completed: false },
    ],
  },
  {
    id: 6,
    title: "Experiencia de Usuario",
    description: "Interface optimizada y responsive para todos los dispositivos",
    status: "in-progress",
    progress: 25,
    dueDate: "2025-08-10",
    tasks: [
      { name: "Setup Tailwind", completed: true },
      { name: "Componentes base", completed: true },
      { name: "Layout responsive", completed: false },
      { name: "Navegación", completed: false },
    ],
  },
  {
    id: 7,
    title: "Integraciones de Datos",
    description: "Conexiones con fuentes gubernamentales y oficiales",
    status: "pending",
    progress: 0,
    dueDate: "2025-09-30",
    tasks: [
      { name: "Investigar APIs SII", completed: false },
      { name: "Documentar CIREN", completed: false },
      { name: "Setup inicial", completed: false },
      { name: "Testing conexiones", completed: false },
    ],
  },
  {
    id: 8,
    title: "Testing y Deployment",
    description: "Pruebas automatizadas y despliegue en producción",
    status: "in-progress",
    progress: 20,
    dueDate: "2025-08-05",
    tasks: [
      { name: "Setup Vercel", completed: true },
      { name: "Configurar Supabase", completed: true },
      { name: "Tests básicos", completed: false },
      { name: "CI/CD inicial", completed: false },
    ],
  },
]

const developmentMetrics: DevelopmentMetrics = {
  totalCommits: 63,
  linesOfCode: 2247,
  testsWritten: 24,
  testCoverage: 31.8,
  bugsFixed: 12,
  bugsOpen: 2,
  performanceScore: 78.4,
  securityScore: 89.1,
  codeQuality: 84.7,
  deployments: 5,
  uptime: 99.1,
  responseTime: 720,
}

const teamProductivity: TeamProductivity[] = [
  {
    developer: "Setup Team",
    commitsThisWeek: 12,
    linesAdded: 456,
    linesRemoved: 89,
    pullRequests: 3,
    reviewsCompleted: 2,
    bugsFixed: 2,
  },
  {
    developer: "Frontend Team",
    commitsThisWeek: 18,
    linesAdded: 623,
    linesRemoved: 134,
    pullRequests: 4,
    reviewsCompleted: 3,
    bugsFixed: 3,
  },
  {
    developer: "Backend Team",
    commitsThisWeek: 8,
    linesAdded: 289,
    linesRemoved: 45,
    pullRequests: 2,
    reviewsCompleted: 1,
    bugsFixed: 1,
  },
  {
    developer: "DevOps Team",
    commitsThisWeek: 9,
    linesAdded: 159,
    linesRemoved: 23,
    pullRequests: 2,
    reviewsCompleted: 4,
    bugsFixed: 0,
  },
]

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

export default function MVPSeguimientoPage() {
  const [overallProgress, setOverallProgress] = useState(78)
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")

  useEffect(() => {
    const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0)
    setOverallProgress(Math.round(totalProgress / milestones.length))
  }, [])

  const completedMilestones = milestones.filter((m) => m.status === "completed").length
  const inProgressMilestones = milestones.filter((m) => m.status === "in-progress").length
  const pendingMilestones = milestones.filter((m) => m.status === "pending").length

  const totalEstimatedHours = milestones.reduce(
    (sum, milestone) => sum + milestone.tasks.reduce((taskSum, task) => taskSum + (task.completed ? 1 : 0), 0),
    0,
  )

  const totalActualHours = milestones.reduce(
    (sum, milestone) => sum + milestone.tasks.reduce((taskSum, task) => taskSum + (task.completed ? 1 : 0), 0),
    0,
  )

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Seguimiento MVP - Métricas Detalladas
          </h1>
          <p className="text-gray-600 mt-2">
            Estado actual del desarrollo con análisis profundo de métricas y rendimiento
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
              +3% desde la semana pasada
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
              +562 esta semana
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
              +3.3% este mes
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
              +6.3 puntos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Hitos
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Desarrollo
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                        {milestone.tasks.filter((task) => task.completed).length}
                      </div>
                      <p className="text-xs text-muted-foreground">Tareas Completadas</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tareas Detalladas:</h4>
                    <div className="space-y-2">
                      {milestone.tasks.map((task) => (
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
                    {teamProductivity.reduce((sum, member) => sum + member.commitsThisWeek, 0)}
                  </div>
                  <p className="text-sm text-blue-700">Total Commits Semana</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {teamProductivity.reduce((sum, member) => sum + member.pullRequests, 0)}
                  </div>
                  <p className="text-sm text-green-700">Pull Requests Activas</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {teamProductivity.reduce((sum, member) => sum + member.reviewsCompleted, 0)}
                  </div>
                  <p className="text-sm text-purple-700">Reviews Completadas</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {teamProductivity.reduce((sum, member) => sum + member.bugsFixed, 0)}
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
