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

type BaselineSignal = "large_increase" | "moderate_increase" | "similar" | "moderate_decrease" | "large_decrease" | "insufficient_data"
type AnomalyLevel = "none" | "watch" | "strong" | "insufficient_data"

type Evidence = {
  status: "available" | "unconfigured" | "unavailable"
  geometryMode: "ciren_polygon" | "centroid_fallback"
  observations: Observation[]
  summary: {
    observationCount: number
    meanNdvi: number | null
    maxNdvi: number | null
    meanNdre: number | null
    meanNdmi: number | null
  }
  temporal: {
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
  baseline: {
    latestDate: string | null
    previousYearDate: string | null
    latestNdvi: number | null
    previousYearNdvi: number | null
    ndviDelta: number | null
    latestNdmi: number | null
    previousYearNdmi: number | null
    ndmiDelta: number | null
    signal: BaselineSignal
    interpretation: string
    methodology: string
  }
  classification: {
    state: string
    predictedSpecies: null
    confidence: null
    reason: string
  }
  note: string
}

type SentinelMemory = {
  available: boolean
  persisted: boolean
  rowCount: number
  historyFrom: string | null
  historyTo: string | null
  geometryFingerprint: string
  anomaly: {
    level: AnomalyLevel
    direction: "above" | "below" | "similar" | "insufficient_data"
    latestDate: string | null
    latestNdvi: number | null
    seasonalBaselineNdvi: number | null
    ndviDelta: number | null
    latestNdmi: number | null
    seasonalBaselineNdmi: number | null
    ndmiDelta: number | null
    baselineCount: number
    interpretation: string
    methodology: string
  }
  note: string
}

type DiagnosticResult = {
  rol: string
  commune: string
  areaHa: number | null
  declaredSpecies: string[]
  polygonAvailable: boolean
  satellite: Evidence
  memory: SentinelMemory
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

function dateLabel(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-CL", { month: "short", year: "numeric" })
}

function numberLabel(value: number | null, digits = 2) {
  return value == null ? "—" : value.toFixed(digits)
}

function signed(value: number | null, digits = 3) {
  if (value == null) return "—"
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`
}

function baselineLabel(signal: BaselineSignal) {
  if (signal === "large_increase") return "bastante por encima del año anterior"
  if (signal === "moderate_increase") return "por encima del año anterior"
  if (signal === "large_decrease") return "bastante por debajo del año anterior"
  if (signal === "moderate_decrease") return "por debajo del año anterior"
  if (signal === "similar") return "parecido al año anterior"
  return "sin comparación suficiente"
}

function anomalyLabel(level: AnomalyLevel) {
  if (level === "strong") return "cambio fuerte"
  if (level === "watch") return "vigilar cambio"
  if (level === "none") return "sin anomalía relevante"
  return "historia insuficiente"
}

function trendLabel(value: Evidence["temporal"]["recentNdviTrend"]) {
  if (value === "rising") return "aumenta"
  if (value === "falling") return "disminuye"
  if (value === "stable") return "cambia poco"
  return "sin datos suficientes"
}

function variationLabel(value: Evidence["temporal"]["annualVariationSignal"]) {
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
  return observations
    .map((entry) => ({ date: entry.from, value: entry[key] }))
    .filter((entry): entry is { date: string; value: number } => entry.value != null && timestamp(entry.date) != null)
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.date).toFixed(1)},${y(point.value).toFixed(1)}`)
    .join(" ")
}

function TemporalChart({ observations }: { observations: Observation[] }) {
  if (!observations.length) return <p className="text-sm text-muted-foreground">No hay observaciones válidas para dibujar.</p>
  const x = xScale(observations)
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 34}`} className="min-w-[680px] w-full" role="img" aria-label="Serie temporal Sentinel-2 de NDVI, NDRE y NDMI durante aproximadamente dos años">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = PAD_Y + ((1 - value) / 1.2) * (HEIGHT - PAD_Y * 2)
          return <g key={value}><line x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} className="stroke-border" strokeWidth="1" /><text x="2" y={y + 4} className="fill-muted-foreground text-[10px]">{value.toFixed(2)}</text></g>
        })}
        <path d={pathFor(observations, "ndvi")} fill="none" className="stroke-primary" strokeWidth="3" />
        <path d={pathFor(observations, "ndre")} fill="none" className="stroke-foreground" strokeWidth="2" strokeDasharray="7 5" opacity="0.8" />
        <path d={pathFor(observations, "ndmi")} fill="none" className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="2 5" />
        {observations.map((entry, index) => {
          if (index !== 0 && index !== observations.length - 1 && index % 4 !== 0) return null
          return <text key={`${entry.from}-${index}`} x={x(entry.from)} y={HEIGHT + 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">{dateLabel(entry.from)}</text>
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><b className="text-foreground">NDVI</b> respuesta de vegetación</span>
        <span><b className="text-foreground">NDRE</b> respuesta red-edge</span>
        <span><b className="text-foreground">NDMI</b> señal espectral asociada al agua</span>
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
  const observations = useMemo(() => [...(evidence?.observations ?? [])].sort((a, b) => a.from.localeCompare(b.from)), [evidence?.observations])

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
      <Button asChild variant="ghost"><Link href="/prospeccion"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a Prospección</Link></Button>
      <WorkspaceHeading eyebrow="Prospección · Copernicus Sentinel-2" title="Qué cambió en este campo" description="Compara el mismo ROL en el tiempo, contra su historia guardada y contra un período equivalente del año anterior. Primero mira la conclusión; usa los índices como evidencia, no como diagnóstico agronómico." outcome="Resultado: polígono CIREN cuando está disponible, memoria persistente por ROL y detección de cambios espectrales." />

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Qué significan los índices</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div><p className="text-sm font-medium">NDVI · respuesta de vegetación</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Sirve para comparar cómo cambia la vegetación del mismo ROL. Más alto no significa automáticamente “mejor campo”.</p></div>
          <div><p className="text-sm font-medium">NDRE · respuesta red-edge</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Complementa NDVI cuando el dosel es denso. No diagnostica por sí solo nutrición, producción ni calidad.</p></div>
          <div><p className="text-sm font-medium">NDMI · señal asociada al agua</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Permite observar cambios espectrales relacionados con contenido de agua. No demuestra riego, derechos de agua ni estrés hídrico.</p></div>
        </div>
      </Card>

      <form onSubmit={run} className="grid gap-3 border-y border-border bg-card p-5 md:grid-cols-3 xl:grid-cols-6">
        <div><label className="mb-1.5 block text-xs text-muted-foreground">ROL</label><Input value={rol} onChange={(event) => setRol(event.target.value)} placeholder="507-45" /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Región</label><Input value={region} onChange={(event) => setRegion(event.target.value)} /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Comuna</label><Input value={commune} onChange={(event) => setCommune(event.target.value)} /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Especie buscada</label><Input value={species} onChange={(event) => setSpecies(event.target.value)} /></div>
        <div><label className="mb-1.5 block text-xs text-muted-foreground">Superficie</label><div className="grid grid-cols-2 gap-2"><Input value={minHa} onChange={(event) => setMinHa(event.target.value)} aria-label="Mínimo hectáreas" /><Input value={maxHa} onChange={(event) => setMaxHa(event.target.value)} aria-label="Máximo hectáreas" /></div></div>
        <div className="flex items-end"><Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}Analizar ROL</Button></div>
      </form>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {result && evidence ? <>
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Conclusión primero</p><h2 className="mt-1 text-2xl font-medium">ROL {result.rol}</h2><p className="mt-1 text-sm text-muted-foreground">{result.commune}{result.areaHa != null ? ` · ${result.areaHa.toLocaleString("es-CL")} ha` : ""}{result.declaredSpecies.length ? ` · CIREN declara ${result.declaredSpecies.join(" / ")}` : ""}</p></div>
            <div className="flex flex-wrap gap-2"><Badge>{evidence.status === "available" ? "Sentinel-2 activo" : evidence.status}</Badge><Badge variant="outline">{evidence.geometryMode === "ciren_polygon" ? "polígono CIREN real" : "fallback por centroide"}</Badge><Badge variant="outline">especie satelital no verificada</Badge></div>
          </div>
          <p className="mt-5 text-lg font-medium">NDVI está {baselineLabel(evidence.baseline.signal)}.</p>
          <p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">{evidence.baseline.interpretation}</p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Memoria del ROL</p>
              <h3 className="mt-1 text-xl font-medium">{anomalyLabel(result.memory.anomaly.level)}</h3>
              <p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">{result.memory.anomaly.interpretation}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{result.memory.rowCount} períodos guardados</Badge>
              <Badge variant="outline">{result.memory.anomaly.baselineCount} referencias estacionales</Badge>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">NDVI actual</p><p className="mt-1 text-lg font-medium">{numberLabel(result.memory.anomaly.latestNdvi)}</p></div>
            <div><p className="text-xs text-muted-foreground">Referencia histórica</p><p className="mt-1 text-lg font-medium">{numberLabel(result.memory.anomaly.seasonalBaselineNdvi)}</p></div>
            <div><p className="text-xs text-muted-foreground">Diferencia NDVI</p><p className="mt-1 text-lg font-medium">{signed(result.memory.anomaly.ndviDelta)}</p></div>
            <div><p className="text-xs text-muted-foreground">Historia guardada</p><p className="mt-1 text-sm font-medium">{dateLabel(result.memory.historyFrom)} → {dateLabel(result.memory.historyTo)}</p></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">La memoria usa el mismo ROL y la misma geometría. Repetir una consulta actualiza el período existente; no duplica observaciones.</p>
        </Card>

        <section className="grid gap-3 md:grid-cols-4">
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI ahora</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.baseline.latestNdvi)}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(evidence.baseline.latestDate)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI año anterior</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.baseline.previousYearNdvi)}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(evidence.baseline.previousYearDate)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Cambio interanual NDVI</p><p className="mt-1 text-2xl font-medium">{signed(evidence.baseline.ndviDelta)}</p><p className="mt-1 text-xs text-muted-foreground">comparación con período válido cercano a 1 año atrás</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Cambio interanual NDMI</p><p className="mt-1 text-2xl font-medium">{signed(evidence.baseline.ndmiDelta)}</p><p className="mt-1 text-xs text-muted-foreground">cambio de señal espectral asociada al agua</p></Card>
        </section>

        <section className="grid gap-3 md:grid-cols-5">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Observaciones válidas</p><p className="mt-1 text-2xl font-medium">{evidence.summary.observationCount}</p><p className="mt-1 text-xs text-muted-foreground">aprox. 24 meses consultados</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDVI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdvi)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDRE medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdre)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">NDMI medio</p><p className="mt-1 text-2xl font-medium">{numberLabel(evidence.summary.meanNdmi)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Cambio reciente NDVI</p><p className="mt-1 text-sm font-medium">{trendLabel(evidence.temporal.recentNdviTrend)}</p><p className="mt-1 text-xs text-muted-foreground">Δ {signed(evidence.temporal.recentNdviDelta)}</p></Card>
        </section>

        <Card className="p-6">
          <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Historia espectral</p><h3 className="mt-1 text-xl font-medium">Cómo cambió el ROL</h3></div><div className="flex flex-wrap gap-2"><Badge variant="outline">NDVI reciente {trendLabel(evidence.temporal.recentNdviTrend)}</Badge><Badge variant="outline">variación anual {variationLabel(evidence.temporal.annualVariationSignal)}</Badge></div></div>
          <div className="mt-5"><TemporalChart observations={observations} /></div>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Qué sí y qué no sabemos</p>
          <p className="mt-3 max-w-5xl text-sm leading-6">{evidence.temporal.interpretation}</p>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-muted-foreground">{evidence.note}</p>
          <p className="mt-3 text-xs text-muted-foreground">{evidence.classification.reason}</p>
        </Card>
      </> : null}
    </main>
  )
}
