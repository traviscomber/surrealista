"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { TrendingUp, Clock, CheckCircle } from "lucide-react"

export function AgentPerformance() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    avgSuccessRate: 0,
    totalExecutions: 0,
  })
  const [loading, setLoading] = useState(true)
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
      loadStats()
    }
  }, [supabase])

  const loadStats = async () => {
    try {
      const { data: agents, error } = await supabase.from("ai_agents").select("status, success_rate")

      if (error) throw error

      const totalAgents = agents?.length || 0
      const activeAgents = agents?.filter((a) => a.status === "active").length || 0
      const avgSuccessRate = agents?.reduce((acc, a) => acc + (a.success_rate || 0), 0) / totalAgents || 0

      setStats({
        totalAgents,
        activeAgents,
        avgSuccessRate,
        totalExecutions: 0, // TODO: Get from ai_workflow_steps or execution logs
      })
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Cargando estadísticas...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Total Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAgents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Agentes Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
            Tasa de Éxito Promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{Math.round(stats.avgSuccessRate * 100)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2 text-orange-600" />
            Ejecuciones Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.totalExecutions}</div>
        </CardContent>
      </Card>
    </div>
  )
}
