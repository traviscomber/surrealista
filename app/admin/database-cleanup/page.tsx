"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Trash2, Database, CheckCircle2 } from "lucide-react"
import { cleanupDatabase } from "@/app/actions/database-cleanup"

interface TableGroup {
  name: string
  description: string
  tables: string[]
  color: string
  dangerLevel: "low" | "medium" | "high"
}

const tableGroups: TableGroup[] = [
  {
    name: "Datos de Testing",
    description: "Agentes de prueba, interacciones de test, sesiones de estudio",
    tables: ["agent_interactions", "study_sessions", "study_progress"],
    color: "text-green-600",
    dangerLevel: "low",
  },
  {
    name: "Notificaciones y Mensajes",
    description: "Notificaciones internas, mensajes leídos, logs de comunicación",
    tables: ["internal_notifications", "notifications", "task_notifications", "messages", "message_replies"],
    color: "text-yellow-600",
    dangerLevel: "medium",
  },
  {
    name: "Analytics y Logs",
    description: "Métricas, vistas de propiedades, logs de extracción",
    tables: ["analytics", "property_views", "coordinate_extraction_log", "ai_events"],
    color: "text-blue-600",
    dangerLevel: "low",
  },
  {
    name: "Datos IA Temporales",
    description: "Análisis, visualizaciones, insights generados",
    tables: ["ai_analyses", "ai_insights", "ai_visualizations", "ai_events"],
    color: "text-purple-600",
    dangerLevel: "low",
  },
  {
    name: "Propiedades Externas",
    description: "Propiedades scrapeadas de fuentes externas",
    tables: ["properties_external"],
    color: "text-orange-600",
    dangerLevel: "medium",
  },
  {
    name: "Datos SII Temporales",
    description: "Extracciones del SII que se pueden re-obtener",
    tables: ["sii_coordinate_extractions"],
    color: "text-indigo-600",
    dangerLevel: "low",
  },
  {
    name: "⚠️ CRÍTICO - Clientes y Comunicaciones",
    description: "ATENCIÓN: Datos de clientes reales, comunicaciones, relaciones",
    tables: ["clients", "client_communications", "client_property_relationships", "tasks", "task_assignments"],
    color: "text-red-600",
    dangerLevel: "high",
  },
  {
    name: "⚠️ CRÍTICO - Propiedades Principales",
    description: "ATENCIÓN: Base de datos principal de propiedades",
    tables: ["properties", "properties_enhanced", "property_images"],
    color: "text-red-600",
    dangerLevel: "high",
  },
]

export default function DatabaseCleanupPage() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    deletedCounts?: Record<string, number>
  } | null>(null)

  const toggleGroup = (groupName: string) => {
    setSelectedGroups((prev) => (prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]))
  }

  const handleCleanup = async () => {
    if (confirmText !== "CONFIRMAR LIMPIEZA") {
      alert('Por favor escribe "CONFIRMAR LIMPIEZA" para continuar')
      return
    }

    const selectedTables = tableGroups.filter((g) => selectedGroups.includes(g.name)).flatMap((g) => g.tables)

    if (selectedTables.length === 0) {
      alert("Selecciona al menos un grupo de tablas")
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await cleanupDatabase(selectedTables)
      setResult(response)
      if (response.success) {
        setSelectedGroups([])
        setConfirmText("")
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasHighDanger = tableGroups.filter((g) => selectedGroups.includes(g.name)).some((g) => g.dangerLevel === "high")

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Limpieza de Base de Datos
        </h1>
        <p className="text-muted-foreground">
          Elimina datos de forma segura y selectiva. Los datos eliminados no se pueden recuperar.
        </p>
      </div>

      {result && (
        <Alert className={result.success ? "mb-6 border-green-500" : "mb-6 border-red-500"}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <div className="font-semibold mb-2">{result.message}</div>
            {result.deletedCounts && (
              <div className="text-sm space-y-1">
                {Object.entries(result.deletedCounts).map(([table, count]) => (
                  <div key={table}>
                    • {table}: <strong>{count}</strong> registros eliminados
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 mb-6">
        {tableGroups.map((group) => (
          <Card
            key={group.name}
            className={`cursor-pointer transition-all ${
              selectedGroups.includes(group.name) ? "ring-2 ring-primary" : "hover:border-primary/50"
            } ${group.dangerLevel === "high" ? "border-red-300" : ""}`}
            onClick={() => toggleGroup(group.name)}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedGroups.includes(group.name)}
                  onCheckedChange={() => toggleGroup(group.name)}
                />
                <div className="flex-1">
                  <CardTitle className={`text-lg ${group.color}`}>{group.name}</CardTitle>
                  <CardDescription className="mt-1">{group.description}</CardDescription>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {group.tables.map((table) => (
                      <span key={table} className="text-xs bg-muted px-2 py-1 rounded">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedGroups.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Confirmación Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasHighDanger && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ADVERTENCIA:</strong> Has seleccionado tablas críticas con datos de clientes o propiedades
                  principales. Esta acción es IRREVERSIBLE.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="confirm">
                Escribe <strong>"CONFIRMAR LIMPIEZA"</strong> para continuar:
              </Label>
              <input
                id="confirm"
                type="text"
                className="w-full mt-2 px-3 py-2 border rounded-md"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR LIMPIEZA"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCleanup}
                disabled={isLoading || confirmText !== "CONFIRMAR LIMPIEZA"}
                variant={hasHighDanger ? "destructive" : "default"}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isLoading ? "Limpiando..." : `Limpiar ${selectedGroups.length} Grupos`}
              </Button>
              <Button
                onClick={() => {
                  setSelectedGroups([])
                  setConfirmText("")
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
