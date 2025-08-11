"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DetailedMetricsDashboard } from "@/components/mvp/detailed-metrics-dashboard"
import { AlertsNotificationsSystem } from "@/components/mvp/alerts-notifications-system"
import { AutomatedReportsSystem } from "@/components/mvp/automated-reports-system"
import { UserFeedbackAnalytics } from "@/components/mvp/user-feedback-analytics"
import { BarChart3, Bell, FileText, MessageSquare, Activity, TrendingUp } from 'lucide-react'

export default function AnalyticsCompletoPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Analytics Completo MVP
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema integral de métricas, alertas, reportes y feedback de usuarios
          </p>
        </div>
      </div>

      {/* Main Analytics Dashboard */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas Detalladas
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas y Notificaciones
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes Automatizados
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback de Usuarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Dashboard de Métricas Avanzadas
              </CardTitle>
              <CardDescription>
                Análisis profundo del rendimiento del sistema y desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DetailedMetricsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Sistema de Alertas y Notificaciones
              </CardTitle>
              <CardDescription>
                Monitoreo proactivo y gestión de alertas críticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsNotificationsSystem />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sistema de Reportes Automatizados
              </CardTitle>
              <CardDescription>
                Generación automática de reportes para stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomatedReportsSystem />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Analytics de Feedback de Usuarios
              </CardTitle>
              <CardDescription>
                Análisis inteligente del feedback y satisfacción de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserFeedbackAnalytics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
