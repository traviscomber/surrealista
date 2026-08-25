'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, RefreshCw, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function formatClp(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value || 0)
}

export function HomeSpotterFeed() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState('all')
  const [sort, setSort] = useState('score')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/home-spotter/opportunities?limit=60', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'No se pudieron cargar oportunidades.')
      setItems(body.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar oportunidades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const regions = useMemo(() => Array.from(new Set(items.map(i => i.region).filter(Boolean))).sort(), [items])
  const visible = useMemo(() => {
    let rows = region === 'all' ? items : items.filter(i => i.region === region)
    rows = [...rows]
    if (sort === 'discount') rows.sort((a,b)=>b.discount_pct-a.discount_pct)
    else if (sort === 'recent') rows.sort((a,b)=>a.age_days-b.age_days)
    else rows.sort((a,b)=>b.opportunity_score-a.opportunity_score)
    return rows
  }, [items, region, sort])

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Calculando oportunidades con mercado real…</div>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
      <div className="min-w-56 flex-1"><label className="mb-2 block text-xs text-muted-foreground">Región</label><Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas ({items.length})</SelectItem>{regions.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
      <div className="min-w-52 flex-1"><label className="mb-2 block text-xs text-muted-foreground">Orden</label><Select value={sort} onValueChange={setSort}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="score">Mejor oportunidad</SelectItem><SelectItem value="discount">Mayor descuento</SelectItem><SelectItem value="recent">Más reciente</SelectItem></SelectContent></Select></div>
      <Button variant="outline" onClick={()=>void load()}><RefreshCw className="mr-2 h-4 w-4"/>Actualizar</Button>
      <div className="pb-2 text-xs text-muted-foreground">{visible.length} oportunidades</div>
    </div>

    {error ? <Card className="p-5 text-sm text-destructive">{error}</Card> : null}
    {!error && !visible.length ? <Card className="p-8 text-center text-sm text-muted-foreground">No hay avisos con evidencia suficiente y al menos 3% bajo su benchmark actual.</Card> : null}

    <div className="space-y-3">
      {visible.map(opp => <Link key={opp.id} href={`/home-spotter/opportunities/${opp.id}`} className="block">
        <Card className="p-5 transition-colors hover:bg-muted/30">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={opp.opportunity_score >= 75 ? 'default' : 'secondary'}>{opp.opportunity_score}/100</Badge>
                <Badge variant="outline" className="gap-1"><TrendingDown className="h-3 w-3"/>{opp.discount_pct}% bajo benchmark</Badge>
                <span className="text-xs text-muted-foreground">confianza {opp.confidence}%</span>
              </div>
              <h3 className="mt-3 text-lg font-medium">{opp.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/>{[opp.commune,opp.region].filter(Boolean).join(' · ') || 'Ubicación pendiente'}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span><b>{formatClp(opp.price_clp)}</b> publicado</span>
                <span>{opp.area_m2?.toLocaleString('es-CL')} m²</span>
                <span>{formatClp(opp.price_per_m2_clp)}/m²</span>
                <span>{opp.benchmark.sample_count} comparables</span>
                <span>{opp.benchmark.source_count} fuentes</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Benchmark {opp.benchmark.basis === 'commune' ? 'comunal' : 'regional'}: {formatClp(opp.benchmark.estimated_value_clp)} · aviso {opp.age_days === 0 ? 'de hoy' : `hace ${opp.age_days} días`}</p>
            </div>
            <div className="shrink-0 text-left lg:text-right"><p className="text-xs text-muted-foreground">Brecha estimada</p><p className="mt-1 text-xl font-medium">{formatClp(Math.max(0,(opp.benchmark.estimated_value_clp||0)-opp.price_clp))}</p><p className="mt-1 text-xs text-muted-foreground">{opp.source}</p></div>
          </div>
        </Card>
      </Link>)}
    </div>
    <p className="text-xs text-muted-foreground">Home Spotter usa avisos reales de mercado. El score combina descuento frente al benchmark, cantidad y diversidad de comparables, frescura y calidad del dato. La ficha de cada oportunidad agrega vecinos y KMZ.</p>
  </div>
}
