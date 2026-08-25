import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { getRealOpportunity } from '@/lib/home-spotter/opportunities'
import { HomeSpotterSaveButton } from '@/components/portal/home-spotter-save-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function formatClp(value: number | null | undefined) {
  return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value || 0)
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const opp:any = await getRealOpportunity(id)
  if (!opp) notFound()
  const nearby = opp.nearby_intelligence ?? {}
  const kmzClose = (nearby.kmz_neighbors ?? []).filter((x:any)=>x.distance_km != null && x.distance_km <= 5)
  const marketClose = (nearby.market_neighbors ?? []).filter((x:any)=>x.distance_km != null && x.distance_km <= 5)

  return <main className="container mx-auto space-y-6 px-4 py-8">
    <Link href="/home-spotter" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a oportunidades</Link>
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div><div className="flex flex-wrap gap-2"><Badge>{opp.opportunity_score}/100</Badge><Badge variant="outline">{opp.discount_pct}% bajo benchmark</Badge><Badge variant="secondary">Confianza {opp.confidence}%</Badge></div><h1 className="mt-3 text-3xl font-medium">{opp.title}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/>{[opp.address,opp.commune,opp.region].filter(Boolean).join(' · ')}</p></div>
      <div className="flex gap-2"><HomeSpotterSaveButton opportunity={opp}/>{opp.source_url?<Button asChild variant="outline"><a href={opp.source_url} target="_blank" rel="noreferrer">Ver aviso <ExternalLink className="ml-2 h-4 w-4"/></a></Button>:null}</div>
    </div>

    <div className="grid gap-4 md:grid-cols-4"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Precio publicado</p><p className="mt-1 text-xl font-medium">{formatClp(opp.price_clp)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Benchmark estimado</p><p className="mt-1 text-xl font-medium">{formatClp(opp.benchmark.estimated_value_clp)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Superficie</p><p className="mt-1 text-xl font-medium">{opp.area_m2?.toLocaleString('es-CL')} m²</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Brecha</p><p className="mt-1 text-xl font-medium">{formatClp(Math.max(0,(opp.benchmark.estimated_value_clp||0)-opp.price_clp))}</p></CardContent></Card></div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Evidencia de mercado</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>Benchmark <b>{opp.benchmark.basis === 'commune' ? 'comunal' : 'regional'}</b>: {formatClp(opp.benchmark.price_per_m2_clp)}/m².</p><p>{opp.benchmark.sample_count} comparables desde {opp.benchmark.source_count} fuentes. Aviso observado hace {opp.age_days} días.</p><div className="space-y-2">{opp.signals?.map((s:string)=><div key={s} className="rounded-md border p-3">{s}</div>)}</div>{opp.description?<p className="pt-2 leading-6 text-muted-foreground">{opp.description}</p>:null}</CardContent></Card>
      <Card><CardHeader><CardTitle>Territorio y vecinos</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="grid grid-cols-2 gap-3"><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Mercado a ≤5 km</p><p className="mt-1 text-2xl font-medium">{marketClose.length}</p></div><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Puntos/KMZ a ≤5 km</p><p className="mt-1 text-2xl font-medium">{kmzClose.length}</p></div></div><div className="space-y-2">{(nearby.recommendations_for_juan ?? []).map((r:string)=><div key={r} className="rounded-md border p-3">{r}</div>)}</div>{!nearby.kmz_neighbors?.length?<p className="text-muted-foreground">No hay cobertura KMZ cercana; esto no invalida la señal de mercado.</p>:null}</CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Cómo leer esta oportunidad</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">Home Spotter no inventa precio, margen ni tendencia. El score se calcula con el precio publicado frente a comparables reales activos, cantidad/diversidad de evidencia, frescura y calidad del dato. Los KMZ y vecinos se muestran como contexto para revisión interna y no reemplazan la validación comercial, legal o física del predio.</CardContent></Card>
  </main>
}
