"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { Plus, Play, Pause, Settings, Trash2, TrendingUp, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface AgentRecord {
  id: string
  name: string
  role: string
  description: string
  capabilities: string[]
  model: string
  status: string
  success_rate: number
  parameters: Record<string, unknown>
  created_at: string
  updated_at: string
  last_run: string | null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function getString(row: Record<string, unknown>, key: string, fallback = ""): string {
  const value = row[key]
  return typeof value === "string" ? value : fallback
}

function getNullableString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" ? value : null
}

function getStringArray(row: Record<string, unknown>, key: string): string[] {
  const value = row[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function getNumber(row: Record<string, unknown>, key: string, fallback = 0): number {
  const value = row[key]
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeAgent(value: unknown): AgentRecord | null {
  const row = asRecord(value)
  const id = getString(row, "id")
  const name = getString(row, "name")
  const role = getString(row, "role")
  const model = getString(row, "model")
  if (!id || !name || !role || !model) return null

  return {
    id,
    name,
    role,
    description: getString(row, "description"),
    capabilities: getStringArray(row, "capabilities"),
    model,
    status: getString(row, "status", "inactive"),
    success_rate: getNumber(row, "success_rate"),
    parameters: asRecord(row.parameters),
    created_at: getString(row, "created_at"),
    updated_at: getString(row, "updated_at"),
    last_run: getNullableString(row, "last_run"),
  }
}

export function AgentList({
  onSelectAgent,
  onCreateAgent,
  onInitialize,
}: {
  onSelectAgent: (agent: AgentRecord) => void
  onCreateAgent: () => void
  onInitialize?: () => void
}) {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const { toast } = useToast()

  const loadAgents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("ai_agents").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setAgents((data || []).map(normalizeAgent).filter((agent): agent is AgentRecord => agent !== null))
    } catch (error) {
      console.error("[agents] Error loading agents:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAgents()
  }, [])

  const initializeAgents = async () => {
    setInitializing(true)
    try {
      const response = await fetch("/api/agents/initialize", { method: "POST" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "No se pudieron inicializar los agentes")

      toast({
        title: "Agentes inicializados",
        description: result.message || "Los agentes fueron creados",
      })
      await loadAgents()
      onInitialize?.()
    } catch (error) {
      console.error("[agents] Error initializing agents:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron inicializar los agentes",
        variant: "destructive",
      })
    } finally {
      setInitializing(false)
    }
  }

  const toggleAgentStatus = async (agent: AgentRecord) => {
    const newStatus = agent.status === "active" ? "inactive" : "active"
    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", agent.id)
      if (error) throw error

      toast({
        title: "Agente actualizado",
        description: `El agente ahora está ${newStatus === "active" ? "activo" : "inactivo"}`,
      })
      await loadAgents()
    } catch (error) {
      console.error("[agents] Error updating agent:", error)
      toast({ title: "Error", description: "No se pudo actualizar el agente", variant: "destructive" })
    }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este agente?")) return
    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)
      if (error) throw error

      toast({ title: "Agente eliminado", description: "El agente fue eliminado" })
      await loadAgents()
    } catch (error) {
      console.error("[agents] Error deleting agent:", error)
      toast({ title: "Error", description: "No se pudo eliminar el agente", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "training":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) return <div className="text-center py-8">Cargando agentes...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agentes IA ({agents.length})</h3>
        <Button onClick={onCreateAgent} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Agente
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-4">No hay agentes configurados.</p>
            <Button onClick={() => void initializeAgents()} disabled={initializing} className="bg-green-600 hover:bg-green-700">
              <Zap className="h-4 w-4 mr-2" />
              {initializing ? "Inicializando..." : "Inicializar agentes por defecto"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{agent.role}</p>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 line-clamp-2">{agent.description}</p>
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{Math.round((agent.success_rate || 0) * 100)}%</span>
                  <span className="text-gray-600">éxito registrado</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability, index) => (
                    <Badge key={`${capability}-${index}`} variant="outline" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{agent.capabilities.length - 3}</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => onSelectAgent(agent)} className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void toggleAgentStatus(agent)} aria-label="Cambiar estado">
                    {agent.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void deleteAgent(agent.id)}
                    className="text-red-600 hover:text-red-700"
                    aria-label="Eliminar agente"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
