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

import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
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
  () => import("@/components/google-drive/simple-drive-folder-view").then((mod) => mod.SimpleDriveFolderView),
  { ssr: false, loading: () => <ModuleLoading label="Cargando archivos…" /> },
)

const CommunicationsManager = dynamic(
  () => import("@/components/communications/communications-manager").then((mod) => mod.CommunicationsManager),
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
    title: "Explorador de campos",
    description: "Revisa el inventario territorial y abre cada expediente con sus antecedentes asociados.",
    outcome: "Selecciona un campo para analizar roles, ubicación, geometría, documentos y señales de propiedad.",
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

type KmzCountState =
  | { status: "idle" | "loading"; count: null }
  | { status: "ready"; count: number }
  | { status: "error"; count: null }

const moduleEntries = Object.entries(modules) as Array<[ModuleKey, (typeof modules)[ModuleKey]]>
const isModuleKey = (value: string | null): value is ModuleKey => Boolean(value && value in modules)

function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [kmzState, setKmzState] = useState<KmzCountState>({ status: "idle", count: null })

  const currentModule = modules[activeTab]

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
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[busqueda] No se pudieron cargar las tareas", error)
      return
    }

    setTasks((data || []) as Task[])
    setTasksLoaded(true)
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
    if (activeTab !== "tareas" || tasksLoaded) return
    void loadTasks()
  }, [activeTab, loadTasks, tasksLoaded])

  useEffect(() => {
    if (activeTab !== "kmz" || kmzState.status !== "idle") return
    void loadKmzCount()
  }, [activeTab, kmzState.status, loadKmzCount])

  const kmzDescription = (() => {
    if (kmzState.status === "error") return "No se pudo consultar la colección activa."
    if (kmzState.status !== "ready") return "Consultando la colección activa…"
    return `${new Intl.NumberFormat("es-CL").format(kmzState.count)} archivos KMZ activos registrados.`
  })()

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Centro operativo"
        title={currentModule.title}
        description={currentModule.description}
        outcome={currentModule.outcome}
      />

      <Tabs value={activeTab} onValueChange={handleModuleChange} className="w-full">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-auto min-w-full justify-start gap-1 rounded-2xl border bg-muted/40 p-1 lg:grid lg:grid-cols-7">
            {moduleEntries.map(([key, module]) => {
              const Icon = module.icon
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="min-w-max gap-2 rounded-xl px-3 py-2.5 lg:min-w-0"
                >
                  <Icon className="h-4 w-4" />
                  {module.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="campos" className="mt-3 h-[calc(100dvh-17rem)] min-h-[620px] overflow-hidden">
          <CAMPOSFolderView />
        </TabsContent>

        <TabsContent value="clientes" className="mt-3">
          <ClientRepositoryDashboard />
        </TabsContent>

        <TabsContent value="comunicaciones" className="mt-3">
          <CommunicationsManager />
        </TabsContent>

        <TabsContent value="tareas" className="mt-3 min-h-[620px]">
          <TasksManager tasks={tasks} refreshTrigger={taskRefreshTrigger} onTasksUpdate={loadTasks} />
        </TabsContent>

        <TabsContent value="drive" className="mt-3 min-h-[620px]">
          <SimpleDriveFolderView />
        </TabsContent>

        <TabsContent value="kmz" className="mt-3">
          <Card className="rounded-2xl border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Colección territorial</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {kmzState.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {kmzState.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
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
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar
                  </Button>
                )}
                <Button asChild>
                  <Link href="/admin/kmz-collection">
                    <Database className="mr-2 h-4 w-4" />
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
