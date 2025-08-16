"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  TrendingUp,
  Shield,
  Database,
  Globe,
  Code,
  Activity,
  Mail,
  Slack,
} from "lucide-react"

interface AlertItem {
  id: string
  type: "critical" | "warning" | "info" | "success"
  category: "setup" | "config" | "database" | "deployment" | "apis" | "development"
  title: string
  description: string
  timestamp: string
  resolved: boolean
  assignee?: string
  priority: "high" | "medium" | "low"
  actions?: {
    label: string
    action: string
  }[]
  metrics?: {
    current: number
    threshold: number
    unit: string
  }
}

interface NotificationSettings {
  email: boolean
  slack: boolean
  inApp: boolean
  categories: {
    setup: boolean
    config: boolean
    database: boolean
    deployment: boolean
    apis: boolean
    development: boolean
  }
  thresholds: {
    setupProgress: number
    dbConnections: number
    deploymentTime: number
    testCoverage: number
  }
}

// Alertas realistas para Etapa 1 - Setup inicial
const mockAlerts: AlertItem[] = [
  {
    id: "alert-001",
    type: "warning",
    category: "apis",
    title: "Google Drive API No Configurada",
    description:
      "La API de Google Drive necesita ser configurada para la funcionalidad de importación de datos de la Etapa 1.",
    timestamp: new Date().toISOString(),
    resolved: false,
    assignee: "Equipo Backend",
    priority: "high",
    actions: [
      { label: "Configurar API", action: "setup-gdrive-api" },
      { label: "Ver Documentación", action: "view-docs" },
      { label: "Crear Credenciales", action: "create-credentials" },
    ],
  },
  {
    id: "alert-002",
    type: "warning",
    category: "database",
    title: "Tablas de Base de Datos Incompletas",
    description: "Faltan 4 tablas por crear en la base de datos. Necesarias para completar el setup de la Etapa 1.",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    resolved: false,
    assignee: "Equipo Backend",
    priority: "medium",
    actions: [
      { label: "Ejecutar Scripts", action: "run-db-scripts" },
      { label: "Verificar Schema", action: "verify-schema" },
      { label: "Ver Progreso", action: "check-progress" },
    ],
    metrics: {
      current: 8,
      threshold: 12,
      unit: "tablas",
    },
  },
  {
    id: "alert-003",
    type: "info",
    category: "setup",
    title: "Progreso Setup al 78%",
    description:
      "El setup inicial va bien encaminado. Quedan algunas configuraciones de APIs y finalizar la estructura de datos.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved: false,
    assignee: "Todo el equipo",
    priority: "low",
    metrics: {
      current: 78,
      threshold: 100,
      unit: "%",
    },
  },
  {
    id: "alert-004",
    type: "critical",
    category: "config",
    title: "Variables de Entorno Faltantes",
    description:
      "Faltan 4 variables de entorno críticas: OPENAI_API_KEY, GOOGLE_DRIVE_CLIENT_ID, SII_API_KEY, BANCO_CENTRAL_API_KEY.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolved: false,
    assignee: "DevOps",
    priority: "high",
    actions: [
      { label: "Configurar Variables", action: "setup-env-vars" },
      { label: "Verificar Deploy", action: "check-deployment" },
      { label: "Documentar Setup", action: "document-setup" },
    ],
  },
  {
    id: "alert-005",
    type: "success",
    category: "deployment",
    title: "Deploy Inicial Exitoso",
    description: "La aplicación base se desplegó correctamente en Vercel. Frontend básico funcionando.",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    priority: "low",
  },
  {
    id: "alert-006",
    type: "success",
    category: "database",
    title: "Conexión Supabase Establecida",
    description: "La conexión con Supabase está funcionando correctamente. Base de datos lista para desarrollo.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolved: true,
    priority: "low",
  },
]

const getAlertIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <XCircle className="h-5 w-5 text-red-500" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "info":
      return <Clock className="h-5 w-5 text-blue-500" />
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    default:
      return <Bell className="h-5 w-5 text-gray-500" />
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "setup":
      return <Zap className="h-4 w-4" />
    case "config":
      return <Shield className="h-4 w-4" />
    case "database":
      return <Database className="h-4 w-4" />
    case "deployment":
      return <Activity className="h-4 w-4" />
    case "apis":
      return <Globe className="h-4 w-4" />
    case "development":
      return <Code className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getAlertColor = (type: string) => {
  switch (type) {
    case "critical":
      return "border-red-200 bg-red-50"
    case "warning":
      return "border-yellow-200 bg-yellow-50"
    case "info":
      return "border-blue-200 bg-blue-50"
    case "success":
      return "border-green-200 bg-green-50"
    default:
      return "border-gray-200 bg-gray-50"
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

export function AlertsNotificationsSystem() {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showResolved, setShowResolved] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    slack: false,
    inApp: true,
    categories: {
      setup: true,
      config: true,
      database: true,
      deployment: true,
      apis: true,
      development: true,
    },
    thresholds: {
      setupProgress: 80,
      dbConnections: 10,
      deploymentTime: 300,
      testCoverage: 70,
    },
  })

  const filteredAlerts = alerts.filter((alert) => {
    if (!showResolved && alert.resolved) return false
    if (selectedCategory !== "all" && alert.category !== selectedCategory) return false
    return true
  })

  const criticalAlerts = alerts.filter((alert) => alert.type === "critical" && !alert.resolved)
  const warningAlerts = alerts.filter((alert) => alert.type === "warning" && !alert.resolved)
  const unresolvedCount = alerts.filter((alert) => !alert.resolved).length

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert)))
  }

  const handleActionClick = (action: string, alertId: string) => {
    console.log(`Executing action: ${action} for alert: ${alertId}`)
    // Aquí iría la lógica para ejecutar las acciones específicas
  }

  const updateNotificationSettings = (key: string, value: any) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary - Etapa 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Configuraciones pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Setup en progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Resolver</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unresolvedCount}</div>
            <p className="text-xs text-muted-foreground">Total pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setup Progreso</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">78%</div>
            <p className="text-xs text-muted-foreground">Configuración inicial</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas Activas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros y Controles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Categoría:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">Todas</option>
                    <option value="setup">Setup</option>
                    <option value="config">Configuración</option>
                    <option value="database">Base de Datos</option>
                    <option value="deployment">Deployment</option>
                    <option value="apis">APIs</option>
                    <option value="development">Desarrollo</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={showResolved} onCheckedChange={setShowResolved} />
                  <label className="text-sm font-medium">Mostrar resueltas</label>
                </div>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">¡Setup en buen camino!</h3>
                  <p className="text-gray-600">No hay alertas activas que coincidan con los filtros seleccionados.</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`${getAlertColor(alert.type)} border-l-4`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getCategoryIcon(alert.category)}
                              {alert.category}
                            </Badge>
                          </div>
                          <CardDescription className="text-base">{alert.description}</CardDescription>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="ml-4"
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(alert.timestamp).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {alert.assignee && (
                        <span>
                          Asignado a: <strong>{alert.assignee}</strong>
                        </span>
                      )}
                    </div>

                    {alert.metrics && (
                      <div className="p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span>Valor Actual:</span>
                          <span className="font-bold text-blue-600">
                            {alert.metrics.current} {alert.metrics.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span>Objetivo:</span>
                          <span className="font-medium">
                            {alert.metrics.threshold} {alert.metrics.unit}
                          </span>
                        </div>
                      </div>
                    )}

                    {alert.actions && alert.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {alert.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(action.action, alert.id)}
                            className="text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Personaliza cómo y cuándo recibir alertas del setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h4 className="text-sm font-medium mb-3">Canales de Notificación</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => updateNotificationSettings("email", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Slack className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Slack</span>
                    </div>
                    <Switch
                      checked={notificationSettings.slack}
                      onCheckedChange={(checked) => updateNotificationSettings("slack", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-500" />
                      <span className="text-sm">In-App</span>
                    </div>
                    <Switch
                      checked={notificationSettings.inApp}
                      onCheckedChange={(checked) => updateNotificationSettings("inApp", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium mb-3">Categorías de Alertas</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(notificationSettings.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm capitalize">{category}</span>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateNotificationSettings("categories", {
                            ...notificationSettings.categories,
                            [category]: checked,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Thresholds */}
              <div>
                <h4 className="text-sm font-medium mb-3">Umbrales de Alerta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Progreso Setup Mínimo (%)</label>
                    <input
                      type="number"
                      value={notificationSettings.thresholds.setupProgress}
                      onChange={(e) =>
                        updateNotificationSettings("thresholds", {
                          ...notificationSettings.thresholds,
                          setupProgress: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Conexiones DB Máximas</label>
                    <input
                      type="number"
                      value={notificationSettings.thresholds.dbConnections}
                      onChange={(e) =>
                        updateNotificationSettings("thresholds", {
                          ...notificationSettings.thresholds,
                          dbConnections: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Tiempo Deploy Máximo (s)</label>
                    <input
                      type="number"
                      value={notificationSettings.thresholds.deploymentTime}
                      onChange={(e) =>
                        updateNotificationSettings("thresholds", {
                          ...notificationSettings.thresholds,
                          deploymentTime: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cobertura Tests Mínima (%)</label>
                    <input
                      type="number"
                      value={notificationSettings.thresholds.testCoverage}
                      onChange={(e) =>
                        updateNotificationSettings("thresholds", {
                          ...notificationSettings.thresholds,
                          testCoverage: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar Configuración</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Alertas</CardTitle>
              <CardDescription>Registro de alertas resueltas durante el setup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts
                  .filter((alert) => alert.resolved)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleDateString("es-ES")}
                      </div>
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
