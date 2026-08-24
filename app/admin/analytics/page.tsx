import Link from "next/link"
import { BarChart3, CheckSquare, Database, FileText, Folder, Home, Users } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

type Metric = {
  label: string
  value: number | null
  description: string
  icon: typeof BarChart3
  href: string
}

async function countRows(table: string, filter?: (query: any) => any): Promise<number | null> {
  try {
    const supabase = await createClient()
    let query = supabase.from(table).select("*", { count: "exact", head: true })
    if (filter) query = filter(query)
    const { count, error } = await query
    if (error) {
      console.error(`[analytics] count failed for ${table}`, error)
      return null
    }
    return count ?? 0
  } catch (error) {
    console.error(`[analytics] count failed for ${table}`, error)
    return null
  }
}

export default async function AnalyticsPage() {
  const [properties, clients, tasks, kmz, documents, externalProperties] = await Promise.all([
    countRows("properties"),
    countRows("clients"),
    countRows("tasks"),
    countRows("kmz_collection", (query) => query.eq("is_active", true)),
    countRows("documents"),
    countRows("properties_external"),
  ])

  const metrics: Metric[] = [
    { label: "Propiedades", value: properties, description: "Registros actuales en properties.", icon: Home, href: "/propiedades" },
    { label: "Clientes", value: clients, description: "Registros actuales en clients.", icon: Users, href: "/gestion-clientes" },
    { label: "Tareas", value: tasks, description: "Registros actuales en tasks.", icon: CheckSquare, href: "/busqueda?modulo=tareas" },
    { label: "KMZ activos", value: kmz, description: "KMZ con is_active=true en la colección canónica.", icon: Folder, href: "/campos" },
    { label: "Documentos", value: documents, description: "Registros actuales en documents.", icon: FileText, href: "/documentacion" },
    { label: "Comparables externos", value: externalProperties, description: "Registros persistidos en properties_external.", icon: Database, href: "/admin/scrapers" },
  ]

  const unavailable = metrics.filter((metric) => metric.value === null).length

  return (
    <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Datos verificados</p>
        <h1 className="text-3xl font-bold tracking-tight">Analíticas operativas</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Esta vista muestra únicamente conteos obtenidos de las tablas canónicas al cargar la página. No se presentan tendencias, conversiones ni porcentajes sin una fuente analítica verificable.
        </p>
      </header>

      {unavailable > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {unavailable} métrica{unavailable === 1 ? "" : "s"} no pudieron consultarse. Se muestran como “No disponible” en vez de estimar valores.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Métricas canónicas">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{metric.label}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold tabular-nums">
                  {metric.value === null ? "No disponible" : new Intl.NumberFormat("es-CL").format(metric.value)}
                </p>
                <Button asChild variant="outline" size="sm"><Link href={metric.href}>Abrir módulo</Link></Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5" aria-hidden="true" />Política de métricas</CardTitle>
          <CardDescription>Regla aplicada por el gate de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Los gráficos de comportamiento, tráfico, conversión y tendencias se habilitarán únicamente cuando exista una fuente analítica persistida, una ventana temporal definida y una consulta reproducible. Hasta entonces la plataforma no simula resultados.
        </CardContent>
      </Card>
    </main>
  )
}
