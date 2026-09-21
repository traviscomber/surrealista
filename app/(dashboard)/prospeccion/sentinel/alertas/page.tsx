"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Loader2, Radar, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { APP_TIME_ZONE } from "@/lib/timezone"

type AttentionItem = {
  rol: string
  commune: string
  geometryMode: string
  observationCount: number
  latestPeriod: string | null
  latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
  severityScore: number
  anomaly: {
    level: "watch" | "strong"
    direction: "above" | "below" | "similar" | "insufficient_data"
    latestNdvi: number | null
    seasonalBaselineNdvi: number | null
    ndviDelta: number | null
    latestNdmi: number | null
    seasonalBaselineNdmi: number | null
    ndmiDelta: number | null
    baselineCount: number
    interpretation: string
  }
}

type AttentionResponse = {
  monitoredRols: number
  actionableCount: number
  strongCount: number
  watchCount: number
  insufficientCount: number
  generatedAt: string
  items: AttentionItem[]
  methodology: {
    signal: string
    strongThreshold: string
    watchThreshold: string
    guardrail: string
  }
}

function signed(value: number | null) {
  if (value == null) return "—"
  return `${value > 0 ? "+" : ""}${value.toFixed(3)}`
}

function dateLabel(value: string | null) {
  if (!value) return "Sin fecha"
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-CL", {
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(parsed)
}

export default function SentinelAttentionPage() {
  const [data, setData] = useState<AttentionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/prospeccion/sentinel-attention", { cache: "no-store" })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "No se pudo cargar la memoria Sentinel.")
        if (active) setData(body)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la memoria Sentinel.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6">
      <Button asChild variant="ghost"><Link href="/prospeccion"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a Prospección</Link></Button>

      <WorkspaceHeading
        eyebrow="Prospección · Memoria Sentinel-2"
        title="Cambios que requieren atención"
        description="Prioriza ROL cuyo comportamiento espectral se aleja de su propia referencia estacional persistida. Esto indica cambio; no explica la causa."
        outcome="Resultado: una cola corta para investigar primero los cambios fuertes y luego los casos a vigilar."
      />

      {loading ? <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Leyendo memoria Sentinel…</Card> : null}
      {error ? <Card className="p-6 text-sm text-destructive">{error}</Card> : null}

      {data ? <>
        <section className="grid gap-3 md:grid-cols-4">
          <Card className="p-5"><p className="text-xs text-muted-foreground">ROL monitoreados</p><p className="mt-2 text-3xl font-medium">{data.monitoredRols}</p></Card>
          <Card className="p-5"><p className="text-xs text-muted-foreground">Requieren atención</p><p className="mt-2 text-3xl font-medium">{data.actionableCount}</p></Card>
          <Card className="p-5"><p className="text-xs text-muted-foreground">Cambio fuerte</p><p className="mt-2 text-3xl font-medium">{data.strongCount}</p></Card>
          <Card className="p-5"><p className="text-xs text-muted-foreground">Vigilar</p><p className="mt-2 text-3xl font-medium">{data.watchCount}</p></Card>
        </section>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-medium">Cómo leer esta cola</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Sólo aparecen ROL con una desviación NDVI relevante respecto de meses comparables de su propia historia. “Cambio fuerte” comienza en |ΔNDVI| 0,15 y “vigilar” en 0,08. No equivale a estrés hídrico, pérdida productiva ni cambio de especie.</p>
            </div>
          </div>
        </Card>

        {data.items.length ? <section className="space-y-3">
          {data.items.map((item) => <Card key={`${item.rol}-${item.latestPeriod}`} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.anomaly.level === "strong" ? "destructive" : "outline"}>{item.anomaly.level === "strong" ? "Cambio fuerte" : "Vigilar"}</Badge>
                  <span className="text-sm font-medium">ROL {item.rol}</span>
                  <span className="text-sm text-muted-foreground">{item.commune || "Comuna no informada"}</span>
                </div>
                <p className="max-w-3xl text-sm leading-6">{item.anomaly.interpretation}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>Último período: {dateLabel(item.latestPeriod)}</span>
                  <span>{item.observationCount} meses persistidos</span>
                  <span>{item.geometryMode === "ciren_polygon" ? "Polígono CIREN" : "Fallback centroide"}</span>
                  <span>{item.anomaly.baselineCount} períodos comparables</span>
                </div>
              </div>
              <div className="grid min-w-[320px] grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">NDVI</p><p className="mt-1 font-medium">{item.latest.ndvi == null ? "—" : item.latest.ndvi.toFixed(3)}</p></div>
                <div><p className="text-xs text-muted-foreground">NDRE</p><p className="mt-1 font-medium">{item.latest.ndre == null ? "—" : item.latest.ndre.toFixed(3)}</p></div>
                <div><p className="text-xs text-muted-foreground">NDMI</p><p className="mt-1 font-medium">{item.latest.ndmi == null ? "—" : item.latest.ndmi.toFixed(3)}</p></div>
                <div><p className="text-xs text-muted-foreground">Δ NDVI</p><p className="mt-1 font-medium">{signed(item.anomaly.ndviDelta)}</p></div>
                <div><p className="text-xs text-muted-foreground">Δ NDMI</p><p className="mt-1 font-medium">{signed(item.anomaly.ndmiDelta)}</p></div>
                <div className="col-span-3"><Button asChild size="sm" variant="outline"><Link href="/prospeccion/sentinel"><Radar className="h-4 w-4" aria-hidden="true" />Abrir lectura Sentinel</Link></Button></div>
              </div>
            </div>
          </Card>)}
        </section> : <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">No hay cambios espectrales que superen los umbrales de atención.</p>
          <p className="mt-1 text-sm text-muted-foreground">La memoria seguirá creciendo a medida que se analicen más ROL y meses comparables.</p>
        </Card>}
      </> : null}
    </main>
  )
}
