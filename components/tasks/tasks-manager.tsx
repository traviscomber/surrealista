"use client"

import { useState } from "react"
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

const priorityLabel = (priority: string) => {
  if (priority === "urgent" || priority === "high") return "Urgente"
  if (priority === "medium") return "Media"
  return "Baja"
}

const statusLabel = (status: string) => {
  if (status === "completed") return "Completada"
  if (status === "in_progress") return "En progreso"
  return "Pendiente"
}

export function TasksManager({
  tasks,
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
    <div className="grid min-h-[620px] grid-cols-1 border border-border/70 bg-card lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
      <section className="min-w-0 border-b border-border/70 lg:border-b-0 lg:border-r">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
          <div>
            <p className="sr-meta">Gestión operativa</p>
            <h2 className="sr-panel-title mt-1">Tareas</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tasks.length} tareas disponibles</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setQuickTaskOpen(true)}>
              <Zap className="h-4 w-4" />
              Rápida
            </Button>
            <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </div>
        </header>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/70 px-4 py-2">
          <Button size="sm" variant="ghost" className="shrink-0 text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            Urgentes
          </Button>
          <Button size="sm" variant="ghost" className="shrink-0 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Hoy
          </Button>
          <Button size="sm" variant="ghost" className="shrink-0 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Con ubicación
          </Button>
        </div>

        <div className="max-h-[620px] overflow-y-auto">
          {tasks.map((task) => {
            const isSelected = selectedTask?.id === task.id
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => handleTaskClick(task)}
                className={`w-full border-b border-border/60 px-5 py-4 text-left transition-colors hover:bg-secondary/45 ${
                  isSelected ? "bg-secondary/70" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className={task.priority === "urgent" || task.priority === "high" ? "border-destructive/35 text-destructive" : ""}>
                    {priorityLabel(task.priority)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{statusLabel(task.status)}</Badge>
                  {task.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {task.location}
                    </span>
                  ) : null}
                  {task.due_date ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(task.due_date).toLocaleDateString("es-CL")}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}

          {tasks.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground/45" />
              <h3 className="mt-4 text-base font-semibold text-foreground">No hay tareas</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Crea una tarea rápida o abre el formulario completo para registrar el próximo paso.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="min-w-0 bg-background/55">
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
          <div className="flex h-full min-h-[460px] flex-col items-center justify-center px-8 text-center">
            <CheckSquare className="h-10 w-10 text-muted-foreground/45" />
            <h3 className="mt-4 text-base font-semibold text-foreground">Selecciona una tarea</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Abre una tarea de la lista para revisar detalles, estado y acciones disponibles.
            </p>
          </div>
        )}
      </section>

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
    </div>
  )
}
