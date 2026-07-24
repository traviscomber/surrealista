"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, Play, Pause, Settings, Trash2, TrendingUp, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Agent {
  id: string
  name: string
  role: string
  description: string
  capabilities: string[]
  model: string
  status: string
  success_rate: number
  parameters: any
  created_at: string
  updated_at: string
  last_run: string | null
}

export function AgentList({
  onSelectAgent,
  onCreateAgent,
  onInitialize,
}: {
  onSelectAgent: (agent: Agent) => void
  onCreateAgent: () => void
  onInitialize?: () => void
}) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const { toast } = useToast()
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
    )
  }, [])

  useEffect(() => {
    if (supabase) {
      loadAgents()
    }
  }, [supabase])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase.from("ai_agents").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error("[v0] Error loading agents:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const initializeAgents = async () => {
    setInitializing(true)
    try {
      const response = await fetch("/api/agents/initialize", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize agents")
      }

      toast({
        title: "Agentes inicializados",
        description: result.message || "Los agentes han sido creados exitosamente",
      })

      await loadAgents()
      onInitialize?.()
    } catch (error) {
      console.error("[v0] Error initializing agents:", error)
      toast({
        title: "Error",
        description: "No se pudieron inicializar los agentes",
        variant: "destructive",
      })
    } finally {
      setInitializing(false)
    }
  }

  const toggleAgentStatus = async (agent: Agent) => {
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

      loadAgents()
    } catch (error) {
      console.error("[v0] Error updating agent:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el agente",
        variant: "destructive",
      })
    }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este agente?")) return

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId)

      if (error) throw error

      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado exitosamente",
      })

      loadAgents()
    } catch (error) {
      console.error("[v0] Error deleting agent:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el agente",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-gray-500"
      case "training":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando agentes...</div>
  }

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
            <p className="text-gray-500 mb-4">No hay agentes configurados. Crea tu primer agente para comenzar.</p>
            <Button onClick={initializeAgents} disabled={initializing} className="bg-green-600 hover:bg-green-700">
              <Zap className="h-4 w-4 mr-2" />
              {initializing ? "Inicializando..." : "Inicializar Agentes por Defecto"}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Esto creará los 4 agentes principales: Folder, Document, Extraction y Validation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <span className="text-gray-600">éxito</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {agent.capabilities?.slice(0, 3).map((cap, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {agent.capabilities?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => onSelectAgent(agent)} className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleAgentStatus(agent)}>
                    {agent.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAgent(agent.id)}
                    className="text-red-600 hover:text-red-700"
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
