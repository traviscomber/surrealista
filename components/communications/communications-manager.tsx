"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { MessageSquare, Sparkles, ListChecks, FileText, Eye, EyeOff, CheckSquare, BarChart3 } from 'lucide-react'
import { TemplateLibrary } from "./template-library"
import { CommunicationsTracking } from "./communications-tracking"
import { DocumentsManager } from "./documents-manager"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TasksManager } from "@/components/tasks/tasks-manager"
import { WeeklyTaskSummary } from "@/components/tasks/weekly-task-summary"
import { createBrowserClient } from "@/lib/supabase/client"
import { WhitepaperBuilder } from "@/components/corporate-documents/whitepaper-builder"

interface Task {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  due_date: string
  created_at: string
}

export function CommunicationsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDemoData, setShowDemoData] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState("tasks")

  const supabase = createBrowserClient()

  useEffect(() => {
    getCurrentUser()
    loadTasks()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    } catch (error) {
      console.error("[v0] Error getting user:", error)
    }
  }

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setTasks(data || [])
      setTaskRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }

  const handleCommunicationCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleTaskCreated = () => {
    loadTasks()
  }

  const handleTaskUpdated = () => {
    setSelectedTask(null)
    loadTasks()
  }

  const getContextualStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (activeTab) {
      case "tasks":
        const urgentTasks = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length
        const pendingTasks = tasks.filter((t) => t.status === "pending").length
        const completedThisWeek = tasks.filter((t) => {
          const taskDate = new Date(t.created_at)
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return t.status === "completed" && taskDate >= weekAgo
        }).length
        const overdueTasks = tasks.filter((t) => {
          const dueDate = new Date(t.due_date)
          return t.status !== "completed" && dueDate < today
        }).length

        return [
          { label: "Urgentes Hoy", value: urgentTasks, color: "text-red-600" },
          { label: "Pendientes", value: pendingTasks, color: "text-gray-600" },
          { label: "Completadas (semana)", value: completedThisWeek, color: "text-sage-dark" },
          { label: "Vencidas", value: overdueTasks, color: "text-sage" },
        ]

      case "summary":
        const totalTasksWeek = tasks.filter((t) => {
          const taskDate = new Date(t.created_at)
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return taskDate >= weekAgo
        }).length
        const completedTasksWeek = tasks.filter((t) => {
          const taskDate = new Date(t.created_at)
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return t.status === "completed" && taskDate >= weekAgo
        }).length
        const completionRate = totalTasksWeek > 0 ? Math.round((completedTasksWeek / totalTasksWeek) * 100) : 0

        return [
          { label: "Tareas Semana", value: totalTasksWeek, color: "text-sage-dark" },
          { label: "Tasa Completitud", value: `${completionRate}%`, color: "text-sage-dark" },
          { label: "Activas", value: tasks.filter((t) => t.status !== "completed").length, color: "text-sage" },
          { label: "Total Tareas", value: tasks.length, color: "text-gray-600" },
        ]

      case "documents":
      case "tracking":
      case "templates":
      default:
        return []
    }
  }

  const contextualStats = getContextualStats()

  const urgentTasksCount = tasks.filter((t) => t.priority === "urgent" || t.priority === "high").length

  return (
    <div className="space-y-6">
      <Card className="border-sage-dark/30 bg-gradient-to-r from-sage/5 to-sage-light/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-sage-dark" />
                Centro de Trabajo
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Tu hub completo de tareas, documentos y comunicaciones</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemoData(!showDemoData)}
              className="flex items-center gap-2"
            >
              {showDemoData ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showDemoData ? "Ocultar" : "Mostrar"} Datos Demo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="tasks" className="flex items-center gap-2 py-3 relative data-[state=active]:bg-sage data-[state=active]:text-white">
            <CheckSquare className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2">
                Nuevas Tareas
                {urgentTasksCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 ml-1">{urgentTasksCount}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Crea y gestiona tu día a día</div>
            </div>
          </TabsTrigger>

          <TabsTrigger value="summary" className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Resumen Semanal</div>
              <div className="text-xs text-muted-foreground">Vista ejecutiva de progreso</div>
            </div>
          </TabsTrigger>

          <TabsTrigger value="documents" className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Documentación</div>
              <div className="text-xs text-muted-foreground">Archivos PDF, KMZ y documentos</div>
            </div>
          </TabsTrigger>

          <TabsTrigger value="tracking" className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white">
            <ListChecks className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Gestión y Tracking</div>
              <div className="text-xs text-muted-foreground">Historial de comunicaciones</div>
            </div>
          </TabsTrigger>

          <TabsTrigger value="templates" className="flex items-center gap-2 py-3 data-[state=active]:bg-sage data-[state=active]:text-white">
            <Sparkles className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Biblioteca de Templates</div>
              <div className="text-xs text-muted-foreground">Plantillas reutilizables</div>
            </div>
          </TabsTrigger>
        </TabsList>

        {contextualStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {contextualStats.map((stat, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <TabsContent value="tasks" className="mt-6">
          <TasksManager
            tasks={tasks}
            selectedTask={selectedTask}
            onTaskClick={handleTaskClick}
            onTaskCreated={handleTaskCreated}
            onTaskUpdated={handleTaskUpdated}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <WeeklyTaskSummary key={taskRefreshTrigger} refreshTrigger={taskRefreshTrigger} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="space-y-6">
            <WhitepaperBuilder />
            <DocumentsManager showDemoData={showDemoData} />
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <CommunicationsTracking refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateLibrary onCommunicationCreated={handleCommunicationCreated} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
