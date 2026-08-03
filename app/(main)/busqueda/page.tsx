"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  CheckSquare,
  Database,
  Folder,
  HardDrive,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react"

import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"
import SiiRolExplorer from "@/components/sii-rol-explorer"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
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
    title: "Explorador de campos",
    description: "Revisa el inventario territorial y abre cada expediente con sus antecedentes asociados.",
    outcome: "Selecciona un campo para analizar roles, ubicación, geometría, documentos y señales de propiedad.",
  },
  clientes: {
    title: "Clientes",
    description: "Consulta contactos, intereses, antecedentes y seguimiento comercial.",
    outcome: "Centraliza el contexto de cada relación y sus próximos pasos.",
  },
  comunicaciones: {
    title: "Comunicaciones",
    description: "Recupera conversaciones y contexto antes de contactar o dar seguimiento.",
    outcome: "Mantén continuidad comercial sin depender de memoria individual.",
  },
  tareas: {
    title: "Tareas",
    description: "Gestiona pendientes territoriales, documentales y comerciales.",
    outcome: "Prioriza acciones, responsables y fechas desde una vista operativa.",
  },
  drive: {
    title: "Archivos",
    description: "Localiza documentos disponibles mediante las integraciones configuradas.",
    outcome: "Encuentra antecedentes sin mezclar fuentes ni asumir conexiones inexistentes.",
  },
  kmz: {
    title: "Colección KMZ",
    description: "Administra los archivos geográficos que alimentan el inventario territorial.",
    outcome: "Controla carga, indexación y disponibilidad de geometrías desde un único lugar.",
  },
  "sii-roles": {
    title: "Roles SII",
    description: "Consulta roles de avalúo y antecedentes territoriales para revisión interna.",
    outcome: "Obtén una referencia estructurada antes de validar en fuentes oficiales.",
  },
} as const

type ModuleKey = keyof typeof modules

function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export default function UnifiedSearchPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [activeTab, setActiveTab] = useState<ModuleKey>("campos")
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [currentUser, setCurrentUser] = useState<unknown>(null)
  const [kmzCount, setKmzCount] = useState<number | null>(null)
  const [kmzCountError, setKmzCountError] = useState(false)

  const currentModule = modules[activeTab]

  const loadTasks = async () => {
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
    setTaskRefreshTrigger((value) => value + 1)
  }

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user || null))
    void loadTasks()

    void supabase
      .from("kmz_collection")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count, error }) => {
        if (error) {
          console.error("[busqueda] No se pudo obtener el total de KMZ", error)
          setKmzCountError(true)
          return
        }

        setKmzCount(count ?? 0)
      })
  }, [supabase])

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Centro operativo"
        title={currentModule.title}
        description={currentModule.description}
        outcome={currentModule.outcome}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ModuleKey)} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border bg-muted/40 p-1 sm:grid-cols-4 xl:grid-cols-7">
          <TabsTrigger value="campos" className="gap-2 rounded-xl py-2.5"><Folder className="h-4 w-4" />Campos</TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2 rounded-xl py-2.5"><Users className="h-4 w-4" />Clientes</TabsTrigger>
          <TabsTrigger value="comunicaciones" className="gap-2 rounded-xl py-2.5"><MessageSquare className="h-4 w-4" />Comunicaciones</TabsTrigger>
          <TabsTrigger value="tareas" className="gap-2 rounded-xl py-2.5"><CheckSquare className="h-4 w-4" />Tareas</TabsTrigger>
          <TabsTrigger value="drive" className="gap-2 rounded-xl py-2.5"><HardDrive className="h-4 w-4" />Archivos</TabsTrigger>
          <TabsTrigger value="kmz" className="gap-2 rounded-xl py-2.5"><MapPin className="h-4 w-4" />KMZ</TabsTrigger>
          <TabsTrigger value="sii-roles" className="gap-2 rounded-xl py-2.5"><Database className="h-4 w-4" />Roles SII</TabsTrigger>
        </TabsList>

        <TabsContent value="campos" className="mt-4 h-[calc(100dvh-18rem)] min-h-[620px] overflow-hidden rounded-2xl border bg-card">
          <CAMPOSFolderView />
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          <ClientRepositoryDashboard />
        </TabsContent>

        <TabsContent value="comunicaciones" className="mt-4">
          <CommunicationsManager />
        </TabsContent>

        <TabsContent value="tareas" className="mt-4 min-h-[620px]">
          <TasksManager tasks={tasks} refreshTrigger={taskRefreshTrigger} onTasksUpdate={loadTasks} />
        </TabsContent>

        <TabsContent value="drive" className="mt-4 min-h-[620px]">
          <SimpleDriveFolderView />
        </TabsContent>

        <TabsContent value="kmz" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Colección territorial</CardTitle>
              <CardDescription>
                {kmzCountError
                  ? "El total de archivos no está disponible en este momento."
                  : kmzCount === null
                    ? "Consultando la colección activa…"
                    : `${new Intl.NumberFormat("es-CL").format(kmzCount)} archivos KMZ activos registrados.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Revisa la fuente territorial, su indexación y la disponibilidad de geometrías. La administración queda separada del análisis diario para reducir errores operativos.
              </p>
              <Button asChild>
                <Link href="/admin/kmz-collection"><Database className="mr-2 h-4 w-4" />Administrar colección</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sii-roles" className="mt-4 min-h-[620px]">
          <SiiRolExplorer />
        </TabsContent>
      </Tabs>

      <TaskCreationDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        currentUser={currentUser}
        onTaskCreated={() => {
          void loadTasks()
          setTaskDialogOpen(false)
        }}
      />
    </main>
  )
}
