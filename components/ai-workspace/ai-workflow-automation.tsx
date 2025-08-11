"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Workflow,
  Clock,
  Play,
  Pause,
  Settings,
  Copy,
  Plus,
  ArrowRight,
  Calendar,
  Bell,
  Bot,
  FileText,
  Search,
  Database,
} from "lucide-react"

// Datos de ejemplo para flujos de trabajo
const workflows = [
  {
    id: 1,
    name: "Análisis Diario de Mercado",
    description: "Analiza diariamente las tendencias del mercado y genera un informe automático",
    status: "active",
    schedule: "Diario - 06:00",
    lastRun: "2024-02-16T06:00:00",
    nextRun: "2024-02-17T06:00:00",
    steps: [
      { id: 1, type: "data", name: "Recopilar datos de mercado", status: "success" },
      { id: 2, type: "ai", name: "Analizar tendencias", status: "success" },
      { id: 3, type: "document", name: "Generar informe", status: "success" },
      { id: 4, type: "notification", name: "Enviar notificación", status: "success" },
    ],
  },
  {
    id: 2,
    name: "Actualización de Valoraciones",
    description: "Actualiza semanalmente las valoraciones de propiedades basándose en datos de mercado",
    status: "active",
    schedule: "Semanal - Lunes 08:00",
    lastRun: "2024-02-12T08:00:00",
    nextRun: "2024-02-19T08:00:00",
    steps: [
      { id: 1, type: "data", name: "Recopilar datos de propiedades", status: "success" },
      { id: 2, type: "ai", name: "Calcular nuevas valoraciones", status: "success" },
      { id: 3, type: "database", name: "Actualizar base de datos", status: "success" },
      { id: 4, type: "document", name: "Generar informe de cambios", status: "success" },
    ],
  },
  {
    id: 3,
    name: "Seguimiento de Clientes Potenciales",
    description: "Monitorea interacciones de clientes potenciales y genera recomendaciones personalizadas",
    status: "paused",
    schedule: "Diario - 12:00",
    lastRun: "2024-02-10T12:00:00",
    nextRun: null,
    steps: [
      { id: 1, type: "data", name: "Analizar comportamiento de usuarios", status: "pending" },
      { id: 2, type: "ai", name: "Generar recomendaciones", status: "pending" },
      { id: 3, type: "notification", name: "Enviar correos personalizados", status: "pending" },
    ],
  },
  {
    id: 4,
    name: "Optimización de Listados",
    description: "Analiza y optimiza automáticamente los listados de propiedades para mejorar su visibilidad",
    status: "active",
    schedule: "Semanal - Miércoles 10:00",
    lastRun: "2024-02-14T10:00:00",
    nextRun: "2024-02-21T10:00:00",
    steps: [
      { id: 1, type: "data", name: "Analizar rendimiento de listados", status: "success" },
      { id: 2, type: "ai", name: "Generar recomendaciones de mejora", status: "success" },
      { id: 3, type: "document", name: "Crear informe de optimización", status: "success" },
      { id: 4, type: "notification", name: "Notificar a agentes", status: "success" },
    ],
  },
]

export function AIWorkflowAutomation() {
  const [selectedTab, setSelectedTab] = useState("active")

  const filteredWorkflows =
    selectedTab === "all"
      ? workflows
      : workflows.filter((workflow) => {
          if (selectedTab === "active") return workflow.status === "active"
          if (selectedTab === "paused") return workflow.status === "paused"
          return true
        })

  const getStepIcon = (type: string) => {
    switch (type) {
      case "data":
        return <Search className="h-4 w-4" />
      case "ai":
        return <Bot className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "notification":
        return <Bell className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automatización de Flujos de Trabajo</h2>
          <p className="text-gray-500">Crea y gestiona flujos de trabajo automatizados con IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Historial
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Flujo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="paused">Pausados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className={`border-l-4 ${workflow.status === "active" ? "border-l-green-500" : "border-l-amber-500"}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-5 w-5" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{workflow.description}</CardDescription>
                  </div>
                  <Badge variant={workflow.status === "active" ? "default" : "outline"}>
                    {workflow.status === "active" ? "Activo" : "Pausado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Programación: {workflow.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {workflow.status === "active"
                        ? `Próxima ejecución: ${new Date(workflow.nextRun!).toLocaleString("es-ES")}`
                        : `Última ejecución: ${new Date(workflow.lastRun).toLocaleString("es-ES")}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      {index > 0 && <ArrowRight className="h-4 w-4 mx-1 text-gray-300" />}
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                          step.status === "success" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStepIcon(step.type)}
                        <span>{step.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch id={`workflow-${workflow.id}`} checked={workflow.status === "active"} />
                  <Label htmlFor={`workflow-${workflow.id}`}>
                    {workflow.status === "active" ? "Activo" : "Inactivo"}
                  </Label>
                </div>
                <div className="flex gap-2">
                  {workflow.status === "active" ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Activar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <Workflow className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No se encontraron flujos de trabajo</h3>
            <p className="text-gray-500">No hay flujos de trabajo que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Flujo de Trabajo</CardTitle>
          <CardDescription>Configura un nuevo flujo de trabajo automatizado con IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Nombre del Flujo</Label>
              <Input id="workflow-name" placeholder="Ej: Análisis Semanal de Propiedades" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow-schedule">Programación</Label>
              <Select>
                <SelectTrigger id="workflow-schedule">
                  <SelectValue placeholder="Selecciona una programación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">Descripción</Label>
            <Input id="workflow-description" placeholder="Describe el propósito del flujo de trabajo" />
          </div>

          <div className="space-y-2">
            <Label>Pasos del Flujo de Trabajo</Label>
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500 py-8">
                  Selecciona los pasos para tu flujo de trabajo desde el panel de la derecha
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar Flujo de Trabajo</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
