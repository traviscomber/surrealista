"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BarChart3, Calendar, CheckCircle2, Clock, Target, TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

type Task = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string | null
  created_at: string
  created_by: string | null
  assigned_to: string | null
}

type WeeklySummary = {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  byPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  completionRate: number
  tasks: Task[]
}

type WeeklyTaskSummaryProps = {
  refreshTrigger?: number
}

function getWeekStart(date: Date) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = value.getDate() - day + (day === 0 ? -6 : 1)
  value.setDate(diff)
  value.setHours(0, 0, 0, 0)
  return value
}

function getWeekEnd(date: Date) {
  const end = getWeekStart(date)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function normalizeTask(value: unknown): Task | null {
  const row = asRecord(value)
  if (!row) return null

  const id = stringValue(row.id)
  const title = stringValue(row.title)
  if (!id || !title) return null

  return {
    id,
    title,
    description: stringValue(row.description),
    status: stringValue(row.status, "pending"),
    priority: stringValue(row.priority, "medium"),
    due_date: nullableString(row.due_date),
    created_at: stringValue(row.created_at),
    created_by: nullableString(row.created_by),
    assigned_to: nullableString(row.assigned_to),
  }
}

function percent(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0
}

export function WeeklyTaskSummary({ refreshTrigger }: WeeklyTaskSummaryProps) {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [weekEnd, setWeekEnd] = useState(() => getWeekEnd(new Date()))

  useEffect(() => {
    const loadWeeklySummary = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString())
          .order("created_at", { ascending: false })

        if (error) throw error

        const tasks = (data || []).map(normalizeTask).filter((task): task is Task => task !== null)
        const now = new Date()
        const completed = tasks.filter((task) => task.status === "completed").length
        const total = tasks.length

        setSummary({
          total,
          completed,
          inProgress: tasks.filter((task) => task.status === "in_progress").length,
          pending: tasks.filter((task) => task.status === "pending").length,
          overdue: tasks.filter(
            (task) => task.due_date && new Date(task.due_date) < now && task.status !== "completed",
          ).length,
          byPriority: {
            urgent: tasks.filter((task) => task.priority === "urgent").length,
            high: tasks.filter((task) => task.priority === "high").length,
            medium: tasks.filter((task) => task.priority === "medium").length,
            low: tasks.filter((task) => task.priority === "low").length,
          },
          completionRate: percent(completed, total),
          tasks,
        })
      } catch (error) {
        console.error("[v0] Error loading weekly summary:", error)
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    void loadWeeklySummary()
  }, [refreshTrigger, supabase, weekEnd, weekStart])

  const navigateWeek = (direction: "prev" | "next") => {
    const offset = direction === "prev" ? -7 : 7
    const nextStart = new Date(weekStart)
    const nextEnd = new Date(weekEnd)
    nextStart.setDate(nextStart.getDate() + offset)
    nextEnd.setDate(nextEnd.getDate() + offset)
    setWeekStart(nextStart)
    setWeekEnd(nextEnd)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!summary) {
    return <div className="py-12 text-center text-gray-500">No se pudo cargar el resumen semanal</div>
  }

  const priorities = [
    ["Urgente", summary.byPriority.urgent, "bg-red-500"],
    ["Alta", summary.byPriority.high, "bg-orange-500"],
    ["Media", summary.byPriority.medium, "bg-yellow-500"],
    ["Baja", summary.byPriority.low, "bg-green-500"],
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumen Ejecutivo Semanal</h2>
          <p className="mt-1 flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            {weekStart.toLocaleDateString("es-CL", { day: "numeric", month: "long" })} -{" "}
            {weekEnd.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2 transition-colors hover:bg-gray-50" onClick={() => navigateWeek("prev")}>← Semana Anterior</button>
          <button className="rounded-lg border px-4 py-2 transition-colors hover:bg-gray-50" onClick={() => navigateWeek("next")}>Semana Siguiente →</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Tareas", summary.total, <Target key="total" className="h-4 w-4 text-muted-foreground" />, "Esta semana"],
          ["Completadas", summary.completed, <CheckCircle2 key="done" className="h-4 w-4 text-green-600" />, `${summary.completionRate.toFixed(0)}% de tasa de completitud`],
          ["En Progreso", summary.inProgress, <Clock key="progress" className="h-4 w-4 text-blue-600" />, "Tareas activas"],
          ["Vencidas", summary.overdue, <AlertCircle key="overdue" className="h-4 w-4 text-red-600" />, "Requieren atención"],
        ].map(([label, value, icon, caption]) => (
          <Card key={String(label)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              {icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{caption}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Distribución por Prioridad</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {priorities.map(([label, value, barClass]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{value}</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full ${barClass}`} style={{ width: `${percent(value, summary.total)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Estado de Tareas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Completadas", summary.completed, "bg-green-100 text-green-700"],
              ["En Progreso", summary.inProgress, "bg-blue-100 text-blue-700"],
              ["Pendientes", summary.pending, "bg-gray-100 text-gray-700"],
            ].map(([label, value, className]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{value}</span>
                  <Badge className={String(className)}>{percent(Number(value), summary.total).toFixed(0)}%</Badge>
                </div>
              </div>
            ))}
            {summary.overdue > 0 ? (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium text-red-600">Vencidas</span>
                <Badge className="bg-red-100 text-red-700">{summary.overdue} · Atención</Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Tareas de la Semana ({summary.tasks.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {summary.tasks.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No hay tareas para esta semana</p>
            ) : summary.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-3 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.description ? <p className="mt-1 line-clamp-1 text-sm text-gray-600">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={task.status === "completed" ? "bg-green-50 text-green-700" : task.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}>
                        {task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Pendiente"}
                      </Badge>
                      <Badge className={task.priority === "urgent" || task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}>
                        {task.priority === "urgent" ? "Urgente" : task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                      </Badge>
                      {task.due_date ? <span className="text-xs text-gray-500">Vence: {new Date(task.due_date).toLocaleDateString("es-CL")}</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
