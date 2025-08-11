"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, Mail, Calendar, Clock, TrendingUp, BarChart3, PieChart, Activity, Users, Code, Bug, Zap, Database, Globe, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
  enabled: boolean
  lastGenerated: string
  nextScheduled: string
  recipients: string[]
  sections: string[]
  format: "pdf" | "html" | "json"
}

interface ReportMetrics {
  period: string
  setup: {
    overallProgress: number
    trend: number
    criticalIssues: number
  }
  development: {
    commitsCount: number
    componentsCreated: number
    testsWritten: number
    configsCompleted: number
  }
  infrastructure: {
    servicesActive: number
    dbTablesCreated: number
    apisConfigured: number
  }
  quality: {
    codeQuality: number
    setupCompletion: number
    documentationScore: number
  }
}

// Plantillas realistas para Etapa 1
const reportTemplates: ReportTemplate[] = [
  {
    id: "daily-setup",
    name: "Reporte Diario de Setup",
    description: "Progreso diario del setup inicial y configuraciones",
    frequency: "daily",
    enabled: true,
    lastGenerated: "2024-02-08T08:00:00Z",
    nextScheduled: "2024-02-09T08:00:00Z",
    recipients: ["equipo@sur-realista.com", "lead@sur-realista.com"],
    sections: ["setup-progress", "configurations", "database-status", "next-steps"],
    format: "html"
  },
  {
    id: "weekly-milestone",
    name: "Reporte Semanal de Hitos",
    description: "Progreso semanal hacia completar la Etapa 1",
    frequency: "weekly",
    enabled: true,
    lastGenerated: "2024-02-05T09:00:00Z",
    nextScheduled: "2024-02-12T09:00:00Z",
    recipients: ["founder@sur-realista.com", "lead@sur-realista.com"],
    sections: ["milestone-progress", "setup-status", "blockers", "next-week-goals"],
    format: "pdf"
  },
  {
    id: "setup-completion",
    name: "Reporte de Finalización Setup",
    description: "Reporte detallado cuando se complete el setup inicial",
    frequency: "monthly",
    enabled: false,
    lastGenerated: "2024-02-01T10:00:00Z",
    nextScheduled: "2024-03-01T10:00:00Z",
    recipients: ["founder@sur-realista.com", "stakeholders@sur-realista.com"],
    sections: ["setup-summary", "infrastructure", "next-phase", "lessons-learned"],
    format: "pdf"
  }
]

// Métricas realistas para Etapa 1
const weeklyMetrics: ReportMetrics = {
  period: "Semana del 5-11 Feb 2024 - Etapa 1 Setup",
  setup: {
    overallProgress: 78,
    trend: 15.2,
    criticalIssues: 1
  },
  development: {
    commitsCount: 28,
    componentsCreated: 31,
    testsWritten: 18,
    configsCompleted: 8
  },
  infrastructure: {
    servicesActive: 2,
    dbTablesCreated: 8,
    apisConfigured: 1
  },
  quality: {
    codeQuality: 85,
    setupCompletion: 78,
    documentationScore: 72
  }
}

export function AutomatedReportsSystem() {
  const [templates, setTemplates] = useState<ReportTemplate[]>(reportTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const toggleTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, enabled: !template.enabled }
        : template
    ))
  }

  const generateReport = async (templateId: string) => {
    setIsGenerating(templateId)
    // Simular generación de reporte
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(null)
    
    // Actualizar última generación
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, lastGenerated: new Date().toISOString() }
        : template
    ))
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-blue-100 text-blue-800"
      case "weekly":
        return "bg-green-100 text-green-800"
      case "monthly":
        return "bg-purple-100 text-purple-800"
      case "quarterly":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "html":
        return <Globe className="h-4 w-4 text-blue-500" />
      case "json":
        return <Code className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Reports Overview - Etapa 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reportes Setup</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              activos de {templates.length} configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generados Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              reporte de setup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Reporte</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16h</div>
            <p className="text-xs text-muted-foreground">
              Setup Diario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinatarios</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              miembros del equipo
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vista Previa
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getFrequencyColor(template.frequency)}>
                          {template.frequency}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getFormatIcon(template.format)}
                          <span className="text-xs text-muted-foreground uppercase">
                            {template.format}
                          </span>
                        </div>
                      </div>
                      <CardDescription className="text-base">
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={() => toggleTemplate(template.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReport(template.id)}
                        disabled={isGenerating === template.id}
                      >
                        {isGenerating === template.id ? (
                          <>
                            <Activity className="h-4 w-4 mr-2 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Última generación:</span>
                      <span className="ml-2 font-medium">
                        {new Date(template.lastGenerated).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Próxima programada:</span>
                      <span className="ml-2 font-medium">
                        {new Date(template.nextScheduled).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Destinatarios:</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.recipients.map((recipient, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Secciones incluidas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.sections.map((section, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {section.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Vista Previa - Reporte Semanal Etapa 1
              </CardTitle>
              <CardDescription>
                {weeklyMetrics.period}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {weeklyMetrics.setup.overallProgress}%
                  </div>
                  <p className="text-sm text-blue-700">Setup Progreso</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">
                      +{weeklyMetrics.setup.trend}%
                    </span>
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {weeklyMetrics.development.commitsCount}
                  </div>
                  <p className="text-sm text-green-700">Commits</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {weeklyMetrics.development.componentsCreated} componentes
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {weeklyMetrics.infrastructure.servicesActive}/5
                  </div>
                  <p className="text-sm text-purple-700">Servicios Activos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {weeklyMetrics.infrastructure.dbTablesCreated}/12 tablas DB
                  </p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {weeklyMetrics.development.testsWritten}
                  </div>
                  <p className="text-sm text-orange-700">Tests Escritos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cobertura básica
                  </p>
                </div>
              </div>

              {/* Key Achievements */}
              <div>
                <h3 className="text-lg font-medium mb-3">Logros de la Semana</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Conexión Supabase establecida y funcionando</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Deploy inicial exitoso en Vercel</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{weeklyMetrics.development.componentsCreated} componentes base creados</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">8 de 12 tablas de base de datos creadas</span>
                  </div>
                </div>
              </div>

              {/* Critical Issues */}
              <div>
                <h3 className="text-lg font-medium mb-3">Pendientes Críticos</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Variables de entorno faltantes (4 APIs pendientes)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Google Drive API sin configurar</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">4 tablas de base de datos pendientes</span>
                  </div>
                </div>
              </div>

              {/* Setup Progress */}
              <div>
                <h3 className="text-lg font-medium mb-3">Progreso de Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Configuración General</span>
                      <span className="font-medium">{weeklyMetrics.quality.setupCompletion}%</span>
                    </div>
                    <Progress value={weeklyMetrics.quality.setupCompletion} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Base de Datos</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>APIs y Servicios</span>
                      <span className="font-medium">40%</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Next Week Priorities */}
              <div>
                <h3 className="text-lg font-medium mb-3">Prioridades Próxima Semana</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Configurar Google Drive API para importación de datos</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Completar las 4 tablas restantes de base de datos</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Configurar variables de entorno para APIs externas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Implementar sistema básico de importación de datos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reportes de Setup</CardTitle>
              <CardDescription>
                Registro de reportes generados durante la Etapa 1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Reporte Diario de Setup", date: "2024-02-08T08:00:00Z", size: "156 KB", recipients: 2 },
                  { name: "Reporte Semanal de Hitos", date: "2024-02-05T09:00:00Z", size: "890 KB", recipients: 2 },
                  { name: "Reporte Diario de Setup", date: "2024-02-07T08:00:00Z", size: "142 KB", recipients: 2 },
                  { name: "Reporte Diario de Setup", date: "2024-02-06T08:00:00Z", size: "138 KB", recipients: 2 },
                  { name: "Reporte Inicial de Proyecto", date: "2024-02-01T10:00:00Z", size: "1.2 MB", recipients: 3 },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(report.date).toLocaleString('es-ES')} • {report.size} • {report.recipients} destinatarios
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
