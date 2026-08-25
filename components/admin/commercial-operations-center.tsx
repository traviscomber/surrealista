import Link from 'next/link'
import { AlertTriangle, ArrowRight, Building2, Clock3, Eye, Target } from 'lucide-react'
import { getAdminClient } from '@/lib/scrapers/base-scraper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function loadOperations() {
  const db = getAdminClient()
  const now = new Date().toISOString()
  const [properties, watchlist, alerts, tasks] = await Promise.all([
    db.from('properties_external').select('id,title,commune,region,price_clp,area_m2,source,scraped_at').eq('is_active', true).order('scraped_at', { ascending: false }).limit(12),
    db.from('valuation_watchlist').select('id,label,last_price,last_confidence,last_checked_at').eq('active', true).order('updated_at', { ascending: false }).limit(12),
    db.from('valuation_watchlist_alerts').select('id,title,severity,created_at,watchlist_id').eq('acknowledged', false).order('created_at', { ascending: false }).limit(12),
    db.from('tasks').select('id,status,due_date').neq('status', 'completed'),
  ])
  return {
    properties: properties.data ?? [],
    watchlist: watchlist.data ?? [],
    alerts: alerts.data ?? [],
    openTasks: tasks.data?.length ?? 0,
    overdueTasks: (tasks.data ?? []).filter((row: any) => row.due_date && row.due_date < now).length,
    warnings: [properties.error, watchlist.error, alerts.error, tasks.error].filter(Boolean).map((e: any) => e.message),
  }
}

export async function CommercialOperationsCenter() {
  const data = await loadOperations()
  const staleWatch = data.watchlist.filter((row: any) => !row.last_checked_at || Date.now() - Date.parse(row.last_checked_at) > 7 * 86_400_000)
  const metrics = [
    { label: 'Campos recientes', value: data.properties.length, icon: Building2 },
    { label: 'En seguimiento', value: data.watchlist.length, icon: Eye },
    { label: 'Alertas abiertas', value: data.alerts.length, icon: AlertTriangle },
    { label: 'Tareas vencidas', value: data.overdueTasks, icon: Clock3 },
  ]

  return <div className="space-y-6">
    {data.warnings.length ? <div className="border p-4 text-sm"><b>Operando con información parcial.</b><p className="mt-1 text-muted-foreground">{data.warnings.join(' · ')}</p></div> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(({label,value,icon:Icon})=><Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-3xl font-semibold">{value}</div></CardContent></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Próximas decisiones</CardTitle></CardHeader><CardContent className="space-y-3">
        <Action href="/cotizador" title={`${staleWatch.length} terrenos requieren revisión`} detail="Actualizar valor, mercado y contexto antes de una decisión comercial." />
        <Action href="/cotizador" title={`${data.alerts.length} alertas de seguimiento`} detail="Revisar variaciones de precio, confianza y nueva evidencia de mercado." />
        <Action href="/gestion-tareas" title={`${data.overdueTasks} tareas vencidas`} detail="Resolver seguimientos atrasados antes de abrir nuevas gestiones." />
        <Action href="/admin/dashboard?tab=properties" title={`${data.properties.length} campos recientes`} detail="Revisar inventario recién capturado y calidad de datos." />
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Alertas recientes</CardTitle></CardHeader><CardContent className="space-y-3">{data.alerts.length ? data.alerts.map((alert:any)=><div key={alert.id} className="border-b pb-3 text-sm"><p className="font-medium">{alert.title}</p><p className="mt-1 text-xs text-muted-foreground">{alert.severity} · {new Date(alert.created_at).toLocaleDateString('es-CL')}</p></div>) : <p className="text-sm text-muted-foreground">Sin alertas abiertas.</p>}</CardContent></Card>
    </div>
  </div>
}

function Action({href,title,detail}:{href:string;title:string;detail:string}) {
  return <Link href={href} className="flex items-start gap-3 border p-3 hover:bg-muted/50"><Target className="mt-0.5 h-4 w-4"/><div className="flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><ArrowRight className="h-4 w-4"/></Link>
}
