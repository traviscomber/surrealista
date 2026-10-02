import { createClient } from "@/lib/supabase/server"
import { OperatingSystemDashboard } from "@/components/os/operating-system-dashboard"

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

export default async function HomePage() {
  const [kmz, clients, tasks, documents, externalProperties] = await Promise.all([
    countRows("kmz_collection", (query) => query.eq("is_active", true)),
    countRows("clients"),
    countRows("tasks"),
    countRows("documents"),
    countRows("properties_external"),
  ])

  return (
    <OperatingSystemDashboard
      metrics={[
        { label: "Campos activos", value: kmz, href: "/campos", note: "KMZ canónicos activos." },
        { label: "Clientes", value: clients, href: "/clientes", note: "Registros de clientes." },
        { label: "Tareas", value: tasks, href: "/gestion-tareas", note: "Tareas registradas." },
        { label: "Documentos", value: documents, href: "/documentacion", note: "Evidencia documental." },
        { label: "Mercado", value: externalProperties, href: "/mercado", note: "Propiedades externas." },
      ]}
    />
  )
}
