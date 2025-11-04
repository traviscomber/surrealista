"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp, Users, Target, BarChart3 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  created_at: string
  created_by: string
  assigned_to: string
}

interface WeeklySummary {
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

export function WeeklyTaskSummary() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [weekEnd, setWeekEnd] = useState<Date>(getWeekEnd(new Date()))

  const supabase = createBrowserClient()

  useEffect(() => {
    loadWeeklySummary()
  }, [weekStart, weekEnd])

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return end
  }

  const loadWeeklySummary = async () => {
    setLoading(true)
    try {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error

      const now = new Date()
      const tasksData = tasks || []

      const summary: WeeklySummary = {
        total: tasksData.length,
        completed: tasksData.filter((t) => t.status === "completed").length,
        inProgress: tasksData.filter((t) => t.status === "in_progress").length,
        pending: tasksData.filter((t) => t.status === "pending").length,
        overdue: tasksData.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "completed").length,
        byPriority: {
          urgent: tasksData.filter((t) => t.priority === "urgent").length,
          high: tasksData.filter((t) => t.priority === "high").length,
          medium: tasksData.filter((t) => t.priority === "medium").length,
          low: tasksData.filter((t) => t.priority === "low").length,
        },
        completionRate:
          tasksData.length > 0
            ? (tasksData.filter((t) => t.status === "completed").length / tasksData.length) * 100
            : 0,
        tasks: tasksData,
      }

      setSummary(summary)
    } catch (error) {
      console.error("[v0] Error loading weekly summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newStart = new Date(weekStart)
    const newEnd = new Date(weekEnd)

    if (direction === "prev") {
      newStart.setDate(newStart.getDate() - 7)
      newEnd.setDate(newEnd.getDate() - 7)
    } else {
      newStart.setDate(newStart.getDate() + 7)
      newEnd.setDate(newEnd.getDate() + 7)
    }

    setWeekStart(newStart)
    setWeekEnd(newEnd)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar el resumen semanal</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resumen Ejecutivo Semanal</h2>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {weekStart.toLocaleDateString("es-CL", { day: "numeric", month: "long" })} -{" "}
            {weekEnd.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigateWeek("prev")}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Semana Anterior
          </button>
          <button
            onClick={() => navigateWeek("next")}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Semana Siguiente →
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
            <p className="text-xs text-muted-foreground">{summary.completionRate.toFixed(0)}% de tasa de completitud</p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
            <p className="text-xs text-muted-foreground">Tareas activas</p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown and Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución por Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Urgente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.byPriority.urgent}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(summary.byPriority.urgent / summary.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <span className="text-sm font-medium">Alta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.byPriority.high}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${(summary.byPriority.high / summary.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium">Media</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.byPriority.medium}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(summary.byPriority.medium / summary.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Baja</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.byPriority.low}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(summary.byPriority.low / summary.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estado de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.completed}</span>
                <Badge className="bg-green-100 text-green-700">
                  {summary.total > 0 ? ((summary.completed / summary.total) * 100).toFixed(0) : 0}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">En Progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.inProgress}</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {summary.total > 0 ? ((summary.inProgress / summary.total) * 100).toFixed(0) : 0}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Pendientes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{summary.pending}</span>
                <Badge className="bg-gray-100 text-gray-700">
                  {summary.total > 0 ? ((summary.pending / summary.total) * 100).toFixed(0) : 0}%
                </Badge>
              </div>
            </div>
            {summary.overdue > 0 && (
              <div className="flex items-center justify-between border-t pt-3 mt-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Vencidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-semibold">{summary.overdue}</span>
                  <Badge className="bg-red-100 text-red-700">¡Atención!</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tareas de la Semana ({summary.tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {summary.tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay tareas para esta semana</p>
            ) : (
              summary.tasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={
                            task.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : task.status === "in_progress"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-50 text-gray-700"
                          }
                        >
                          {task.status === "completed"
                            ? "Completada"
                            : task.status === "in_progress"
                              ? "En progreso"
                              : "Pendiente"}
                        </Badge>
                        <Badge
                          className={
                            task.priority === "urgent" || task.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }
                        >
                          {task.priority === "urgent"
                            ? "Urgente"
                            : task.priority === "high"
                              ? "Alta"
                              : task.priority === "medium"
                                ? "Media"
                                : "Baja"}
                        </Badge>
                        {task.due_date && (
                          <span className="text-xs text-gray-500">
                            Vence: {new Date(task.due_date).toLocaleDateString("es-CL")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
