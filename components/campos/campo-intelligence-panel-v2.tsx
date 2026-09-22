"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, ChevronDown, Loader2, MapPin, Route, ShieldCheck, TrendingUp, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { KmzInventoryRecord } from "@/lib/kmz/kmz-inventory-service"

type CirenSignal = {
  samePropertyRol?: string | null
  neighborCount: number
}

type NearbyFeature = {
  feature_group: string
  feature_type: string | null
  feature_name: string | null
  distance_m: number | null
  proximity_class: string | null
}

type MarketComparable = {
  commune: string | null
  property_type: string | null
  operation: string | null
  sample_count: number | null
  median_price_m2_clp: number | null
  absorption_rate: number | null
  price_trend_30d: number | null
  computed_at: string | null
}

type PublicMetric = {
  source: string | null
  metric: string | null
  value: number | null
  unit: string | null
  period: string | null
  scraped_at: string | null
}

type ContactRow = {
  pic: string | null
  pic_phone: string | null
  pic_email: string | null
  updated_at: string | null
}

type OwnerEvidence = {
  status: "confirmed" | "candidate" | "missing"
  name: string | null
  source: string | null
  note: string
}

type SentinelEvidence = {
  observationCount: number
  geometryMode: string
  latestPeriod: string | null
  latest: {
    ndvi: number | null
    ndre: number | null
    ndmi: number | null
  }
  anomaly: {
    level: "none" | "watch" | "strong" | "insufficient_data"
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
  }
}

type EvidenceResponse = {
  nearby?: NearbyFeature[]
  comparables?: MarketComparable[]
  publicMetrics?: PublicMetric[]
  contact?: ContactRow | null
  owner?: OwnerEvidence | null
  satellite?: SentinelEvidence | null
  partial?: boolean
  error?: string
}

type ScoreBreakdown = {
  total: number
  data: number
  territorial: number
  market: number
  commercial: number
  label: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function daysSince(value?: string | null) {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, (Date.now() - timestamp) / 86_400_000)
}

function nearest(features: NearbyFeature[], group: string) {
  return features
    .filter((item) => item.feature_group === group && Number.isFinite(Number(item.distance_m)))
    .sort((a, b) => Number(a.distance_m) - Number(b.distance_m))[0] || null
}

function formatDistance(value?: number | null) {
  if (!Number.isFinite(Number(value))) return "Sin dato"
  const meters = Number(value)
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

function formatIndex(value?: number | null) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : "—"
}

function formatDelta(value?: number | null) {
  if (!Number.isFinite(Number(value))) return null
  const numeric = Number(value)
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(3)}`
}

function scoreLabel(score: number) {
  if (score >= 80) return "Alta preparación"
  if (score >= 65) return "Buena base"
  if (score >= 50) return "Requiere completar"
  return "Prioridad de enriquecimiento"
}

function scoreBadgeClass(score: number) {
  if (score >= 80) return "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
  if (score >= 65) return "border-primary/30 bg-primary/10 text-primary"
  if (score >= 50) return "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-300"
  return "border-rose-600/25 bg-rose-600/8 text-rose-700 dark:text-rose-300"
}

function anomalyLabel(level?: SentinelEvidence["anomaly"]["level"]) {
  if (level === "strong") return "Cambio fuerte"
  if (level === "watch") return "Cambio a vigilar"
  if (level === "none") return "Sin cambio relevante"
  if (level === "insufficient_data") return "Historia insuficiente"
  return "Sin memoria Sentinel"
}

function anomalyBadgeClass(level?: SentinelEvidence["anomaly"]["level"]) {
  if (level === "strong") return "border-rose-600/30 bg-rose-600/10 text-rose-700 dark:text-rose-300"
  if (level === "watch") return "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-300"
  if (level === "none") return "border-emerald-600/25 bg-emerald-600/8 text-emerald-700 dark:text-emerald-300"
  return "border-border bg-muted/55 text-muted-foreground"
}

export function CampoIntelligencePanelV2({ record, ciren }: { record: KmzInventoryRecord; ciren: CirenSignal }) {
  const [nearby, setNearby] = useState<NearbyFeature[]>([])
  const [comparables, setComparables] = useState<MarketComparable[]>([])
  const [publicMetrics, setPublicMetrics] = useState<PublicMetric[]>([])
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [owner, setOwner] = useState<OwnerEvidence | null>(null)
  const [satellite, setSatellite] = useState<SentinelEvidence | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)

    void fetch(`/api/kmz/field-intelligence?kmzId=${encodeURIComponent(String(record.id))}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as EvidenceResponse
        if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`)
        setNearby(payload.nearby || [])
        setComparables(payload.comparables || [])
        setPublicMetrics(payload.publicMetrics || [])
        setContact(payload.contact || null)
        setOwner(payload.owner || null)
        setSatellite(payload.satellite || null)
        setFailed(Boolean(payload.partial))
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.warn("[CAMPOS] intelligence evidence failed", error)
        setNearby([])
        setComparables([])
        setPublicMetrics([])
        setContact(null)
        setOwner(null)
        setSatellite(null)
        setFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [record.id])

  const road = useMemo(() => nearest(nearby, "road"), [nearby])
  const place = useMemo(() => nearest(nearby, "place"), [nearby])
  const water = useMemo(() => nearest(nearby, "water"), [nearby])
  const protectedArea = useMemo(() => nearest(nearby, "protected_area"), [nearby])

  const marketEvidence = useMemo(() => {
    const freshest = comparables[0] || null
    const maxSample = comparables.reduce((max, row) => Math.max(max, Number(row.sample_count || 0)), 0)
    const sources = Array.from(new Set(publicMetrics.map((item) => item.source).filter(Boolean))) as string[]
    return { freshest, maxSample, sources }
  }, [comparables, publicMetrics])

  const score = useMemo<ScoreBreakdown>(() => {
    const data = Math.round(clamp(Number(record.completeness_score || 0), 0, 100) * 0.35)

    let territorial = record.geometry_status === "real_geometry" ? 10 : 5
    const roadDistance = Number(road?.distance_m)
    if (Number.isFinite(roadDistance)) territorial += roadDistance <= 250 ? 10 : roadDistance <= 1000 ? 7 : roadDistance <= 2000 ? 4 : 0
    const placeDistance = Number(place?.distance_m)
    if (Number.isFinite(placeDistance)) territorial += placeDistance <= 2000 ? 10 : placeDistance <= 5000 ? 6 : 0
    territorial = clamp(territorial, 0, 30)

    let market = 0
    if (marketEvidence.maxSample >= 20) market += 8
    else if (marketEvidence.maxSample >= 5) market += 5
    else if (marketEvidence.maxSample > 0) market += 3
    const marketAge = daysSince(marketEvidence.freshest?.computed_at)
    if (marketAge !== null) market += marketAge <= 90 ? 5 : marketAge <= 180 ? 3 : marketAge <= 365 ? 1 : 0
    if (marketEvidence.freshest?.median_price_m2_clp) market += 3
    if (marketEvidence.sources.length > 0) market += 2
    if (marketEvidence.sources.some((source) => source.toLowerCase().includes("inciti"))) market += 2
    market = clamp(market, 0, 20)

    let commercial = 0
    if (owner?.status === "confirmed") commercial += 5
    else if (owner?.status === "candidate") commercial += 2
    if (record.rol_numbers?.length) commercial += 4
    if (record.google_docs_link) commercial += 2
    if (contact?.pic) commercial += 2
    if (contact?.pic_phone || contact?.pic_email) commercial += 2
    commercial = clamp(commercial, 0, 15)

    const total = data + territorial + market + commercial
    return { total, data, territorial, market, commercial, label: scoreLabel(total) }
  }, [contact, marketEvidence, owner?.status, place?.distance_m, record, road?.distance_m])

  const nextAction = useMemo(() => {
    if (!record.rol_numbers?.length) return "Resolver ROL antes de análisis comercial profundo."
    if (satellite?.anomaly.level === "strong") return "Revisar primero la causa del cambio temporal y contrastarla con evidencia territorial antes de cualquier acercamiento."
    if (satellite?.anomaly.level === "watch") return "Mantener vigilancia y validar si el cambio temporal persiste antes de escalar comercialmente."
    if (!owner?.name) return "Completar investigación de propietario antes de cualquier acercamiento."
    if (owner.status === "candidate") return "Validar dominio vigente antes de usar el candidato de propietario en una gestión comercial."
    if (!contact?.pic && !contact?.pic_phone && !contact?.pic_email) return "Completar contacto responsable del campo."
    if (marketEvidence.maxSample === 0 && publicMetrics.length === 0) return "Completar contexto de mercado antes de priorizar comercialmente."
    return "Base suficiente para revisión comercial priorizada."
  }, [contact, marketEvidence.maxSample, owner, publicMetrics.length, record.rol_numbers, satellite?.anomaly.level])

  const cirenSummary = ciren.samePropertyRol
    ? `ROL ${ciren.samePropertyRol}`
    : ciren.neighborCount > 0
      ? `${ciren.neighborCount} predios cercanos`
      : "Sin match directo"

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Activity className="h-4 w-4 text-primary" />
            <span>Lectura operativa</span>
          </div>
          <Badge variant="outline" className={anomalyBadgeClass(satellite?.anomaly.level)}>
            {anomalyLabel(satellite?.anomaly.level)}
          </Badge>
          {satellite ? <Badge variant="outline">{satellite.observationCount} observaciones Sentinel</Badge> : null}
          <Badge variant="outline">CIREN · {cirenSummary}</Badge>
          <Badge variant="outline">Mercado · {marketEvidence.maxSample || 0} comparables</Badge>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          <Badge variant="outline" className={scoreBadgeClass(score.total)}>Evidencia {score.total}/100</Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-3">
        <IndexMetric label="NDVI" value={satellite?.latest.ndvi} delta={satellite?.anomaly.ndviDelta} />
        <IndexMetric label="NDRE" value={satellite?.latest.ndre} />
        <IndexMetric label="NDMI" value={satellite?.latest.ndmi} delta={satellite?.anomaly.ndmiDelta} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="rounded-lg border border-border/70 bg-secondary/18 px-4 py-3">
          <p className="text-xs font-medium">Señal temporal</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {satellite?.anomaly.interpretation || "Este ROL aún no tiene memoria Sentinel suficiente para una lectura temporal persistida."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {satellite?.latestPeriod ? <span>Último período · {new Date(satellite.latestPeriod).toLocaleDateString("es-CL", { year: "numeric", month: "short" })}</span> : null}
            {satellite?.geometryMode ? <span>· {satellite.geometryMode === "ciren_polygon" ? "geometría CIREN" : "referencia territorial SII"}</span> : null}
            {satellite?.anomaly.baselineCount ? <span>· {satellite.anomaly.baselineCount} referencias estacionales</span> : null}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-secondary/18 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <UserRound className="h-4 w-4" />
            <span>Propietario</span>
          </div>
          <p className="mt-2 truncate text-sm font-medium">{owner?.name || "Pendiente de validación"}</p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            {owner?.status === "confirmed"
              ? "Identidad registrada en el expediente."
              : owner?.status === "candidate"
                ? "Candidato público; no usar como dominio vigente sin validación registral."
                : "Sin identidad suficientemente validada."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/25 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium">Siguiente acción</p>
          <p className="mt-1 text-xs text-muted-foreground">{nextAction}</p>
          {failed ? <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Parte de la evidencia complementaria no estuvo disponible; la lectura muestra sólo lo recuperado.</p> : null}
        </div>
      </div>

      <details className="group mt-3 border-t border-border/60 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <span>Ver evidencia completa y desglose del score</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Calidad de datos", score.data, 35],
            ["Contexto territorial", score.territorial, 30],
            ["Evidencia de mercado", score.market, 20],
            ["Preparación comercial", score.commercial, 15],
          ].map(([label, value, max]) => (
            <div key={String(label)} className="bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value}/{max}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(Number(value) / Number(max)) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <Evidence icon={<UserRound className="h-4 w-4" />} title="Identidad">
            <Fact label="Propietario" value={owner?.name || record.owner || "Pendiente"} />
            <Fact label="Estado" value={owner?.status === "confirmed" ? "Registrado" : owner?.status === "candidate" ? "Candidato" : "Pendiente"} />
            <Fact label="ROL" value={record.rol_numbers?.length ? record.rol_numbers.join(", ") : "Pendiente"} />
            <Fact label="Contacto" value={contact?.pic_phone || contact?.pic_email || "Pendiente"} />
          </Evidence>

          <Evidence icon={<MapPin className="h-4 w-4" />} title="Territorio">
            <Fact label="Región" value={record.region} />
            <Fact label="Geometría" value={record.geometry_label || record.geometry_status} />
            <Fact label="Ubicación" value={Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude)) ? `${Number(record.latitude).toFixed(5)}, ${Number(record.longitude).toFixed(5)}` : "Sin coordenadas"} />
            <Fact label="CIREN" value={cirenSummary} />
          </Evidence>

          <Evidence icon={<Route className="h-4 w-4" />} title="Entorno próximo">
            <Fact label="Vía" value={road ? `${road.feature_name || road.feature_type || "Vía"} · ${formatDistance(road.distance_m)}` : "Sin evidencia"} />
            <Fact label="Localidad" value={place ? `${place.feature_name || place.feature_type || "Lugar"} · ${formatDistance(place.distance_m)}` : "Sin evidencia"} />
            <Fact label="Agua" value={water ? `${water.feature_name || water.feature_type || "Cuerpo de agua"} · ${formatDistance(water.distance_m)}` : "Sin evidencia"} />
            <Fact label="Área protegida" value={protectedArea ? `${protectedArea.feature_name || "Referencia"} · ${formatDistance(protectedArea.distance_m)}` : "Sin evidencia cercana"} />
          </Evidence>

          <Evidence icon={<TrendingUp className="h-4 w-4" />} title="Mercado">
            <Fact label="Muestra máxima" value={marketEvidence.maxSample ? `${marketEvidence.maxSample} comparables` : "Sin muestra"} />
            <Fact label="Mediana m²" value={marketEvidence.freshest?.median_price_m2_clp ? `$${Number(marketEvidence.freshest.median_price_m2_clp).toLocaleString("es-CL")}` : "Sin dato"} />
            <Fact label="Tendencia 30d" value={marketEvidence.freshest?.price_trend_30d != null ? `${Number(marketEvidence.freshest.price_trend_30d).toFixed(1)}%` : "No poblada"} />
            <Fact label="Fuentes" value={marketEvidence.sources.length ? marketEvidence.sources.join(", ") : "Sin métricas públicas"} />
          </Evidence>
        </div>
      </details>
    </div>
  )
}

function IndexMetric({ label, value, delta }: { label: string; value?: number | null; delta?: number | null }) {
  const formattedDelta = formatDelta(delta)
  return (
    <div className="bg-card px-4 py-3">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        {formattedDelta ? <span className="text-[11px] tabular-nums text-muted-foreground">Δ {formattedDelta}</span> : null}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{formatIndex(value)}</p>
    </div>
  )
}

function Evidence({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-border/70 bg-secondary/20 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium">{icon}<span>{title}</span></div><div className="space-y-1.5">{children}</div></div>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 text-[11px]"><span className="shrink-0 text-muted-foreground">{label}</span><span className="min-w-0 text-right font-medium text-foreground">{value}</span></div>
}
