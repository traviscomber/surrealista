"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bot, Settings, RefreshCw, Pause, AlertCircle, CheckCircle, Clock, BarChart } from "lucide-react"

// Datos de ejemplo para agentes de IA
const agents = [
  {
    id: 1,
    name: "PropertyAnalyst-GPT",
    description:
      "Analiza propiedades y genera informes detallados sobre características, valoración y potencial de mercado.",
    status: "active",
    type: "analysis",
    lastRun: "2024-02-15T14:30:00",
    performance: 92,
    tasks: 145,
    usage: 78,
  },
  {
    id: 2,
    name: "MarketTrend-AI",
    description: "Monitorea y analiza tendencias del mercado inmobiliario, generando informes periódicos y alertas.",
    status: "active",
    type: "monitoring",
    lastRun: "2024-02-16T09:15:00",
    performance: 88,
    tasks: 98,
    usage: 65,
  },
  {
    id: 3,
    name: "ClientMatch-Bot",
    description: "Empareja clientes potenciales con propiedades basándose en preferencias y comportamiento.",
    status: "paused",
    type: "matching",
    lastRun: "2024-02-10T16:45:00",
    performance: 85,
    tasks: 210,
    usage: 45,
  },
  {
    id: 4,
    name: "ContentCreator-AI",
    description: "Genera descripciones, títulos y contenido promocional para propiedades.",
    status: "active",
    type: "content",
    lastRun: "2024-02-16T11:20:00",
    performance: 90,
    tasks: 320,
    usage: 82,
  },
  {
    id: 5,
    name: "PricePredictor-GPT",
    description: "Predice precios futuros de propiedades basándose en datos históricos y tendencias de mercado.",
    status: "maintenance",
    type: "prediction",
    lastRun: "2024-02-05T10:30:00",
    performance: 79,
    tasks: 87,
    usage: 30,
  },
]

export function AIAgentManagement() {
  const [selectedTab, setSelectedTab] = useState("all")

  const filteredAgents =
    selectedTab === "all"
      ? agents
      : agents.filter((agent) => {
          if (selectedTab === "active") return agent.status === "active"
          if (selectedTab === "paused") return agent.status === "paused"
          if (selectedTab === "maintenance") return agent.status === "maintenance"
          return agent.type === selectedTab
        })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "paused":
        return <Pause className="h-4 w-4 text-amber-500" />
      case "maintenance":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "paused":
        return "Pausado"
      case "maintenance":
        return "En mantenimiento"
      default:
        return "Desconocido"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Agentes IA</h2>
          <p className="text-gray-500">Administra y monitorea los agentes de IA que trabajan en tu plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <Bot className="h-4 w-4 mr-2" />
            Nuevo Agente
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
          <TabsTrigger value="matching">Matching</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="prediction">Predicción</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className={`border-l-4 ${
                agent.status === "active"
                  ? "border-l-green-500"
                  : agent.status === "paused"
                    ? "border-l-amber-500"
                    : "border-l-red-500"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{agent.description}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      agent.status === "active" ? "default" : agent.status === "paused" ? "outline" : "destructive"
                    }
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(agent.status)}
                    {getStatusText(agent.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rendimiento</p>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.performance} className="h-2" />
                      <span className="text-sm font-medium">{agent.performance}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tareas</p>
                    <p className="text-sm font-medium">{agent.tasks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Uso</p>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.usage} className="h-2" />
                      <span className="text-sm font-medium">{agent.usage}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Última ejecución: {new Date(agent.lastRun).toLocaleString("es-ES")}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch id={`agent-${agent.id}`} checked={agent.status === "active"} />
                  <Label htmlFor={`agent-${agent.id}`}>{agent.status === "active" ? "Activo" : "Inactivo"}</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <BarChart className="h-4 w-4 mr-2" />
                    Estadísticas
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No se encontraron agentes</h3>
            <p className="text-gray-500">No hay agentes que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </Tabs>
    </div>
  )
}
