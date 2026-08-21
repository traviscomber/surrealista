import Link from "next/link"
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, Target, UserRound } from "lucide-react"
import { getAdminClient } from "@/lib/scrapers/base-scraper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ExternalProperty = {
  id: string
  title: string
  source: string
  region: string | null
  commune: string | null
  price_clp: number | null
  price_uf: number | null
  area_m2: number | null
  contact_name: string | null
  contact_phone: string | null
  source_url: string | null
  scraped_at: string | null
}

type Opportunity = {
  id: string
  status: string | null
  owner_name: string | null
  assigned_to: string | null
  last_activity_at: string | null
}

type Task = {
  id: string
  status: string | null
  due_date: string | null
}

const ACTIVE_OPPORTUNITY_STATUSES = ["lead", "contact", "viewing", "offer", "negotiation"]

function propertyQuality(row: ExternalProperty) {
  const checks = [row.region || row.commune, row.price_clp || row.price_uf, row.area_m2, row.contact_name || row.contact_phone, row.source_url]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function formatPrice(row: ExternalProperty) {
  if (row.price_uf) return `UF ${Number(row.price_uf).toLocaleString("es-CL")}`
  if (row.price_clp) return `$${Number(row.price_clp).toLocaleString("es-CL")}`
  return "Precio pendiente"
}

async function loadOperations() {
  const supabase = getAdminClient()
  const now = new Date().toISOString()

  const [propertiesResult, propertiesCountResult, opportunitiesResult, tasksResult] = await Promise.all([
    supabase
      .from("properties_external")
      .select("id, title, source, region, commune, price_clp, price_uf, area_m2, contact_name, contact_phone, source_url, scraped_at")
      .eq("is_active", true)
      .order("scraped_at", { ascending: false, nullsFirst: false })
      .limit(12),
    supabase.from("properties_external").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("opportunities").select("id, status, owner_name, assigned_to, last_activity_at"),
    supabase.from("tasks").select("id, status, due_date").neq("status", "completed"),
  ])

  const properties = (propertiesResult.data ?? []) as ExternalProperty[]
  const opportunities = (opportunitiesResult.data ?? []) as Opportunity[]
  const tasks = (tasksResult.data ?? []) as Task[]
  const warnings = [propertiesResult.error, propertiesCountResult.error, opportunitiesResult.error, tasksResult.error]
    .filter(Boolean)
    .map((error) => error?.message ?? "Fuente no disponible")

  return {
    properties,
    propertyCount: propertiesCountResult.count ?? properties.length,
    activeOpportunities: opportunities.filter((row) => !row.status || ACTIVE_OPPORTUNITY_STATUSES.includes(row.status)),
    opportunitiesWithoutOwner: opportunities.filter((row) => !row.owner_name).length,
    opportunitiesWithoutAssignee: opportunities.filter((row) => !row.assigned_to).length,
    openTasks: tasks.length,
    overdueTasks: tasks.filter((row) => row.due_date && row.due_date < now).length,
    warnings,
  }
}

export async function CommercialOperationsCenter() {
  const data = await loadOperations()
  const incompleteProperties = data.properties.filter((row) => propertyQuality(row) < 80)

  const metrics = [
    { label: "Campos activos", value: data.propertyCount, detail: `${incompleteProperties.length} recientes incompletos`, icon: Building2 },
    { label: "Oportunidades activas", value: data.activeOpportunities.length, detail: `${data.opportunitiesWithoutOwner} sin propietario`, icon: Target },
    { label: "Sin responsable", value: data.opportunitiesWithoutAssignee, detail: "Requieren asignación", icon: UserRound },
    { label: "Tareas abiertas", value: data.openTasks, detail: `${data.overdueTasks} vencidas`, icon: Clock3 },
  ]

  return (
    <div className="space-y-6">
      {data.warnings.length > 0 ? (
        <div className="flex gap-3 border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">El centro está operando con información parcial.</p>
            <p className="mt-1 text-muted-foreground">{data.warnings.join(" · ")}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{value.toLocaleString("es-CL")}</div>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Campos recién detectados</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Prioriza los registros con información suficiente para iniciar gestión comercial.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard?tab=properties">Ver inventario</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.properties.slice(0, 8).map((row) => {
                const quality = propertyQuality(row)
                return (
                  <div key={row.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{row.commune || row.region || "Ubicación pendiente"} · {row.source}</p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-medium tabular-nums">{formatPrice(row)}</p>
                      <p className="text-xs text-muted-foreground">{row.area_m2 ? `${Number(row.area_m2).toLocaleString("es-CL")} m²` : "Superficie pendiente"}</p>
                    </div>
                    <Badge variant={quality >= 80 ? "secondary" : "outline"} className="w-fit tabular-nums">
                      {quality}% completo
                    </Badge>
                  </div>
                )
              })}
              {data.properties.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No hay campos activos para revisar.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas decisiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionRow
              urgent={data.overdueTasks > 0}
              title={`${data.overdueTasks} tareas vencidas`}
              description="Resolver seguimientos antes de abrir nuevas gestiones."
              href="/gestion-tareas"
            />
            <ActionRow
              urgent={data.opportunitiesWithoutOwner > 0}
              title={`${data.opportunitiesWithoutOwner} oportunidades sin propietario`}
              description="Completar identidad y evidencia de contacto."
              href="/admin/owner-discovery"
            />
            <ActionRow
              urgent={incompleteProperties.length > 0}
              title={`${incompleteProperties.length} campos recientes incompletos`}
              description="Revisar ubicación, precio, superficie y contacto."
              href="/admin/dashboard?tab=properties"
            />
            <ActionRow
              urgent={false}
              title="Mercado Inciti actualizado"
              description="Usar las métricas guardadas como contexto de evaluación."
              href="/admin/inciti-market"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ActionRow({ urgent, title, description, href }: { urgent: boolean; title: string; description: string; href: string }) {
  const Icon = urgent ? AlertTriangle : CheckCircle2
  return (
    <Link href={href} className="group flex items-start gap-3 border p-3 transition-colors hover:bg-muted/50">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${urgent ? "text-amber-600" : "text-emerald-600"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
