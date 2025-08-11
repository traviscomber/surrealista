"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Filter, Search, Eye } from 'lucide-react'

interface UserFeedback {
  id: string
  userId: string
  userName: string
  userEmail: string
  rating: number
  category: "setup" | "ui" | "functionality" | "documentation" | "general"
  title: string
  description: string
  timestamp: string
  status: "new" | "reviewed" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "critical"
  tags: string[]
  upvotes: number
  downvotes: number
  responses: number
}

interface FeedbackMetrics {
  totalFeedback: number
  averageRating: number
  satisfactionScore: number
  responseRate: number
  resolutionTime: number
  categoryBreakdown: {
    category: string
    count: number
    averageRating: number
  }[]
  trendData: {
    date: string
    feedback: number
    rating: number
    resolved: number
  }[]
}

// Feedback realista para Etapa 1 - Testing interno y primeros usuarios
const mockFeedback: UserFeedback[] = [
  {
    id: "fb-001",
    userId: "internal-001",
    userName: "Equipo QA",
    userEmail: "qa@sur-realista.com",
    rating: 4,
    category: "setup",
    title: "Setup inicial funciona bien",
    description: "El proceso de setup está funcionando correctamente. La conexión con Supabase se estableció sin problemas y el deploy en Vercel fue exitoso.",
    timestamp: "2024-02-08T14:30:00Z",
    status: "new",
    priority: "low",
    tags: ["setup", "supabase", "vercel", "positive"],
    upvotes: 2,
    downvotes: 0,
    responses: 1
  },
  {
    id: "fb-002",
    userId: "internal-002",
    userName: "Developer 1",
    userEmail: "dev1@sur-realista.com",
    rating: 3,
    category: "functionality",
    title: "Faltan APIs por configurar",
    description: "Necesitamos configurar las APIs de Google Drive y OpenAI para poder probar la funcionalidad completa de importación de datos.",
    timestamp: "2024-02-08T13:15:00Z",
    status: "in-progress",
    priority: "high",
    tags: ["apis", "google-drive", "openai", "configuration"],
    upvotes: 3,
    downvotes: 0,
    responses: 2
  },
  {
    id: "fb-003",
    userId: "internal-003",
    userName: "Designer",
    userEmail: "design@sur-realista.com",
    rating: 5,
    category: "ui",
    title: "Interfaz base se ve bien",
    description: "Los componentes base están bien estructurados y el diseño es limpio. Buen trabajo con la configuración inicial de Tailwind.",
    timestamp: "2024-02-08T11:45:00Z",
    status: "reviewed",
    priority: "low",
    tags: ["ui", "design", "tailwind", "positive"],
    upvotes: 4,
    downvotes: 0,
    responses: 1
  },
  {
    id: "fb-004",
    userId: "internal-004",
    userName: "Backend Dev",
    userEmail: "backend@sur-realista.com",
    rating: 2,
    category: "setup",
    title: "Problemas con variables de entorno",
    description: "Algunas variables de entorno no están configuradas correctamente en el ambiente de desarrollo. Esto está bloqueando el testing de APIs.",
    timestamp: "2024-02-08T10:20:00Z",
    status: "resolved",
    priority: "critical",
    tags: ["env-vars", "configuration", "blocking"],
    upvotes: 1,
    downvotes: 0,
    responses: 3
  },
  {
    id: "fb-005",
    userId: "tester-001",
    userName: "Beta Tester 1",
    userEmail: "beta1@email.com",
    rating: 4,
    category: "general",
    title: "Buen progreso inicial",
    description: "Se ve prometedor el proyecto. La estructura base está bien organizada y es fácil de navegar.",
    timestamp: "2024-02-07T16:10:00Z",
    status: "closed",
    priority: "low",
    tags: ["positive", "structure", "navigation"],
    upvotes: 2,
    downvotes: 0,
    responses: 1
  }
]

// Métricas realistas para Etapa 1
const feedbackMetrics: FeedbackMetrics = {
  totalFeedback: 12,
  averageRating: 3.6,
  satisfactionScore: 72,
  responseRate: 100,
  resolutionTime: 0.8,
  categoryBreakdown: [
    { category: "Setup", count: 4, averageRating: 3.5 },
    { category: "UI", count: 3, averageRating: 4.3 },
    { category: "Functionality", count: 2, averageRating: 3.0 },
    { category: "Documentation", count: 2, averageRating: 3.5 },
    { category: "General", count: 1, averageRating: 4.0 }
  ],
  trendData: [
    { date: "Feb 5", feedback: 2, rating: 3.5, resolved: 1 },
    { date: "Feb 6", feedback: 3, rating: 3.7, resolved: 2 },
    { date: "Feb 7", feedback: 4, rating: 3.6, resolved: 3 },
    { date: "Feb 8", feedback: 3, rating: 3.6, resolved: 2 }
  ]
}

const ratingDistribution = [
  { rating: "5 ⭐", count: 2, percentage: 16.7, color: "#10B981" },
  { rating: "4 ⭐", count: 4, percentage: 33.3, color: "#3B82F6" },
  { rating: "3 ⭐", count: 4, percentage: 33.3, color: "#F59E0B" },
  { rating: "2 ⭐", count: 2, percentage: 16.7, color: "#F97316" },
  { rating: "1 ⭐", count: 0, percentage: 0, color: "#EF4444" }
]

export function UserFeedbackAnalytics() {
  const [feedback, setFeedback] = useState<UserFeedback[]>(mockFeedback)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFeedback = feedback.filter(item => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false
    if (selectedStatus !== "all" && item.status !== selectedStatus) return false
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "reviewed":
        return <Eye className="h-4 w-4 text-yellow-500" />
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "reviewed":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-orange-100 text-orange-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Feedback Overview - Etapa 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackMetrics.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              comentarios internos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackMetrics.averageRating}</div>
            <div className="flex items-center mt-1">
              {renderStars(Math.round(feedbackMetrics.averageRating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{feedbackMetrics.satisfactionScore}%</div>
            <p className="text-xs text-muted-foreground">
              equipo satisfecho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Respuesta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{feedbackMetrics.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              feedback respondido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Resolución</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{feedbackMetrics.resolutionTime}h</div>
            <p className="text-xs text-muted-foreground">
              promedio resolución
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencias de Feedback - Setup
                </CardTitle>
                <CardDescription>
                  Evolución diaria durante la configuración inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={feedbackMetrics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="feedback" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Feedback Recibido"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Rating Promedio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Distribución de Ratings
                </CardTitle>
                <CardDescription>
                  Calificaciones del equipo interno
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratingDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.rating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-muted-foreground">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Feedback por Categoría - Etapa 1
              </CardTitle>
              <CardDescription>
                Análisis por área de setup y desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feedbackMetrics.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Cantidad" />
                  <Bar dataKey="averageRating" fill="#10B981" name="Rating Promedio" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Categoría:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todas</option>
                    <option value="setup">Setup</option>
                    <option value="ui">UI</option>
                    <option value="functionality">Funcionalidad</option>
                    <option value="documentation">Documentación</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Estado:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="new">Nuevo</option>
                    <option value="reviewed">Revisado</option>
                    <option value="in-progress">En Progreso</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontró feedback
                  </h3>
                  <p className="text-gray-600">
                    No hay comentarios que coincidan con los filtros seleccionados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredFeedback.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex items-center">
                            {renderStars(item.rating)}
                          </div>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{item.status}</span>
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span><strong>{item.userName}</strong> ({item.userEmail})</span>
                        <span>
                          {new Date(item.timestamp).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span>{item.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          <span>{item.downvotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span>{item.responses} respuestas</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Responder
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Sentimiento del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Positivo</span>
                    <div className="flex items-center gap-2">
                      <Progress value={58} className="w-20 h-2" />
                      <span className="text-sm font-bold text-green-600">58%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Neutral</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="w-20 h-2" />
                      <span className="text-sm font-bold text-blue-600">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Constructivo</span>
                    <div className="flex items-center gap-2">
                      <Progress value={17} className="w-20 h-2" />
                      <span className="text-sm font-bold text-orange-600">17%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Análisis Tiempo de Respuesta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">0.3h</div>
                    <p className="text-sm text-green-700">Respuesta Inicial</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">0.8h</div>
                    <p className="text-sm text-blue-700">Resolución Completa</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Crítico</span>
                    <span className="font-medium">0.2h promedio</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alto</span>
                    <span className="font-medium">0.5h promedio</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medio</span>
                    <span className="font-medium">1.2h promedio</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bajo</span>
                    <span className="font-medium">2.1h promedio</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Insights y Recomendaciones - Etapa 1
              </CardTitle>
              <CardDescription>
                Análisis del feedback interno durante el setup inicial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-medium mb-3">Insights Clave</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Setup Base Exitoso</h4>
                      <p className="text-sm text-green-700">
                        El equipo está satisfecho con la configuración inicial. Supabase y Vercel funcionan correctamente.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">APIs Pendientes Bloquean Testing</h4>
                      <p className="text-sm text-yellow-700">
                        La falta de configuración de APIs externas está limitando las pruebas de funcionalidad completa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Buena Estructura de Código</h4>
                      <p className="text-sm text-blue-700">
                        El equipo de diseño y desarrollo está contento con la organización y estructura del código base.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-lg font-medium mb-3">Acciones Recomendadas</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <span className="font-medium">Alta Prioridad:</span>
                      <span className="ml-2">Configurar variables de entorno faltantes</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Crítico</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <span className="font-medium">Media Prioridad:</span>
                      <span className="ml-2">Configurar Google Drive API para importación</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Alto</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <span className="font-medium">Baja Prioridad:</span>
                      <span className="ml-2">Completar documentación de setup</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>
                  </div>
                </div>
              </div>

              {/* Team Satisfaction Trends */}
              <div>
                <h3 className="text-lg font-medium mb-3">Tendencias de Satisfacción del Equipo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+8%</div>
                    <p className="text-sm text-green-700">Satisfacción Setup</p>
                    <p className="text-xs text-muted-foreground mt-1">vs inicio semana</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">100%</div>
                    <p className="text-sm text-blue-700">Feedback Respondido</p>
                    <p className="text-xs text-muted-foreground mt-1">comunicación activa</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0.8h</div>
                    <p className="text-sm text-purple-700">Tiempo Resolución</p>
                    <p className="text-xs text-muted-foreground mt-1">muy eficiente</p>
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
