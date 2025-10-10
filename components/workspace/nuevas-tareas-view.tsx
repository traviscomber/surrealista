"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, User, MapPin, CheckCircle, Clock, AlertCircle, ListTodo } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Task {
  id: string
  title: string
  description: string
  created_by: string
  created_at: string
  status: "pending" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  location?: string
  related_to?: string
}

export function NuevasTareasView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading tasks:", error)
        return
      }

      setTasks(data || [])
    } catch (error) {
      console.error("[v0] Error in loadTasks:", error)
    }
  }

  const createTask = async () => {
    if (!newTaskDescription.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTaskDescription.substring(0, 100),
            description: newTaskDescription,
            status: "pending",
            priority: "medium",
            created_by: "current_user",
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error creating task:", error)
        return
      }

      setNewTaskDescription("")
      await loadTasks()
    } catch (error) {
      console.error("[v0] Error in createTask:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)

      if (error) {
        console.error("[v0] Error updating task:", error)
        return
      }

      await loadTasks()
    } catch (error) {
      console.error("[v0] Error in updateTaskStatus:", error)
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200"
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-orange-50 text-orange-700 border-orange-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Task Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Crear Nueva Tarea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder='Ejemplo: "Federico Gana llamó hoy queriendo cotizar un campo de 500 hectáreas para producción de semillas en sector Talca" o "Hoy voy a recorrer el sector Puelo para buscar campos para subdivisiones de conservación"'
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button onClick={createTask} disabled={loading || !newTaskDescription.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Creando..." : "Crear Tarea"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tareas Abiertas ({tasks.length})</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {tasks.filter((t) => t.status === "pending").length} Pendientes
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {tasks.filter((t) => t.status === "in_progress").length} En Progreso
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {tasks.filter((t) => t.status === "completed").length} Completadas
            </Badge>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListTodo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay tareas creadas aún</p>
              <p className="text-sm text-gray-500 mt-2">Crea tu primera tarea usando el formulario de arriba</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(task.created_at).toLocaleDateString("es-CL")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{task.created_by}</span>
                        </div>
                        {task.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{task.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {task.status !== "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          En Progreso
                        </Button>
                      )}
                      {task.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
