"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Plus, AlertCircle, Clock, MapPin, Calendar, Zap } from "lucide-react"
import { TaskActionsPanel } from "./task-actions-panel"
import { TaskCreationDialog } from "./task-creation-dialog"
import { QuickTaskCreation } from "./quick-task-creation"

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

interface TasksManagerProps {
  tasks: Task[]
  refreshTrigger?: number
  onTasksUpdate?: () => void
  selectedTask?: Task | null
  onTaskClick?: (task: Task) => void
  onTaskCreated?: () => void
  onTaskUpdated?: () => void
  currentUser?: any
}

export function TasksManager({
  tasks,
  refreshTrigger,
  onTasksUpdate,
  selectedTask: initialSelectedTask,
  onTaskClick: onTaskClickProp,
  onTaskCreated: onTaskCreatedProp,
  onTaskUpdated: onTaskUpdatedProp,
  currentUser,
}: TasksManagerProps) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [quickTaskOpen, setQuickTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialSelectedTask || null)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    onTaskClickProp?.(task)
  }

  const handleTaskCreated = () => {
    onTaskCreatedProp?.()
    onTasksUpdate?.()
  }

  const handleTaskUpdated = () => {
    onTaskUpdatedProp?.()
    onTasksUpdate?.()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tasks List */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Nuevas Tareas
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setQuickTaskOpen(true)}
                  variant="outline"
                  className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Zap className="h-4 w-4" />
                  Rápida
                </Button>
                <Button
                  size="sm"
                  onClick={() => setTaskDialogOpen(true)}
                  className="gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Nueva
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filter/sort quick actions */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Button size="sm" variant="ghost" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                Urgente
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                <Clock className="h-3 w-3 mr-1 text-blue-500" />
                Hoy
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                <MapPin className="h-3 w-3 mr-1 text-purple-500" />
                Con ubicación
              </Button>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${
                    selectedTask?.id === task.id ? "bg-blue-100 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                          <MapPin className="h-4 w-4" />
                          {task.location}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={
                        task.priority === "urgent" || task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }
                    >
                      {task.priority === "urgent" || task.priority === "high"
                        ? "Urgente"
                        : task.priority === "medium"
                          ? "Media"
                          : "Baja"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {task.due_date && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No hay tareas</p>
                  <p className="text-sm text-gray-400 mt-2 text-center max-w-sm mx-auto">
                    Crea tu primera tarea usando el botón "Rápida" o "Nueva" arriba
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details Panel */}
      <div className="space-y-4">
        {selectedTask ? (
          <TaskActionsPanel
            task={selectedTask}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={() => {
              handleTaskUpdated()
              setSelectedTask(null)
            }}
          />
        ) : (
          <Card className="h-full min-h-[400px]">
            <CardContent className="flex flex-col items-center justify-center h-full py-12">
              <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">Selecciona una tarea</p>
              <p className="text-sm text-gray-400 mt-2 text-center max-w-sm">
                Haz clic en una tarea de la lista para ver sus detalles y opciones de gestión
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <QuickTaskCreation
        open={quickTaskOpen}
        onOpenChange={setQuickTaskOpen}
        currentUser={currentUser || { email: "system@sur-realista.com" }}
        onTaskCreated={() => {
          handleTaskCreated()
          setQuickTaskOpen(false)
        }}
        onOpenCompleteDialog={() => {
          setQuickTaskOpen(false)
          setTaskDialogOpen(true)
        }}
      />

      <TaskCreationDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        currentUser={currentUser || { email: "system@sur-realista.com" }}
        onTaskCreated={() => {
          handleTaskCreated()
          setTaskDialogOpen(false)
        }}
      />

      <TaskCreationDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        currentUser={currentUser}
        onTaskCreated={() => {
          handleTaskCreated()
          setTaskDialogOpen(false)
        }}
      />
    </div>
  )
}
