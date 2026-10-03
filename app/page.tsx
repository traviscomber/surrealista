import { createClient } from "@/lib/supabase/server"
import { OperatingSystemDashboard } from "@/components/os/operating-system-dashboard"
import { OperatingWorkspace } from "@/components/os/operating-workspace"

export const dynamic = "force-dynamic"

async function countRows(table: string, filter?: (query: any) => any): Promise<number | null> {
  try {
    const supabase = await createClient()
    let query = supabase.from(table).select("*", { count: "exact", head: true })
    if (filter) query = filter(query)
    const { count, error } = await query

    if (error) {
      console.error(`[os-dashboard] count failed for ${table}`, error)
      return null
    }

    return count ?? 0
  } catch (error) {
    console.error(`[os-dashboard] count failed for ${table}`, error)
    return null
  }
}

async function getActiveTasks() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,priority,status,due_date,related_to,created_at")
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8)

    if (error) {
      console.error("[os-dashboard] active tasks failed", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[os-dashboard] active tasks failed", error)
    return []
  }
}

export default async function HomePage() {
  const [kmz, clients, activeTaskCount, documents, externalProperties, activeTasks] = await Promise.all([
    countRows("kmz_collection", (query) => query.eq("is_active", true)),
    countRows("clients"),
    countRows("tasks", (query) => query.neq("status", "completed")),
    countRows("documents"),
    countRows("properties_external"),
    getActiveTasks(),
  ])

  return (
    <OperatingWorkspace>
      <OperatingSystemDashboard
        metrics={[
          { label: "Campos activos", value: kmz, href: "/campos", note: "KMZ canónicos activos." },
          { label: "Clientes", value: clients, href: "/clientes", note: "Registros de clientes." },
          { label: "Tareas activas", value: activeTaskCount, href: "/gestion-tareas", note: "Pendientes y en progreso." },
          { label: "Documentos", value: documents, href: "/documentacion", note: "Evidencia documental." },
          { label: "Mercado", value: externalProperties, href: "/mercado", note: "Propiedades externas." },
        ]}
        activeTasks={activeTasks}
      />
    </OperatingWorkspace>
  )
}
