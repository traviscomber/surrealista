"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Target,
  Calendar,
  Users,
  Rocket,
  Brain,
  Database,
  Globe,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  ArrowRight,
  Plus,
  Layers,
  Settings,
} from "lucide-react"

interface RoadmapItem {
  id: string
  title: string
  description: string
  category: "core" | "ai" | "integrations" | "ux" | "infrastructure"
  priority: "critical" | "high" | "medium" | "low"
  status: "completed" | "in-progress" | "planned" | "research"
  progress: number
  quarter: "Q1-2024" | "Q2-2024" | "Q3-2024" | "Q4-2024" | "Q1-2025"
  estimatedEffort: string
  dependencies?: string[]
  features: string[]
  businessValue: "high" | "medium" | "low"
  technicalComplexity: "high" | "medium" | "low"
}

const roadmapItems: RoadmapItem[] = [
  {
    id: "mvp-phase1",
    title: "MVP Fase 1 - Core Platform",
    description: "Plataforma base con funcionalidades esenciales para gestión inmobiliaria",
    category: "core",
    priority: "critical",
    status: "completed",
    progress: 100,
    quarter: "Q1-2024",
    estimatedEffort: "3 meses",
    features: ["Sistema CRUD propiedades", "Importación Google Drive", "Panel administración", "Asistente IA básico"],
    businessValue: "high",
    technicalComplexity: "medium",
  },
  {
    id: "ai-complex-queries",
    title: "IA - Consultas Complejas",
    description: "Capacidades avanzadas de análisis e inteligencia artificial",
    category: "ai",
    priority: "high",
    status: "completed",
    progress: 95,
    quarter: "Q1-2024",
    estimatedEffort: "6 semanas",
    features: [
      "Análisis de inversión integral",
      "Proyecciones de mercado",
      "Consultas multi-variable",
      "Recomendaciones personalizadas",
    ],
    businessValue: "high",
    technicalComplexity: "high",
  },
  {
    id: "data-integrations",
    title: "Integraciones de Datos Oficiales",
    description: "Conexiones con fuentes gubernamentales y oficiales",
    category: "integrations",
    priority: "high",
    status: "in-progress",
    progress: 75,
    quarter: "Q1-2024",
    estimatedEffort: "8 semanas",
    dependencies: ["mvp-phase1"],
    features: ["API SII Chile", "Dashboard CIREN", "Banco Central datos", "OpenStreetMap integration"],
    businessValue: "high",
    technicalComplexity: "medium",
  },
  {
    id: "predictive-analytics",
    title: "Análisis Predictivo ML",
    description: "Modelos de machine learning para predicciones de mercado",
    category: "ai",
    priority: "high",
    status: "in-progress",
    progress: 40,
    quarter: "Q2-2024",
    estimatedEffort: "10 semanas",
    dependencies: ["ai-complex-queries", "data-integrations"],
    features: [
      "Predicción precios propiedades",
      "Análisis tendencias mercado",
      "Scoring automático propiedades",
      "Alertas oportunidades inversión",
    ],
    businessValue: "high",
    technicalComplexity: "high",
  },
  {
    id: "mobile-optimization",
    title: "Optimización Móvil",
    description: "Experiencia móvil nativa y PWA",
    category: "ux",
    priority: "medium",
    status: "planned",
    progress: 65,
    quarter: "Q2-2024",
    estimatedEffort: "6 semanas",
    features: [
      "PWA implementation",
      "Diseño responsive avanzado",
      "Gestos táctiles optimizados",
      "Modo offline básico",
    ],
    businessValue: "medium",
    technicalComplexity: "medium",
  },
  {
    id: "public-api",
    title: "API Pública v1",
    description: "API REST para integraciones de terceros",
    category: "infrastructure",
    priority: "medium",
    status: "planned",
    progress: 0,
    quarter: "Q2-2024",
    estimatedEffort: "8 semanas",
    dependencies: ["mvp-phase1"],
    features: ["REST API completa", "Documentación OpenAPI", "Sistema autenticación", "Rate limiting"],
    businessValue: "medium",
    technicalComplexity: "medium",
  },
  {
    id: "multi-tenant",
    title: "Arquitectura Multi-tenant",
    description: "Soporte para múltiples organizaciones",
    category: "infrastructure",
    priority: "high",
    status: "research",
    progress: 5,
    quarter: "Q3-2024",
    estimatedEffort: "12 semanas",
    dependencies: ["public-api"],
    features: ["Aislamiento de datos", "Configuración por tenant", "Billing y subscripciones", "Panel super-admin"],
    businessValue: "high",
    technicalComplexity: "high",
  },
  {
    id: "advanced-search",
    title: "Búsqueda Avanzada IA",
    description: "Motor de búsqueda inteligente con NLP",
    category: "ai",
    priority: "medium",
    status: "planned",
    progress: 0,
    quarter: "Q3-2024",
    estimatedEffort: "8 semanas",
    dependencies: ["predictive-analytics"],
    features: [
      "Búsqueda en lenguaje natural",
      "Filtros inteligentes",
      "Búsqueda por imágenes",
      "Recomendaciones contextuales",
    ],
    businessValue: "medium",
    technicalComplexity: "high",
  },
  {
    id: "blockchain-integration",
    title: "Integración Blockchain",
    description: "Contratos inteligentes y tokenización",
    category: "integrations",
    priority: "low",
    status: "research",
    progress: 0,
    quarter: "Q4-2024",
    estimatedEffort: "16 semanas",
    features: ["Smart contracts propiedades", "Tokenización activos", "Historial inmutable", "Pagos crypto"],
    businessValue: "low",
    technicalComplexity: "high",
  },
  {
    id: "ar-vr-tours",
    title: "Tours AR/VR",
    description: "Realidad aumentada y virtual para propiedades",
    category: "ux",
    priority: "low",
    status: "research",
    progress: 0,
    quarter: "Q1-2025",
    estimatedEffort: "20 semanas",
    features: ["Tours virtuales 360°", "AR visualización muebles", "VR experiencias inmersivas", "Mediciones AR"],
    businessValue: "medium",
    technicalComplexity: "high",
  },
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "core":
      return <Rocket className="h-5 w-5" />
    case "ai":
      return <Brain className="h-5 w-5" />
    case "integrations":
      return <Globe className="h-5 w-5" />
    case "ux":
      return <Users className="h-5 w-5" />
    case "infrastructure":
      return <Database className="h-5 w-5" />
    default:
      return <Settings className="h-5 w-5" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "core":
      return "bg-blue-100 text-blue-800"
    case "ai":
      return "bg-purple-100 text-purple-800"
    case "integrations":
      return "bg-green-100 text-green-800"
    case "ux":
      return "bg-orange-100 text-orange-800"
    case "infrastructure":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "in-progress":
      return <Zap className="h-5 w-5 text-blue-500" />
    case "planned":
      return <Clock className="h-5 w-5 text-yellow-500" />
    case "research":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />
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
    case "planned":
      return "bg-yellow-100 text-yellow-800"
    case "research":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-800"
    case "high":
      return "bg-orange-100 text-orange-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function MVPRoadmapPage() {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredItems = roadmapItems.filter((item) => {
    const quarterMatch = selectedQuarter === "all" || item.quarter === selectedQuarter
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory
    return quarterMatch && categoryMatch
  })

  const quarters = ["Q1-2024", "Q2-2024", "Q3-2024", "Q4-2024", "Q1-2025"]
  const categories = ["core", "ai", "integrations", "ux", "infrastructure"]

  const getQuarterProgress = (quarter: string) => {
    const quarterItems = roadmapItems.filter((item) => item.quarter === quarter)
    if (quarterItems.length === 0) return 0
    const totalProgress = quarterItems.reduce((sum, item) => sum + item.progress, 0)
    return Math.round(totalProgress / quarterItems.length)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Roadmap MVP
          </h1>
          <p className="text-gray-600 mt-2">Hoja de ruta del desarrollo - Visión estratégica 2024-2025</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-500 text-white px-4 py-2 text-lg">10 Iniciativas</Badge>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Sugerir Feature
          </Button>
        </div>
      </div>

      {/* Quarter Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {quarters.map((quarter) => {
          const progress = getQuarterProgress(quarter)
          const itemCount = roadmapItems.filter((item) => item.quarter === quarter).length
          return (
            <Card key={quarter} className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{quarter}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{progress}%</div>
                <Progress value={progress} className="mb-2" />
                <p className="text-xs text-muted-foreground">{itemCount} iniciativas</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trimestre:</span>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">Todos</option>
            {quarters.map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Categoría:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roadmap Items */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vista Cronológica
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Por Categoría
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Por Prioridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <div className="space-y-6">
            {filteredItems.map((item, index) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            item.status === "completed"
                              ? "bg-green-500"
                              : item.status === "in-progress"
                                ? "bg-blue-500"
                                : item.status === "planned"
                                  ? "bg-yellow-500"
                                  : "bg-orange-500"
                          }`}
                        />
                        {index < filteredItems.length - 1 && <div className="w-0.5 h-16 bg-gray-200 mt-2" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getCategoryIcon(item.category)}
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                        </div>
                        <CardDescription className="text-base mb-3">{item.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="font-medium">{item.quarter}</div>
                      <div>{item.estimatedEffort}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-sm font-medium">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor de Negocio:</span>
                      <Badge
                        className={`ml-2 ${
                          item.businessValue === "high"
                            ? "bg-green-100 text-green-800"
                            : item.businessValue === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.businessValue}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Complejidad Técnica:</span>
                      <Badge
                        className={`ml-2 ${
                          item.technicalComplexity === "high"
                            ? "bg-red-100 text-red-800"
                            : item.technicalComplexity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.technicalComplexity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Esfuerzo:</span>
                      <span className="ml-2 font-medium">{item.estimatedEffort}</span>
                    </div>
                  </div>

                  {item.dependencies && item.dependencies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Dependencias:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.dependencies.map((dep) => {
                          const depItem = roadmapItems.find((i) => i.id === dep)
                          return (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {depItem?.title || dep}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium mb-2">Funcionalidades Principales:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-3 w-3 text-blue-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="category" className="space-y-6">
          {categories.map((category) => {
            const categoryItems = filteredItems.filter((item) => item.category === category)
            if (categoryItems.length === 0) return null

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <CardTitle className="text-xl capitalize">{category}</CardTitle>
                    <Badge className={getCategoryColor(category)}>{categoryItems.length} iniciativas</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(item.status)}
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quarter} • {item.estimatedEffort}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.progress} className="w-20 h-2" />
                          <span className="text-sm font-medium w-12">{item.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          {["critical", "high", "medium", "low"].map((priority) => {
            const priorityItems = filteredItems.filter((item) => item.priority === priority)
            if (priorityItems.length === 0) return null

            return (
              <Card key={priority}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" />
                    <CardTitle className="text-xl capitalize">Prioridad {priority}</CardTitle>
                    <Badge className={getPriorityColor(priority)}>{priorityItems.length} iniciativas</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {priorityItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(item.status)}
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quarter} • {item.category} • {item.estimatedEffort}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={item.progress} className="w-20 h-2" />
                          <span className="text-sm font-medium w-12">{item.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
