"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Edit, Trash2, MapPin, Calendar, User, Clock, AlertCircle, MessageSquare } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TaskCreationDialog } from "./task-creation-dialog" // Import TaskCreationDialog

interface Task {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  due_date: string
  created_at: string
  created_by?: string
  assigned_to?: string
}

interface TaskActionsPanelProps {
  task: Task
  onTaskUpdated: () => void
  onTaskDeleted: () => void
}

export function TaskActionsPanel({ task, onTaskUpdated, onTaskDeleted }: TaskActionsPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [notes, setNotes] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false) // Add state for edit dialog
  const supabase = createBrowserClient()

  const updateTaskStatus = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id)

      if (error) throw error
      console.log("[v0] Task status updated to:", newStatus)
      onTaskUpdated()
    } catch (error) {
      console.error("[v0] Error updating task status:", error)
      alert("Error al actualizar el estado de la tarea")
    } finally {
      setIsUpdating(false)
    }
  }

  const updateTaskPriority = async (newPriority: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from("tasks").update({ priority: newPriority }).eq("id", task.id)

      if (error) throw error
      console.log("[v0] Task priority updated to:", newPriority)
      onTaskUpdated()
    } catch (error) {
      console.error("[v0] Error updating task priority:", error)
      alert("Error al actualizar la prioridad de la tarea")
    } finally {
      setIsUpdating(false)
    }
  }

  const completeTask = async () => {
    await updateTaskStatus("completed")
  }

  const deleteTask = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return

    setIsUpdating(true)
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id)

      if (error) throw error
      console.log("[v0] Task deleted:", task.id)
      onTaskDeleted()
    } catch (error) {
      console.error("[v0] Error deleting task:", error)
      alert("Error al eliminar la tarea")
    } finally {
      setIsUpdating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "bg-red-100 text-red-700 border-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "low":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300"
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const handleEditTask = () => {
    console.log("[v0] Opening edit dialog for task:", task.id)
    setIsEditDialogOpen(true)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Detalles y Acciones de Tarea
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Title */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
            {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
          </div>

          {/* Task Metadata */}
          <div className="space-y-2 border-t pt-4">
            {task.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{task.location}</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Vence: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.created_by && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Creado por: {task.created_by}</span>
              </div>
            )}
            {task.created_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Creado: {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Status and Priority Controls */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={task.status} onValueChange={updateTaskStatus} disabled={isUpdating}>
                <SelectTrigger className={getStatusColor(task.status)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prioridad</label>
              <Select value={task.priority} onValueChange={updateTaskPriority} disabled={isUpdating}>
                <SelectTrigger className={getPriorityColor(task.priority)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 border-t pt-4">
            <Button
              className="w-full"
              variant="default"
              onClick={completeTask}
              disabled={isUpdating || task.status === "completed"}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Completada
            </Button>

            <Button className="w-full bg-transparent" variant="outline" onClick={handleEditTask} disabled={isUpdating}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Tarea
            </Button>

            <Button className="w-full" variant="destructive" onClick={deleteTask} disabled={isUpdating}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Tarea
            </Button>
          </div>

          {/* Notes Section */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notas
            </label>
            <Textarea
              placeholder="Agregar notas sobre esta tarea..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button className="w-full mt-2 bg-transparent" variant="outline" size="sm" disabled={!notes.trim()}>
              Guardar Nota
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskCreationDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskCreated={onTaskUpdated}
        task={task}
      />
    </>
  )
}
