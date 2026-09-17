"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { ArrowLeft, Loader2, Radar } from "lucide-react"

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
  annualVariationSignal: "high" | "moderate" | "low" | "insufficient_data"
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

type DiagnosticResult = {
  rol: string
  commune: string
  areaHa: number | null
  declaredSpecies: string[]
  satellite: Evidence
}

type DiagnosticResponse = {
  results?: DiagnosticResult[]
  error?: string
  availableRols?: string[]
}

const WIDTH = 760
const HEIGHT = 220
const PAD_X = 34
const PAD_Y = 22

function dateLabel(value: string) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
}

function fullDateLabel(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
}

function numberLabel(value: number | null, digits = 2) {
  return value == null ? "—" : value.toFixed(digits)
}

function trendLabel(value: Temporal["recentNdviTrend"]) {
  if (value === "rising") return "aumenta"
  if (value === "falling") return "disminuye"
  if (value === "stable") return "cambia poco"
  return "sin datos suficientes"
}

function variationLabel(value: Temporal["annualVariationSignal"]) {
  if (value === "high") return "alta"
  if (value === "moderate") return "moderada"
  if (value === "low") return "baja"
  return "sin datos suficientes"
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function xScale(observations: Observation[]) {
  const dates = observations.map((entry) => timestamp(entry.from)).filter((value): value is number => value != null)
  const min = dates.length ? Math.min(...dates) : 0
  const max = dates.length ? Math.max(...dates) : min
  return (value: string) => {
    const current = timestamp(value)
    if (current == null || max === min) return PAD_X
    return PAD_X + ((current - min) / (max - min)) * (WIDTH - PAD_X * 2)
  }
}

function pathFor(observations: Observation[], key: "ndvi" | "ndre" | "ndmi") {
  const x = xScale(observations)
  const min = -0.2
  const max = 1
  const y = (value: number) => PAD_Y + ((max - value) / (max - min)) * (HEIGHT - PAD_Y * 2)
  const points = observations
    .map((entry) => ({ date: entry.from, value: entry[key] }))
    .filter((entry): entry is { date: string; value: number } => entry.value != null && timestamp(entry.date) != null)
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.date).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ")
}

function TemporalChart({ observations }: { observations: Observation[] }) {
  if (!observations.length) return <p className="text-sm text-muted-foreground">No hay observaciones temporales válidas para dibujar.</p>
  const x = xScale(observations)
  const ndviPath = pathFor(observations, "ndvi")
  const ndrePath = pathFor(observations, "ndre")
  const ndmiPath = pathFor(observations, "ndmi")

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 34}`} className="min-w-[680px] w-full" role="img" aria-label="Serie temporal Sentinel-2 de NDVI, NDRE y NDMI con eje proporcional a las fechas reales">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = PAD_Y + ((1 - value) / 1.2) * (HEIGHT - PAD_Y * 2)
          return <g key={value}><line x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} className="stroke-border" strokeWidth="1" /><text x="2" y={y + 4} className="fill-muted-foreground text-[10px]">{value.toFixed(2)}</text></g>
        })}
        <path d={ndviPath} fill="none" className="stroke-primary" strokeWidth="3" />
        <path d={ndrePath} fill="none" className="stroke-foreground" strokeWidth="2" strokeDasharray="7 5" opacity="0.8" />
        <path d={ndmiPath} fill="none" className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="2 5" />
        {observations.map((entry, index) => {
          if (index !== 0 && index !== observations.length - 1 && index % 2 !== 0) return null
          return <text key={`${entry.from}-${index}`} x={x(entry.from)} y={HEIGHT + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">{dateLabel(entry.from)}</text>
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><b className="text-foreground">NDVI</b> actividad/cobertura vegetal</span>
        <span><b className="text-foreground">NDRE</b> respuesta red-edge de la vegetación</span>
        <span><b className="text-foreground">NDMI</b> señal espectral asociada a contenido de agua</span>
      </div>
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
  const [result, setResult] = useState<DiagnosticResult | null>(null)

  const evidence = result?.satellite ?? null
  const sortedObservations = useMemo(() => [...(evidence?.observations ?? [])].sort((a, b) => a.from.localeCompare(b.from)), [evidence?.observations])

  async function run(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const cleanRol = rol.trim()
      if (!cleanRol) throw new Error("Ingresa un ROL para analizar.")
      const params = new URLSearchParams({ rol: cleanRol, region, commune, species, minHa, maxHa, limit: "100" })
      const response = await fetch(`/api/prospeccion/sentinel-diagnostics?${params.toString()}`, { cache: "no-store" })
      const body = await response.json() as DiagnosticResponse
      if (!response.ok) {
        const options = body.availableRols?.length ? ` ROL disponibles con estos filtros: ${body.availableRols.join(", ")}.` : ""
        throw new Error(`${body.error || "No se pudo ejecutar el análisis Sentinel-2."}${options}`)
      }
      const next = body.results?.[0] ?? null
      if (!next) throw new Error(`No encontramos evidencia Sentinel-2 para el ROL ${cleanRol}.`)
      setResult(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la serie Sentinel-2.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6">
      <div><Button asChild variant="ghost" className="mb-2"><Link href="/prospeccion"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a Prospección</Link></Button></div>
      <WorkspaceHeading eyebrow="Prospección · Sentinel-2" title="Qué está haciendo la vegetación en este ROL" description="Compara cómo cambian tres señales satelitales durante el último año. Úsalas para ver comportamiento y cambios; no para declarar por sí solas especie, calidad del campo, riego o estrés hídrico." outcome="Resultado: una lectura temporal simple, con fechas reales y límites explícitos." />

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cómo leer esta pantalla</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div><p className="text-sm font-medium">NDVI · actividad vegetal</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Muestra cuánto cambia la respuesta de vegetación. Un número mayor no significa automáticamente “mejor campo”. Lo importante es su evolución en el mismo ROL.</p></div>
          <div><p className="text-sm font-medium">NDRE · respuesta red-edge</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Complementa NDVI cuando hay vegetación densa. Ayuda a comparar cambios del dosel, pero por sí solo no diagnostica nutrición ni calidad.</p></div>
          <div><p className="text-sm font-medium">NDMI · señal asociada al agua</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Permite observar cambios espectrales relacionados con contenido de agua. No demuestra riego, disponibilidad de agua ni estrés hídrico sin evidencia adicional.</p></div>
        </div>
      </Card>

      <form onSubmit={run} className="grid gap-3 border-y border-border bg-card p-5 md:grid-cols-3 xl:grid-cols-6">
        <div><label className="mb-1.5 block text-xs text-muted-foreground">ROL</label><Input value={rol} onChange={(event) => setRol(event.target.value)} placeholder="507-45" /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Región</label><Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Maule" /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Comuna</label><Input value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Curicó" /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Especie buscada</label><Input value={species} onChange={(event) => setSpecies(event.target.value)} placeholder="Cerezo" /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Superficie</label><div className="grid grid-cols-2 gap-2"><Input value={minHa} onChange={(event) => setMinHa(event.target.value)} placeholder="Mín." aria-label="Mínimo hectáreas" /><Input value={maxHa} onChange={(event) => setMaxHa(event.target.value)} placeholder="Máx." aria-label="Máximo hectáreas" /></div></div>
        <div className="flex items-end"><Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}Analizar ROL</Button></div>
      </form>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {result && evidence ? <>
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Qué sabemos</p><h2 className="mt-1 text-2xl font-medium">ROL {result.rol}</h2><p className="mt-1 text-sm text-muted-foreground">{result.commune}{result.areaHa != null ? ` · ${result.areaHa.toLocaleString("es-CL")} ha` : ""}{result.declaredSpecies.length ? ` · CIREN declara ${result.declaredSpecies.join(" / ")}` : ""}</p></div>
            <div className="flex flex-wrap gap-2"><Badge>{evidence.status === "available" ? "Sentinel-2 activo" : evidence.status}</Badge><Badge variant="outline">especie satelital no verificada</Badge></div>
          </div>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-muted-foreground">{evidence.note}</p>
        </Card>

        <section className="grid gap-3 md:grid-cols-5">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Observaciones válidas</p><p className="mt-1 text-2xl font-medium">{evidence.summary.observationCount}</p><p className="mt-1 text-xs text-muted-foreground">intervalos con datos utilizables</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdvi)}</p><p className="mt-1 text-xs text-muted-foreground">actividad vegetal promedio</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDRE medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdre)}</p><p className="mt-1 text-xs text-muted-foreground">respuesta red-edge promedio</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDMI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdmi)}</p><p className="mt-1 text-xs text-muted-foreground">señal espectral asociada al agua</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Período observado</p><p className="mt-1 text-sm font-medium">{fullDateLabel(evidence.temporal.from)}</p><p className="mt-1 text-xs text-muted-foreground">hasta {fullDateLabel(evidence.temporal.to)}</p></Card>
        </section>

        <Card className="p-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cómo cambia en el tiempo</p><h2 className="mt-1 text-xl font-medium">Serie anual del ROL {result.rol}</h2><p className="mt-1 text-sm text-muted-foreground">La distancia horizontal representa tiempo real; si faltan datos entre fechas, el espacio también se ve en la curva.</p></div>
            <div className="flex flex-wrap gap-2"><Badge variant="outline">NDVI reciente {trendLabel(evidence.temporal.recentNdviTrend)}</Badge><Badge variant="outline">variación anual {variationLabel(evidence.temporal.annualVariationSignal)}</Badge></div>
          </div>
          <div className="mt-5"><TemporalChart observations={sortedObservations} /></div>
        </Card>

        <section className="grid gap-3 md:grid-cols-4">
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI máximo</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.peakNdvi?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">intervalo desde {evidence.temporal.peakNdvi ? fullDateLabel(evidence.temporal.peakNdvi.date) : "—"}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI mínimo</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.minimumNdvi?.value ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">intervalo desde {evidence.temporal.minimumNdvi ? fullDateLabel(evidence.temporal.minimumNdvi.date) : "—"}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Variación NDVI</p><p className="mt-1 text-lg font-medium">{numberLabel(evidence.temporal.ndviAmplitude)}</p><p className="mt-1 text-xs text-muted-foreground">máximo menos mínimo; describe rango, no calidad.</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Último cambio NDVI</p><p className="mt-1 text-lg font-medium">{evidence.temporal.recentNdviDelta == null ? "—" : `${evidence.temporal.recentNdviDelta > 0 ? "+" : ""}${evidence.temporal.recentNdviDelta.toFixed(3)}`}</p><p className="mt-1 text-xs text-muted-foreground">diferencia entre los dos últimos intervalos válidos.</p></Card>
        </section>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lectura simple</p>
          <p className="mt-3 max-w-5xl text-sm leading-6">{evidence.temporal.interpretation}</p>
          <div className="mt-5 border-t border-border pt-4"><p className="text-sm font-medium">Qué no podemos concluir todavía</p><p className="mt-1 max-w-5xl text-sm leading-6 text-muted-foreground">Sentinel-2 todavía no confirma que el cultivo sea {species || "la especie buscada"}. Tampoco permite afirmar por sí solo calidad agronómica, riego, derechos de agua o estrés. Para eso necesitamos cruzar esta señal con CIREN, terreno y otras fuentes.</p></div>
        </Card>
      </> : null}
    </main>
  )
}
