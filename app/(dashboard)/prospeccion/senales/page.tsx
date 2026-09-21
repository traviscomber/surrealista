"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CircleAlert, Loader2, Radar, Search, ShieldCheck, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

type Signal = {
  rol: string
  commune: string
  region: string
  address: string | null
  destination: string | null
  priorityScore: number
  priorityBand: "alta" | "media" | "vigilar"
  evidenceConfidence: number
  latestPeriod: string | null
  observationCount: number
  latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
  anomaly: {
    level: "watch" | "strong"
    ndviDelta: number | null
    ndmiDelta: number | null
    interpretation: string
  }
  identity: { status: "complete" | "partial"; cirenStatus: string | null }
  market: { scope: "commune" | "region" | "none"; sampleCount: number; sourceCount: number; periodDate: string | null }
  owner: { status: "candidate" | "pending" | "not_researched"; name: string | null; confidence: number | null }
  reasons: string[]
  nextAction: string
}

type SignalResponse = {
  generatedAt: string
  monitoredRols: number
  actionableCount: number
  strongCount: number
  watchCount: number
  highPriorityCount: number
  ownerCandidateCount: number
  items: Signal[]
  methodology: {
    purpose: string
    priority: string
    marketGuardrail: string
    satelliteGuardrail: string
  }
}

function delta(value: number | null) {
  if (value == null) return "—"
  return `${value > 0 ? "+" : ""}${value.toFixed(3)}`
}

export default function ProspectingSignalsPage() {
  const [data, setData] = useState<SignalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/prospeccion/signals", { cache: "no-store" })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "No se pudieron cargar las señales.")
        if (active) setData(body)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar las señales.")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6">
      <Button asChild variant="ghost"><Link href="/prospeccion"><ArrowLeft className="h-4 w-4" />Volver a Prospección</Link></Button>

      <WorkspaceHeading
        eyebrow="Prospección · Inteligencia cruzada"
        title="Señales de prospección"
        description="Cruza identidad SII, evidencia CIREN, memoria Sentinel-2, contexto de mercado y estado de investigación del propietario para priorizar qué ROL revisar primero."
        outcome="Resultado: una cola explicable de investigación. La señal no predice intención de venta."
      />

      {loading ? <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Construyendo señales desde las capas canónicas…</Card> : null}
      {error ? <Card className="p-6 text-sm text-destructive">{error}</Card> : null}

      {data ? <>
        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Card className="p-4"><p className="text-xs text-muted-foreground">ROL monitoreados</p><p className="mt-1 text-2xl font-medium">{data.monitoredRols}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Con señal</p><p className="mt-1 text-2xl font-medium">{data.actionableCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Cambio fuerte</p><p className="mt-1 text-2xl font-medium">{data.strongCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Vigilar</p><p className="mt-1 text-2xl font-medium">{data.watchCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Prioridad alta</p><p className="mt-1 text-2xl font-medium">{data.highPriorityCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Propietario candidato</p><p className="mt-1 text-2xl font-medium">{data.ownerCandidateCount}</p></Card>
        </section>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5" />
            <div className="space-y-1">
              <p className="font-medium">Qué significa el score</p>
              <p className="text-sm leading-6 text-muted-foreground">{data.methodology.purpose} {data.methodology.priority}</p>
              <p className="text-xs leading-5 text-muted-foreground">{data.methodology.satelliteGuardrail}</p>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          {data.items.map((item, index) => (
            <Card key={item.rol} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{index + 1}</Badge>
                    <Badge variant={item.anomaly.level === "strong" ? "destructive" : "outline"}>
                      {item.anomaly.level === "strong" ? "Cambio fuerte" : "Vigilar"}
                    </Badge>
                    <Badge variant="outline">Prioridad {item.priorityBand} · {item.priorityScore}/100</Badge>
                    <Badge variant="outline">Confianza {item.evidenceConfidence}/100</Badge>
                  </div>

                  <h2 className="mt-4 text-lg font-medium">ROL {item.rol}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[item.commune, item.region].filter(Boolean).join(" · ")}
                    {item.destination ? ` · ${item.destination}` : ""}
                  </p>
                  {item.address ? <p className="mt-1 text-xs text-muted-foreground">{item.address}</p> : null}

                  <p className="mt-4 max-w-4xl text-sm leading-6">{item.anomaly.interpretation}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">CIREN · {item.identity.cirenStatus || "sin enlace"}</Badge>
                    <Badge variant="outline">Sentinel · {item.observationCount} observaciones</Badge>
                    <Badge variant="outline">Mercado · {item.market.sampleCount} muestras / {item.market.sourceCount} fuentes</Badge>
                    <Badge variant="outline">
                      {item.owner.status === "candidate" ? "Propietario candidato" : item.owner.status === "pending" ? "Propietario en validación" : "Propietario no investigado"}
                    </Badge>
                  </div>

                  <div className="mt-4 border-l-2 border-border pl-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Siguiente acción</p>
                    <p className="mt-1 text-sm">{item.nextAction}</p>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Por qué aparece aquí</summary>
                    <ul className="mt-2 space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
                      {item.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  </details>
                </div>

                <div className="grid grid-cols-3 gap-3 self-start">
                  <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI</p><p className="mt-1 text-xl font-medium">{item.latest.ndvi == null ? "—" : item.latest.ndvi.toFixed(3)}</p><p className="mt-1 text-xs text-muted-foreground">Δ {delta(item.anomaly.ndviDelta)}</p></Card>
                  <Card className="p-4"><p className="text-xs text-muted-foreground">NDRE</p><p className="mt-1 text-xl font-medium">{item.latest.ndre == null ? "—" : item.latest.ndre.toFixed(3)}</p><p className="mt-1 text-xs text-muted-foreground">lectura actual</p></Card>
                  <Card className="p-4"><p className="text-xs text-muted-foreground">NDMI</p><p className="mt-1 text-xl font-medium">{item.latest.ndmi == null ? "—" : item.latest.ndmi.toFixed(3)}</p><p className="mt-1 text-xs text-muted-foreground">Δ {delta(item.anomaly.ndmiDelta)}</p></Card>

                  <Card className="col-span-3 p-4">
                    {item.owner.name ? <>
                      <div className="flex items-center gap-2"><UserRound className="h-4 w-4" /><p className="font-medium">{item.owner.name}</p></div>
                      <p className="mt-1 text-xs text-muted-foreground">Candidato · confianza {Math.round((item.owner.confidence || 0) * 100)}% · requiere validación registral.</p>
                    </> : <>
                      <div className="flex items-center gap-2"><Search className="h-4 w-4" /><p className="font-medium">Propietario por resolver</p></div>
                      <p className="mt-1 text-xs text-muted-foreground">La señal puede priorizar investigación, pero no habilita contacto sin identidad suficiente.</p>
                    </>}
                  </Card>
                </div>
              </div>
            </Card>
          ))}

          {!data.items.length ? <Card className="p-8 text-center">
            <CircleAlert className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-medium">No hay señales temporales que superen los umbrales actuales.</p>
            <p className="mt-1 text-sm text-muted-foreground">La memoria Sentinel seguirá evaluándose con cada nueva observación.</p>
          </Card> : null}
        </section>

        <div className="flex justify-end">
          <Button asChild variant="outline"><Link href="/prospeccion/sentinel/alertas"><Radar className="h-4 w-4" />Ver diagnóstico Sentinel puro</Link></Button>
        </div>
      </> : null}
    </main>
  )
}
