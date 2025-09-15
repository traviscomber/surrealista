"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Settings, Database, Cloud, Key, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"

const IntegrationCard = ({ name, description, status, icon: Icon, onToggle, settings }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      case "warning":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1 capitalize">{status}</span>
            </Badge>
            <Switch checked={status === "connected"} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {settings.map((setting, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{setting.label}:</span>
              <span className="font-medium">{setting.value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
            <Settings className="h-3 w-3" />
            Configurar
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <ExternalLink className="h-3 w-3" />
            Documentación
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function IntegrationsManagement() {
  const [integrations, setIntegrations] = useState([
    {
      id: "supabase",
      name: "Supabase",
      description: "Base de datos y autenticación",
      status: "connected",
      icon: Database,
      settings: [
        { label: "URL", value: "https://*****.supabase.co" },
        { label: "Estado", value: "Conectado" },
        { label: "Última sincronización", value: "Hace 5 minutos" },
      ],
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Almacenamiento de documentos",
      status: "connected",
      icon: Cloud,
      settings: [
        { label: "Cuenta", value: "admin@sur-realista.com" },
        { label: "Espacio usado", value: "2.4 GB / 15 GB" },
        { label: "Última sincronización", value: "Hace 1 hora" },
      ],
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "Inteligencia artificial y procesamiento",
      status: "connected",
      icon: Key,
      settings: [
        { label: "Modelo", value: "GPT-4" },
        { label: "Uso mensual", value: "1,245 tokens" },
        { label: "Estado API", value: "Activa" },
      ],
    },
    {
      id: "maps",
      name: "Google Maps",
      description: "Servicios de mapas y geolocalización",
      status: "warning",
      icon: Settings,
      settings: [
        { label: "API Key", value: "Configurada" },
        { label: "Cuota mensual", value: "85% utilizada" },
        { label: "Estado", value: "Límite próximo" },
      ],
    },
  ])

  const handleToggleIntegration = (id) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: integration.status === "connected" ? "disconnected" : "connected",
            }
          : integration,
      ),
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Integraciones</h1>
        <p className="text-gray-600">Administra las conexiones con servicios externos y APIs de terceros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            description={integration.description}
            status={integration.status}
            icon={integration.icon}
            settings={integration.settings}
            onToggle={() => handleToggleIntegration(integration.id)}
          />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Estado General del Sistema</CardTitle>
          <CardDescription>Resumen del estado de todas las integraciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-green-700">Conectadas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-yellow-700">Con advertencias</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-red-700">Desconectadas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
