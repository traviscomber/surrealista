"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Download,
  RefreshCw,
  Bot,
  Phone,
  Home,
  CreditCard,
  Brain,
} from "lucide-react"
import { getChatAnalytics } from "../chat/chat-analytics"

const topicIcons = {
  propiedades: Home,
  financiamiento: CreditCard,
  tecnologia_ia: Brain,
  contacto: Phone,
  empresa: Users,
  general: MessageSquare,
}

const topicLabels = {
  propiedades: "Propiedades",
  financiamiento: "Financiamiento",
  tecnologia_ia: "Tecnología IA",
  contacto: "Contacto",
  empresa: "Empresa",
  general: "General",
}

export function ChatAnalyticsDashboard() {
  const [analytics, setAnalytics] = React.useState(getChatAnalytics())
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setAnalytics(getChatAnalytics())
    setIsRefreshing(false)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `chat-analytics-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const getTopTopics = () => {
    return Object.entries(analytics.topicDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const getPeakHours = () => {
    return Object.entries(analytics.peakHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
        percentage: (count / analytics.totalMessages) * 100,
      }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics del Chat</h2>
          <p className="text-muted-foreground">Métricas y análisis del asistente virtual</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Conversaciones iniciadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Mensajes intercambiados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">{analytics.conversionRate}% tasa de conversión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgDuration}m</div>
            <p className="text-xs text-muted-foreground">Por sesión de chat</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Temas Más Consultados</CardTitle>
            <CardDescription>Distribución de consultas por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTopTopics().map(([topic, count]) => {
                const Icon = topicIcons[topic as keyof typeof topicIcons] || MessageSquare
                const percentage = (count / analytics.totalMessages) * 100
                return (
                  <div key={topic} className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {topicLabels[topic as keyof typeof topicLabels] || topic}
                        </span>
                        <span className="text-sm text-muted-foreground">{count} mensajes</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Horas Pico</CardTitle>
            <CardDescription>Horarios con mayor actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getPeakHours().map(({ hour, count, percentage }, index) => (
                <div key={hour} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-12 justify-center">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{hour}</p>
                      <p className="text-xs text-muted-foreground">{count} mensajes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{percentage.toFixed(1)}%</p>
                    <Progress value={percentage} className="h-2 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Sesiones Recientes</CardTitle>
            <CardDescription>Últimas conversaciones del asistente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentSessions.map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Sesión {session.sessionId.slice(-8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.messageCount} mensajes • {session.topics.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {session.startTime.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {session.leadGenerated && (
                      <Badge variant="default" className="text-xs mt-1">
                        Lead
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recientes</CardTitle>
            <CardDescription>Oportunidades generadas por el chat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentLeads.map((lead, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant="outline"
                        className={
                          lead.leadType === "contact_request"
                            ? "border-blue-200 text-blue-700"
                            : lead.leadType === "property_inquiry"
                              ? "border-green-200 text-green-700"
                              : "border-purple-200 text-purple-700"
                        }
                      >
                        {lead.leadType === "contact_request"
                          ? "Solicitud Contacto"
                          : lead.leadType === "property_inquiry"
                            ? "Consulta Propiedad"
                            : "Pregunta Financiamiento"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lead.timestamp.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{lead.userMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
