"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, BellRing, CheckSquare, Loader2, RefreshCw } from "lucide-react"

import { TasksManager } from "@/components/tasks/tasks-manager"
import { UserContactManager } from "@/components/tasks/user-contact-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
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

type TasksState = "idle" | "loading" | "ready" | "error"

function normalizeTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.title !== "string") return null

  return {
    id: row.id,
    title: row.title,
    description: typeof row.description === "string" ? row.description : "",
    location: typeof row.location === "string" ? row.location : "",
    priority: typeof row.priority === "string" ? row.priority : "low",
    status: typeof row.status === "string" ? row.status : "pending",
    due_date: typeof row.due_date === "string" ? row.due_date : "",
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  }
}

export default function GestionTareasPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [tasks, setTasks] = useState<Task[]>([])
  const [state, setState] = useState<TasksState>("idle")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadTasks = useCallback(async () => {
    setState("loading")
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, location, priority, status, due_date, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("[gestion-tareas] No se pudieron cargar las tareas", error)
      setState("error")
      return
    }

    const normalized = (Array.isArray(data) ? data : [])
      .map(normalizeTask)
      .filter((task): task is Task => task !== null)

    setTasks(normalized)
    setRefreshTrigger((value) => value + 1)
    setState("ready")
  }, [supabase])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Gestión operativa"
        title="Tareas"
        description="Registra, prioriza y ejecuta pendientes territoriales, documentales y comerciales desde una vista operativa única."
        outcome="Cada pendiente debe terminar con responsable, prioridad, estado y próximo paso trazable."
      />

      <Tabs defaultValue="tareas" className="w-full">
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2 bg-secondary/60 p-1">
          <TabsTrigger value="tareas" className="gap-2 py-2.5">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2 py-2.5">
            <BellRing className="h-4 w-4" aria-hidden="true" />
            Alertas y contactos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tareas" className="mt-4 min-h-[620px]">
          {state === "idle" || state === "loading" ? (
            <div className="flex min-h-[420px] items-center justify-center border-y border-border bg-secondary/25 text-sm text-muted-foreground" role="status">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando tareas…
            </div>
          ) : state === "error" ? (
            <section className="flex min-h-[360px] flex-col items-center justify-center gap-4 border-y border-destructive/30 bg-destructive/5 px-6 text-center">
              <AlertCircle className="h-9 w-9 text-destructive" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">No se pudieron cargar las tareas</h2>
                <p className="mt-1 text-sm text-muted-foreground">Revisa la conexión y permisos antes de continuar.</p>
              </div>
              <Button variant="outline" onClick={() => void loadTasks()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </section>
          ) : (
            <TasksManager tasks={tasks} refreshTrigger={refreshTrigger} onTasksUpdate={loadTasks} />
          )}
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <section className="border-y border-border bg-card px-4 py-5 sm:px-6">
            <div className="mb-5 max-w-3xl">
              <p className="sr-meta">Configuración secundaria</p>
              <h2 className="sr-panel-title mt-1">Alertas y contactos</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Configura destinatarios y preferencias de notificación sin mezclar esta tarea administrativa con la ejecución diaria.
              </p>
            </div>
            <UserContactManager />
          </section>
        </TabsContent>
      </Tabs>
    </main>
  )
}
