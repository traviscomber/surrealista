"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CheckSquare2, Plus, RefreshCw, X } from "lucide-react"

import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type ModuleName = "campos" | "clientes" | "multimedia" | "documentos" | "mercado"

type ModuleTask = {
  id: string
  title: string
  status: string | null
  priority: string | null
  due_date: string | null
}

const MODULE_LABELS: Record<ModuleName, string> = {
  campos: "Campos",
  clientes: "Clientes",
  multimedia: "Multimedia",
  documentos: "Documentos",
  mercado: "Mercado",
}

export function ModuleTasksDock({
  module,
  relatedId,
}: {
  module: ModuleName
  relatedId?: string
}) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [tasks, setTasks] = useState<ModuleTask[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ module, activeOnly: "true", limit: "20" })
    const response = await fetch(`/api/tasks/manage?${params.toString()}`, { cache: "no-store" })
    const body = await response.json().catch(() => ({}))

    if (response.ok) {
      const rows = (Array.isArray(body.tasks) ? body.tasks : []) as Array<ModuleTask & { related_id?: string | null }>
      setTasks(relatedId ? rows.filter((task) => task.related_id === relatedId) : rows)
    } else {
      console.warn("[module-tasks] load failed", body)
    }
    setLoading(false)
  }, [module, relatedId])

  useEffect(() => {
    setMounted(true)
    void load()
  }, [load])

  const dock = (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          className="pointer-events-auto h-9 gap-2 rounded-sm border-border/80 bg-background/95 px-3 text-[11px] font-medium shadow-sm backdrop-blur"
        >
          <CheckSquare2 className="h-3.5 w-3.5" />
          Tareas · {MODULE_LABELS[module]}
          <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center rounded-sm px-1.5 text-[10px]">{tasks.length}</Badge>
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={() => setCreateOpen(true)}
          aria-label="Nueva tarea del módulo"
          className="pointer-events-auto h-9 w-9 rounded-sm"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {open ? (
        <aside className="fixed bottom-14 right-4 z-[119] w-[min(400px,calc(100vw-2rem))] border border-border/80 bg-card shadow-xl">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">To do del módulo</p>
              <h2 className="mt-0.5 text-sm font-semibold">{MODULE_LABELS[module]}</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => void load()} aria-label="Actualizar tareas">
                <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar tareas">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {tasks.length ? tasks.map((task) => (
              <div key={task.id} className="border-b border-border/70 px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-5">{task.title}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {task.priority === "urgent" || task.priority === "high" ? "Urgente" : task.priority === "low" ? "Baja" : "Media"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{task.status === "in_progress" ? "En progreso" : "Pendiente"}</span>
                  {task.due_date ? <span>{new Date(task.due_date).toLocaleDateString("es-CL")}</span> : null}
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No hay tareas pendientes en este módulo.
              </div>
            )}
          </div>

          <footer className="border-t border-border px-4 py-3">
            <Button type="button" className="w-full" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </footer>
        </aside>
      ) : null}

    </>
  )

  return (
    <>
      {mounted ? createPortal(dock, document.body) : null}
      <TaskCreationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        relatedTo={module}
        relatedId={relatedId}
        currentUser={{ email: "system@sur-realista.com" }}
        onTaskCreated={() => {
          setCreateOpen(false)
          setOpen(true)
          void load()
        }}
      />
    </>
  )
}
