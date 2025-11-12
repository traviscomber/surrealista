"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles, ListChecks, FileText, Eye, EyeOff, CheckSquare, BarChart3 } from "lucide-react"
import { TemplateLibrary } from "./template-library"
import { CommunicationsTracking } from "./communications-tracking"
import { DocumentsManager } from "./documents-manager"
import { Button } from "@/components/ui/button"
import { TasksManager } from "@/components/tasks/tasks-manager"
import { WeeklyTaskSummary } from "@/components/tasks/weekly-task-summary"
import { createBrowserClient } from "@/lib/supabase/client"

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                Gestión de Comunicaciones y Documentación
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Sistema completo de comunicaciones, templates y documentos vinculados a propiedades
              </p>
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

      {/* Main Tabs - CHANGED: Added 2 new tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="tasks" className="flex items-center gap-2 py-3">
            <CheckSquare className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Nuevas Tareas</div>
              <div className="text-xs text-muted-foreground">Gestión de tareas</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2 py-3">
            <Sparkles className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Biblioteca de Templates</div>
              <div className="text-xs text-muted-foreground">Crear desde plantillas</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2 py-3">
            <ListChecks className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Gestión y Tracking</div>
              <div className="text-xs text-muted-foreground">Seguimiento completo</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Documentación</div>
              <div className="text-xs text-muted-foreground">Docs vinculados a KMZ/KML</div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-semibold">Resumen Semanal</div>
              <div className="text-xs text-muted-foreground">Análisis ejecutivo</div>
            </div>
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="templates" className="mt-6">
          <TemplateLibrary onCommunicationCreated={handleCommunicationCreated} />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <CommunicationsTracking refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsManager showDemoData={showDemoData} />
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <WeeklyTaskSummary key={taskRefreshTrigger} refreshTrigger={taskRefreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
