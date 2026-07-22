"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  CheckSquare,
  Database,
  Folder,
  HardDrive,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"
import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"
import { TasksManager } from "@/components/tasks/tasks-manager"
import { TaskCreationDialog } from "@/components/tasks/task-creation-dialog"
import SiiRolExplorer from "@/components/sii-rol-explorer"

const SimpleDriveFolderView = dynamic(
  () => import("@/components/google-drive/simple-drive-folder-view").then((mod) => mod.SimpleDriveFolderView),
  { ssr: false, loading: () => <ModuleLoading label="Cargando archivos disponibles…" /> },
)

const CommunicationsManager = dynamic(
  () => import("@/components/communications/communications-manager").then((mod) => mod.default),
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

const moduleDescriptions: Record<string, { title: string; description: string; outcome: string }> = {
  campos: {
    title: "Explorador de Campos",
    description: "Revisa el inventario territorial organizado desde los archivos y registros disponibles.",
    outcome: "Encontrarás campos y antecedentes asociados para continuar su análisis o gestión.",
  },
  clientes: {
    title: "Clientes",
    description: "Consulta y organiza contactos, intereses, antecedentes y seguimiento comercial.",
    outcome: "Obtendrás una vista centralizada de cada relación y sus próximos pasos.",
  },
  comunicaciones: {
    title: "Comunicaciones",
    description: "Revisa los registros de comunicación disponibles para el trabajo comercial y operativo.",
    outcome: "Podrás recuperar contexto antes de contactar o dar seguimiento a una persona.",
  },
  tareas: {
    title: "Tareas",
    description: "Gestiona pendientes vinculados al trabajo territorial, documental y comercial.",
    outcome: "Tendrás una lista operativa de acciones, responsables, prioridad y estado.",
  },
  drive: {
    title: "Archivos",
    description: "Accede a los documentos que estén disponibles mediante las integraciones configuradas.",
    outcome: "Podrás localizar antecedentes sin asumir que una fuente está conectada cuando no lo está.",
  },
  kmz: {
    title: "Archivos territoriales KMZ",
    description: "Accede a la colección territorial activa y a sus herramientas administrativas.",
    outcome: "Podrás revisar, cargar, indexar y mantener los archivos geográficos registrados.",
  },
  "sii-roles": {
    title: "Roles SII",
    description: "Consulta roles de avalúo y organiza antecedentes territoriales para revisión interna.",
    outcome: "Obtendrás una referencia para continuar la validación en fuentes oficiales.",
  },
}

function ModuleLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export default function UnifiedSearchPage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [activeTab, setActiveTab] = useState("campos")
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [kmzCount, setKmzCount] = useState<number | null>(null)
  const [kmzCountError, setKmzCountError] = useState(false)

  const currentModule = moduleDescriptions[activeTab] || moduleDescriptions.campos

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[explorador] No se pudieron cargar las tareas", error)
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
          console.error("[explorador] No se pudo obtener el total de KMZ", error)
          setKmzCountError(true)
          return
        }
        setKmzCount(count ?? 0)
      })
  }, [supabase])

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Espacio de trabajo"
        title={currentModule.title}
        description={currentModule.description}
        outcome={currentModule.outcome}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted/60 p-1 sm:grid-cols-4 xl:grid-cols-7">
          <TabsTrigger value="campos" className="gap-2 py-2.5"><Folder className="h-4 w-4" />Campos</TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2 py-2.5"><Users className="h-4 w-4" />Clientes</TabsTrigger>
          <TabsTrigger value="comunicaciones" className="gap-2 py-2.5"><MessageSquare className="h-4 w-4" />Comunicaciones</TabsTrigger>
          <TabsTrigger value="tareas" className="gap-2 py-2.5"><CheckSquare className="h-4 w-4" />Tareas</TabsTrigger>
          <TabsTrigger value="drive" className="gap-2 py-2.5"><HardDrive className="h-4 w-4" />Archivos</TabsTrigger>
          <TabsTrigger value="kmz" className="gap-2 py-2.5"><MapPin className="h-4 w-4" />KMZ</TabsTrigger>
          <TabsTrigger value="sii-roles" className="gap-2 py-2.5"><Database className="h-4 w-4" />Roles SII</TabsTrigger>
        </TabsList>

        <TabsContent value="campos" className="mt-6 min-h-[600px]">
          <CAMPOSFolderView />
        </TabsContent>

        <TabsContent value="clientes" className="mt-6">
          <ClientRepositoryDashboard />
        </TabsContent>

        <TabsContent value="comunicaciones" className="mt-6">
          <CommunicationsManager />
        </TabsContent>

        <TabsContent value="tareas" className="mt-6 min-h-[600px]">
          <TasksManager tasks={tasks} refreshTrigger={taskRefreshTrigger} onTasksUpdate={loadTasks} />
        </TabsContent>

        <TabsContent value="drive" className="mt-6 min-h-[600px]">
          <SimpleDriveFolderView />
        </TabsContent>

        <TabsContent value="kmz" className="mt-6">
          <Card>
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
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa los archivos geográficos disponibles, su indexación y los antecedentes territoriales asociados. El total mostrado proviene directamente de la colección activa.
              </p>
              <Button asChild>
                <Link href="/admin/kmz-collection"><Database className="mr-2 h-4 w-4" />Administrar colección</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sii-roles" className="mt-6 min-h-[600px]">
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
