"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Clock, CheckCircle, AlertTriangle, Inbox } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type StatsType = {
  total: number
  unread: number
  pending: number
  inProgress: number
  resolved: number
  spam: number
}

export function MessagesStats() {
  const [stats, setStats] = useState<StatsType>({
    total: 0,
    unread: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    spam: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)

    // Obtener todos los mensajes
    const { data, error } = await supabase.from("messages").select("*")

    if (!error && data) {
      const statsData: StatsType = {
        total: data.length,
        unread: data.filter((msg) => !msg.read).length,
        pending: data.filter((msg) => msg.status === "pending").length,
        inProgress: data.filter((msg) => msg.status === "in_progress").length,
        resolved: data.filter((msg) => msg.status === "resolved").length,
        spam: data.filter((msg) => msg.status === "spam").length,
      }

      setStats(statsData)
    }

    setLoading(false)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
          <Inbox className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
          <p className="text-xs text-muted-foreground">Mensajes recibidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">No Leídos</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.unread}</div>
          <p className="text-xs text-muted-foreground">Mensajes sin leer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.pending}</div>
          <p className="text-xs text-muted-foreground">Requieren atención</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">En seguimiento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.resolved}</div>
          <p className="text-xs text-muted-foreground">Completados</p>
        </CardContent>
      </Card>
    </div>
  )
}
