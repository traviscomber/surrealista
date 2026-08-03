"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckSquare,
  Database,
  Folder,
  HardDrive,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react"

import { CamposWorkspace } from "@/components/campos/campos-workspace"
import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"
import SiiRolExplorer from "@/components/sii-rol-explorer"
import { TasksManager } from "@/components/tasks/tasks-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { createBrowserClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

const SimpleDriveFolderView = dynamic(
  () => import("@/components/google-drive/simple-drive-folder-view").then((module) => module.SimpleDriveFolderView),
  { ssr: false, loading: () => <ModuleLoading label="Cargando archivos…" /> },
)

const CommunicationsManager = dynamic(
  () => import("@/components/communications/communications-manager").then((module) => module.CommunicationsManager),
  { ssr: false, loading: () => <ModuleLoading label="Cargando comunicaciones…" /> },
)

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

const modules = {
  campos: {
    label: "Campos",
    icon: Folder,
    title: "CAMPOS",
    description: "Superficie principal de inteligencia territorial, análisis predial y gestión de expedientes.",
    outcome: "Explora la colección, selecciona geometrías y concentra roles, propiedad, documentos y señales de investigación.",
  },
  clientes: {
    label: "Clientes",
    icon: Users,
    title: "Clientes",
    description: "Consulta contactos, intereses, antecedentes y seguimiento comercial.",
    outcome: "Centraliza el contexto de cada relación y sus próximos pasos.",
  },
  comunicaciones: {
    label: "Comunicaciones",
    icon: MessageSquare,
    title: "Comunicaciones",
    description: "Recupera conversaciones y contexto antes de contactar o dar seguimiento.",
    outcome: "Mantén continuidad comercial sin depender de memoria individual.",
  },
  tareas: {
    label: "Tareas",
    icon: CheckSquare,
    title: "Tareas",
    description: "Gestiona pendientes territoriales, documentales y comerciales.",
    outcome: "Prioriza acciones, responsables y fechas desde una vista operativa.",
  },
  drive: {
    label: "Archivos",
    icon: HardDrive,
    title: "Archivos",
    description: "Localiza documentos disponibles mediante las integraciones configuradas.",
    outcome: "Encuentra antecedentes sin mezclar fuentes ni asumir conexiones inexistentes.",
  },
  kmz: {
    label: "KMZ",
    icon: MapPin,
    title: "Colección KMZ",
    description: "Administra los archivos geográficos que alimentan el inventario territorial.",
    outcome: "Controla carga, indexación y disponibilidad de geometrías desde un único lugar.",
  },
  "sii-roles": {
    label: "Roles SII",
    icon: Database,
    title: "Roles SII",
    description: "Consulta roles de avalúo y antecedentes territoriales para revisión interna.",
    outcome: "Obtén una referencia estructurada antes de validar en fuentes oficiales.",
  },
} as const

type ModuleKey = keyof typeof modules
type TasksState = "idle" | "loading" | "ready" | "error"
type KmzCountState =
  | { status: "idle" | "loading"; count: null }
  | { status: "ready"; count: number }
  | { status: "error"; count: null }

const moduleEntries = Object.entries(modules) as Array<[ModuleKey, (typeof modules)[ModuleKey]]>
const isModuleKey = (value: string | null): value is ModuleKey => Boolean(value && value in modules)

function ModuleLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export default function UnifiedSearchPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const moduleParam = searchParams.get("modulo")

  const [activeTab, setActiveTab] = useState<ModuleKey>(() => (isModuleKey(moduleParam) ? moduleParam : "campos"))
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksState, setTasksState] = useState<TasksState>("idle")
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [kmzState, setKmzState] = useState<KmzCountState>({ status: "idle", count: null })

  const currentModule = modules[activeTab]
  const isCampos = activeTab === "campos"

  useEffect(() => {
    const nextModule = isModuleKey(moduleParam) ? moduleParam : "campos"
    setActiveTab((current) => (current === nextModule ? current : nextModule))
  }, [moduleParam])

  const handleModuleChange = (value: string) => {
    if (!isModuleKey(value)) return

    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === "campos") params.delete("modulo")
    else params.set("modulo", value)

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const loadTasks = useCallback(async () => {
    setTasksState("loading")
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(20)

    if (error) {
      console.error("[busqueda] No se pudieron cargar las tareas", error)
      setTasksState("error")
      return
    }

    setTasks((data || []) as Task[])
    setTasksState("ready")
    setTaskRefreshTrigger((value) => value + 1)
  }, [supabase])

  const loadKmzCount = useCallback(async () => {
    setKmzState({ status: "loading", count: null })
    const { count, error } = await supabase
      .from("kmz_collection")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)

    if (error) {
      console.error("[busqueda] No se pudo obtener el total de KMZ", error)
      setKmzState({ status: "error", count: null })
      return
    }

    setKmzState({ status: "ready", count: count ?? 0 })
  }, [supabase])

  useEffect(() => {
    if (activeTab !== "tareas" || tasksState !== "idle") return
    void loadTasks()
  }, [activeTab, loadTasks, tasksState])

  useEffect(() => {
    if (activeTab !== "kmz" || kmzState.status !== "idle") return
    void loadKmzCount()
  }, [activeTab, kmzState.status, loadKmzCount])

  const kmzDescription =
    kmzState.status === "error"
      ? "No se pudo consultar la colección activa."
      : kmzState.status === "ready"
        ? `${new Intl.NumberFormat("es-CL").format(kmzState.count)} archivos KMZ activos registrados.`
        : "Consultando la colección activa…"

  return (
    <main
      className={`mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 ${
        isCampos ? "space-y-3 py-3" : "space-y-5 py-5"
      }`}
    >
      {!isCampos && (
        <WorkspaceHeading
          eyebrow="Centro operativo"
          title={currentModule.title}
          description={currentModule.description}
          outcome={currentModule.outcome}
        />
      )}

      <Tabs value={activeTab} onValueChange={handleModuleChange} className="w-full">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            className="inline-flex h-auto min-w-full justify-start gap-1 rounded-2xl border bg-muted/40 p-1 lg:grid lg:grid-cols-7"
            aria-label="Módulos del centro operativo"
          >
            {moduleEntries.map(([key, module]) => {
              const Icon = module.icon
              return (
                <TabsTrigger key={key} value={key} className="min-w-max gap-2 rounded-xl px-3 py-2.5 lg:min-w-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {module.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="campos" className="mt-2 h-[calc(100dvh-8.75rem)] min-h-[680px] overflow-hidden">
          <CamposWorkspace />
        </TabsContent>

        <TabsContent value="clientes" className="mt-3">
          <ClientRepositoryDashboard />
        </TabsContent>

        <TabsContent value="comunicaciones" className="mt-3">
          <CommunicationsManager />
        </TabsContent>

        <TabsContent value="tareas" className="mt-3 min-h-[620px]">
          {tasksState === "loading" || tasksState === "idle" ? (
            <ModuleLoading label="Cargando tareas…" />
          ) : tasksState === "error" ? (
            <Card className="rounded-2xl border-destructive/30 shadow-none">
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">No se pudieron cargar las tareas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">La vista no se mostrará vacía mientras exista un problema de conexión o permisos.</p>
                </div>
                <Button variant="outline" onClick={() => void loadTasks()}>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TasksManager tasks={tasks} refreshTrigger={taskRefreshTrigger} onTasksUpdate={loadTasks} />
          )}
        </TabsContent>

        <TabsContent value="drive" className="mt-3 min-h-[620px]">
          <SimpleDriveFolderView />
        </TabsContent>

        <TabsContent value="kmz" className="mt-3">
          <Card className="rounded-2xl border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Colección territorial</CardTitle>
              <CardDescription className="flex items-center gap-2" aria-live="polite">
                {kmzState.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {kmzState.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />}
                {kmzDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Revisa la fuente territorial, su indexación y la disponibilidad de geometrías. La administración queda separada del análisis diario para reducir errores operativos.
              </p>
              <div className="flex flex-wrap gap-2">
                {kmzState.status === "error" && (
                  <Button variant="outline" onClick={() => void loadKmzCount()}>
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Reintentar
                  </Button>
                )}
                <Button asChild>
                  <Link href="/admin/kmz-collection">
                    <Database className="mr-2 h-4 w-4" aria-hidden="true" />
                    Administrar colección
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sii-roles" className="mt-3 min-h-[620px]">
          <SiiRolExplorer />
        </TabsContent>
      </Tabs>
    </main>
  )
}
