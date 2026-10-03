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
  related_to: string
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
    related_to: typeof row.related_to === "string" ? row.related_to : "",
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
      .select("id, title, description, location, priority, status, due_date, created_at, related_to")
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
        <TabsList className="grid h-11 w-full max-w-md grid-cols-2 rounded-none border-b border-border/70 bg-transparent p-0">
          <TabsTrigger value="tareas" className="relative h-11 gap-2 rounded-none bg-transparent py-0 shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-primary">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="alertas" className="relative h-11 gap-2 rounded-none bg-transparent py-0 shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-primary">
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
            <section className="border-y border-border/70 py-6" aria-live="polite">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cola operativa</p>
                    <h2 className="mt-1 text-base font-semibold">No se pudieron cargar las tareas</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      La cola permanece vacía hasta recuperar la fuente. No se muestran pendientes incompletos o simulados.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => void loadTasks()}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reintentar
                </Button>
              </div>
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
