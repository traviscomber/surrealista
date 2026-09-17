"use client"

import { FormEvent, useMemo, useState } from "react"
import { Loader2, Radar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

type Observation = {
  from: string
  to: string
  ndvi: number | null
  ndre: number | null
  ndmi: number | null
  sampleCount: number
}

type Temporal = {
  from: string | null
  to: string | null
  peakNdvi: { date: string; value: number } | null
  minimumNdvi: { date: string; value: number } | null
  ndviAmplitude: number | null
  recentNdviTrend: "rising" | "falling" | "stable" | "insufficient_data"
  recentNdviDelta: number | null
  recentNdmiTrend: "rising" | "falling" | "stable" | "insufficient_data"
  recentNdmiDelta: number | null
  seasonalitySignal: "strong" | "moderate" | "weak" | "insufficient_data"
  interpretation: string
}

type Evidence = {
  status: "available" | "unconfigured" | "unavailable"
  observations: Observation[]
  temporal: Temporal
  summary: {
    observationCount: number
    meanNdvi: number | null
    maxNdvi: number | null
    meanNdre: number | null
    meanNdmi: number | null
  }
  classification: {
    state: string
    predictedSpecies: null
    confidence: null
    reason: string
  }
  note: string
}

type ProspectingResponse = {
  satellite?: {
    byRol?: Record<string, Evidence>
  }
}

const WIDTH = 760
const HEIGHT = 220
const PAD_X = 34
const PAD_Y = 22

function dateLabel(value: string) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
}

function numberLabel(value: number | null, digits = 2) {
  return value == null ? "—" : value.toFixed(digits)
}

function trendLabel(value: Temporal["recentNdviTrend"]) {
  if (value === "rising") return "subiendo"
  if (value === "falling") return "bajando"
  if (value === "stable") return "estable"
  return "sin datos suficientes"
}

function pathFor(observations: Observation[], key: "ndvi" | "ndre" | "ndmi") {
  const points = observations
    .map((entry, index) => ({ index, value: entry[key] }))
    .filter((entry): entry is { index: number; value: number } => entry.value != null)
  if (!points.length) return ""
  const min = -0.2
  const max = 1
  const x = (index: number) => PAD_X + (observations.length <= 1 ? 0 : index / (observations.length - 1)) * (WIDTH - PAD_X * 2)
  const y = (value: number) => PAD_Y + (max - value) / (max - min) * (HEIGHT - PAD_Y * 2)
  return points.map((point, i) => `${i === 0 ? "M" : "L"}${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ")
}

function TemporalChart({ observations }: { observations: Observation[] }) {
  if (!observations.length) return <p className="text-sm text-muted-foreground">No hay observaciones temporales válidas.</p>
  const ndviPath = pathFor(observations, "ndvi")
  const ndrePath = pathFor(observations, "ndre")
  const ndmiPath = pathFor(observations, "ndmi")
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 34}`} className="min-w-[680px] w-full" role="img" aria-label="Serie temporal Sentinel-2 de NDVI, NDRE y NDMI">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = PAD_Y + (1 - value) / 1.2 * (HEIGHT - PAD_Y * 2)
          return <g key={value}><line x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} className="stroke-border" strokeWidth="1" /><text x="2" y={y + 4} className="fill-muted-foreground text-[10px]">{value.toFixed(2)}</text></g>
        })}
        <path d={ndviPath} fill="none" className="stroke-primary" strokeWidth="3" />
        <path d={ndrePath} fill="none" className="stroke-foreground" strokeWidth="2" strokeDasharray="7 5" opacity="0.8" />
        <path d={ndmiPath} fill="none" className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="2 5" />
        {observations.map((entry, index) => {
          if (index !== 0 && index !== observations.length - 1 && index % 2 !== 0) return null
          const x = PAD_X + (observations.length <= 1 ? 0 : index / (observations.length - 1)) * (WIDTH - PAD_X * 2)
          return <text key={`${entry.from}-${index}`} x={x} y={HEIGHT + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">{dateLabel(entry.from)}</text>
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground"><span><b className="text-foreground">NDVI</b> línea continua</span><span><b className="text-foreground">NDRE</b> línea segmentada</span><span><b className="text-foreground">NDMI</b> línea punteada</span></div>
    </div>
  )
}

export default function SentinelTemporalPage() {
  const [rol, setRol] = useState("507-45")
  const [region, setRegion] = useState("Maule")
  const [commune, setCommune] = useState("Curicó")
  const [species, setSpecies] = useState("Cerezo")
  const [minHa, setMinHa] = useState("15")
  const [maxHa, setMaxHa] = useState("80")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<Evidence | null>(null)

  const sortedObservations = useMemo(() => [...(evidence?.observations ?? [])].sort((a, b) => a.from.localeCompare(b.from)), [evidence?.observations])

  async function run(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ region, commune, species, minHa, maxHa, limit: "60" })
      const response = await fetch(`/api/prospeccion?${params.toString()}`, { cache: "no-store" })
      const body = await response.json() as ProspectingResponse & { error?: string }
      if (!response.ok) throw new Error(body.error || "No se pudo ejecutar la prospección.")
      const next = body.satellite?.byRol?.[rol.trim()] ?? null
      if (!next) throw new Error(`El ROL ${rol.trim()} no quedó dentro de los tres prospectos prioritarios enriquecidos por Sentinel-2.`)
      setEvidence(next)
    } catch (cause) {
      setEvidence(null)
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la serie Sentinel-2.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6">
      <WorkspaceHeading eyebrow="Prospección · Sentinel-2" title="Comportamiento espectral en el tiempo" description="Lee vigor, clorofila y humedad como una serie temporal. La curva sirve para comparar comportamiento fenológico y detectar anomalías; no identifica una especie por sí sola." outcome="Resultado: curva NDVI + NDRE + NDMI, pico, amplitud, tendencia reciente y señal de estacionalidad." />

      <form onSubmit={run} className="grid gap-3 border-y border-border bg-card p-5 md:grid-cols-3 xl:grid-cols-6">
        <Input value={rol} onChange={(event) => setRol(event.target.value)} placeholder="ROL" aria-label="ROL" />
        <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Región" aria-label="Región" />
        <Input value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Comuna" aria-label="Comuna" />
        <Input value={species} onChange={(event) => setSpecies(event.target.value)} placeholder="Especie objetivo" aria-label="Especie objetivo" />
        <div className="grid grid-cols-2 gap-2"><Input value={minHa} onChange={(event) => setMinHa(event.target.value)} placeholder="Mín. ha" aria-label="Mínimo hectáreas" /><Input value={maxHa} onChange={(event) => setMaxHa(event.target.value)} placeholder="Máx. ha" aria-label="Máximo hectáreas" /></div>
        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}Analizar</Button>
      </form>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {evidence ? <>
        <section className="grid gap-3 md:grid-cols-5">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 text-sm font-medium">{evidence.status === "available" ? "Sentinel-2 activo" : evidence.status}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Observaciones</p><p className="mt-1 text-2xl font-medium">{evidence.summary.observationCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdvi)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDRE medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdre)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDMI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdmi)}</p></Card>
        </section>

        <Card className="p-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Serie anual</p><h2 className="mt-1 text-xl font-medium">ROL {rol}</h2></div><div className="flex flex-wrap gap-2"><Badge variant="outline">vigor {trendLabel(evidence.temporal.recentNdviTrend)}</Badge><Badge variant="outline">estacionalidad {evidence.temporal.seasonalitySignal}</Badge></div></div>
          <div className="mt-5"><TemporalChart observations={sortedObservations} /></div>
        </Card>

        <section className="grid gap-3 md:grid-cols-4">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Pico NDVI</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.peakNdvi?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">{evidence.temporal.peakNdvi ? dateLabel(evidence.temporal.peakNdvi.date) : "—"}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Mínimo NDVI</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.minimumNdvi?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">{evidence.temporal.minimumNdvi ? dateLabel(evidence.temporal.minimumNdvi.date) : "—"}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Amplitud anual</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.ndviAmplitude)}</p><p className="mt-1 text-xs text-muted-foreground">Diferencia entre máximo y mínimo de vigor.</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Cambio NDVI reciente</p><p className="mt-1 text-lg font-medium">{evidence.temporal.recentNdviDelta == null ? "—" : `${evidence.temporal.recentNdviDelta > 0 ? "+" : ""}${evidence.temporal.recentNdviDelta.toFixed(3)}`}</p><p className="mt-1 text-xs text-muted-foreground">Últimos dos intervalos válidos.</p></Card>
        </section>

        <Card className="p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lectura operativa</p><p className="mt-3 max-w-5xl text-sm leading-6">{evidence.temporal.interpretation}</p><p className="mt-3 text-xs text-muted-foreground">{evidence.classification.reason}</p></Card>
      </> : null}
    </main>
  )
}
