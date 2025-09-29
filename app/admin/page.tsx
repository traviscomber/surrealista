"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  Upload,
  Shield,
  BarChart3,
  Brain,
  Database,
  Activity,
  DollarSign,
  Eye,
  Clock,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Propiedades",
      value: "247",
      change: "+12%",
      changeType: "positive" as const,
      icon: Building2,
      description: "Propiedades activas en el sistema",
    },
    {
      title: "Usuarios Activos",
      value: "1,429",
      change: "+8%",
      changeType: "positive" as const,
      icon: Users,
      description: "Usuarios registrados este mes",
    },
    {
      title: "Mensajes Pendientes",
      value: "23",
      change: "-15%",
      changeType: "negative" as const,
      icon: MessageSquare,
      description: "Consultas por responder",
    },
    {
      title: "Precisión IA",
      value: "94.7%",
      change: "+5.4%",
      changeType: "positive" as const,
      icon: Brain,
      description: "Precisión del asistente IA",
    },
  ]

  const quickActions = [
    {
      title: "Nueva Propiedad",
      description: "Agregar propiedad al catálogo",
      href: "/admin/propiedades/nueva",
      icon: Plus,
      color: "bg-blue-500",
    },
    {
      title: "Importar Datos",
      description: "Importar desde fuentes externas",
      href: "/admin/importar-propiedades",
      icon: Upload,
      color: "bg-green-500",
    },
    {
      title: "Dashboard CIREN",
      description: "Análisis de riesgos naturales",
      href: "/admin/ciren-dashboard",
      icon: Shield,
      color: "bg-purple-500",
    },
    {
      title: "Analytics",
      description: "Ver reportes detallados",
      href: "/admin/analytics",
      icon: BarChart3,
      color: "bg-orange-500",
    },
    {
      title: "IA Workspace",
      description: "Gestión de agentes IA",
      href: "/admin/ia-workspace",
      icon: Brain,
      color: "bg-pink-500",
    },
    {
      title: "Integraciones",
      description: "Conexiones de datos",
      href: "/admin/conexiones-datos",
      icon: Database,
      color: "bg-indigo-500",
    },
    {
      title: "KMZ Reader",
      description: "Visualizar archivos KMZ",
      href: "/admin/kmz-reader",
      icon: Eye,
      color: "bg-teal-500",
    },
    {
      title: "Google Drive",
      description: "Gestión de archivos",
      href: "/admin/google-drive",
      icon: Database,
      color: "bg-yellow-500",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "Nueva propiedad agregada",
      details: "Casa en Puerto Varas - 3D/2B",
      time: "Hace 2 horas",
      type: "property",
    },
    {
      id: 2,
      action: "Usuario registrado",
      details: "María González - Interesada en Pucón",
      time: "Hace 4 horas",
      type: "user",
    },
    {
      id: 3,
      action: "Consulta respondida",
      details: "Información sobre financiamiento",
      time: "Hace 6 horas",
      type: "message",
    },
    {
      id: 4,
      action: "Análisis CIREN completado",
      details: "Evaluación de riesgos - Lote en Valdivia",
      time: "Hace 8 horas",
      type: "analysis",
    },
  ]

  const chatAnalytics = {
    totalSessions: 1347,
    totalMessages: 9234,
    leadsGenerated: 178,
    conversionRate: 13.2,
    topTopics: [
      { topic: "Análisis de completitud", count: 267 },
      { topic: "Precios de propiedades", count: 234 },
      { topic: "Visualización KMZ", count: 201 },
      { topic: "Ubicaciones disponibles", count: 189 },
      { topic: "Proceso de compra", count: 167 },
    ],
    peakHours: [
      { hour: "10:00", sessions: 48 },
      { hour: "14:00", sessions: 55 },
      { hour: "16:00", sessions: 42 },
      { hour: "19:00", sessions: 44 },
    ],
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Principal</h1>
          <p className="text-gray-600 mt-2">Bienvenido al panel de administración de Sur-Realista</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Sistema Activo
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Última actualización: hace 5 min
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={stat.changeType === "positive" ? "default" : "destructive"} className="text-xs">
                  {stat.change}
                </Badge>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Analytics del Chat
            </CardTitle>
            <CardDescription>Estadísticas del asistente IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{chatAnalytics.totalSessions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Sesiones Totales</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{chatAnalytics.totalMessages.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Mensajes</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{chatAnalytics.leadsGenerated}</div>
                <div className="text-sm text-gray-600">Leads Generados</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{chatAnalytics.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversión</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Temas Más Consultados</h4>
              <div className="space-y-2">
                {chatAnalytics.topTopics.slice(0, 3).map((topic, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{topic.topic}</span>
                    <Badge variant="secondary">{topic.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Horas Pico</h4>
              <div className="grid grid-cols-4 gap-2">
                {chatAnalytics.peakHours.map((hour, index) => (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-semibold">{hour.hour}</div>
                    <div className="text-xs text-gray-600">{hour.sessions}</div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-transparent" variant="outline" asChild>
              <Link href="/admin/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Analytics Completo
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === "property" && (
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === "user" && (
                      <div className="p-2 bg-green-100 rounded-full">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {activity.type === "message" && (
                      <div className="p-2 bg-purple-100 rounded-full">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    {activity.type === "analysis" && (
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Shield className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 bg-transparent" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Ver Toda la Actividad
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Datos</CardTitle>
          <CardDescription>Descarga reportes y analytics en diferentes formatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const data = JSON.stringify(chatAnalytics, null, 2)
                const blob = new Blob([data], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "chat-analytics.json"
                a.click()
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Exportar Analytics Chat (JSON)
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Reporte de Ventas (CSV)
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Lista de Usuarios (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
