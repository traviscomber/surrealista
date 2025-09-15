"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Database, Globe, Shield, Zap, CheckCircle, AlertCircle, Settings, RefreshCw, ExternalLink } from "lucide-react"

export function IntegrationsManagement() {
  const integrations = [
    {
      id: "supabase",
      name: "Supabase",
      description: "Base de datos principal y autenticación",
      status: "connected",
      icon: Database,
      color: "bg-green-500",
      lastSync: "Hace 5 minutos",
      enabled: true,
    },
    {
      id: "sii",
      name: "SII Chile",
      description: "Servicio de Impuestos Internos",
      status: "connected",
      icon: Shield,
      color: "bg-blue-500",
      lastSync: "Hace 1 hora",
      enabled: true,
    },
    {
      id: "sirene",
      name: "SIRENE Francia",
      description: "Sistema de identificación empresarial",
      status: "connected",
      icon: Globe,
      color: "bg-purple-500",
      lastSync: "Hace 2 horas",
      enabled: true,
    },
    {
      id: "ciren",
      name: "CIREN",
      description: "Centro de Información de Recursos Naturales",
      status: "warning",
      icon: Zap,
      color: "bg-orange-500",
      lastSync: "Hace 6 horas",
      enabled: false,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>
      case "warning":
        return <Badge className="bg-orange-100 text-orange-800">Advertencia</Badge>
      default:
        return <Badge className="bg-red-100 text-red-800">Desconectado</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Integraciones</h1>
          <p className="text-gray-600 mt-2">Administra las conexiones con servicios externos</p>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sincronizar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${integration.color} text-white`}>
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado:</span>
                {getStatusBadge(integration.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última sincronización:</span>
                <span className="text-sm font-medium">{integration.lastSync}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Habilitado:</span>
                <Switch checked={integration.enabled} />
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración Global</CardTitle>
          <CardDescription>Ajustes generales para todas las integraciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sincronización automática</h4>
              <p className="text-sm text-gray-600">Sincronizar datos cada 30 minutos</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notificaciones de errores</h4>
              <p className="text-sm text-gray-600">Recibir alertas cuando falle una integración</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Logs detallados</h4>
              <p className="text-sm text-gray-600">Guardar información detallada de sincronización</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
