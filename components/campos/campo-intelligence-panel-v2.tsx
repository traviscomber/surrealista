"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Activity, ChevronDown, Database, Loader2, MapPin, Route, ShieldCheck, TrendingUp, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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

type SentinelEvidence = {
  available: boolean
  observationCount: number
  geometryMode: string | null
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
  reliable: boolean
}

type ProspectingSignal = {
  score: number
  level: "alta" | "media" | "observar"
  dimensions: {
    identity: number
    location: number
    owner: number
    ciren: number
    satellite: number
    market: number
  }
  reasons: string[]
  nextAction: string
  guardrail: string
}

type EvidenceResponse = {
  nearby?: NearbyFeature[]
  comparables?: MarketComparable[]
  publicMetrics?: PublicMetric[]
  contact?: ContactRow | null
  rol?: string | null
  commune?: string | null
  ciren?: {
    status: "matched" | "partial" | "ambiguous" | "not_found" | "unknown"
    observedAt: string | null
  }
  sentinel?: SentinelEvidence
  marketContext?: {
    scope: "commune" | "region" | "none"
    sampleCount: number
    computedAt: string | null
  }
  ownerResearch?: {
    name: string | null
    confidence: number | null
    contactAvailable: boolean
    decision: string | null
    researchedAt: string | null
    nextRefreshAt: string | null
  } | null
  prospecting?: ProspectingSignal | null
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

function signalBadgeClass(signal: ProspectingSignal | null, sentinel: SentinelEvidence | null) {
  if (signal?.level === "alta") return "border-rose-600/25 bg-rose-600/8 text-rose-700 dark:text-rose-300"
  if (signal?.level === "media") return "border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-300"
  if (sentinel?.anomaly.level === "none") return "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
  return "border-border bg-secondary/40 text-foreground"
}

function signalLabel(signal: ProspectingSignal | null, sentinel: SentinelEvidence | null) {
  if (signal) return `Prioridad ${signal.level} · ${signal.score}/100`
  if (!sentinel?.available) return "Sin memoria Sentinel"
  if (sentinel.anomaly.level === "none") return "Sin anomalía relevante"
  if (sentinel.anomaly.level === "insufficient_data") return "Historia en formación"
  return "Señal temporal en revisión"
}

function cirenLabel(status?: EvidenceResponse["ciren"] extends infer T ? T extends { status: infer S } ? S : never : never) {
  if (status === "matched") return "Coincidencia"
  if (status === "partial") return "Parcial"
  if (status === "ambiguous") return "Ambigua"
  if (status === "not_found") return "Sin feature"
  return "Sin señal"
}

export function CampoIntelligencePanelV2({ record, ciren }: { record: KmzInventoryRecord; ciren: CirenSignal }) {
  const [nearby, setNearby] = useState<NearbyFeature[]>([])
  const [comparables, setComparables] = useState<MarketComparable[]>([])
  const [publicMetrics, setPublicMetrics] = useState<PublicMetric[]>([])
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [rol, setRol] = useState<string | null>(record.rol_numbers?.[0] || null)
  const [commune, setCommune] = useState<string | null>(null)
  const [cirenEvidence, setCirenEvidence] = useState<EvidenceResponse["ciren"] | null>(null)
  const [sentinel, setSentinel] = useState<SentinelEvidence | null>(null)
  const [marketContext, setMarketContext] = useState<EvidenceResponse["marketContext"] | null>(null)
  const [ownerResearch, setOwnerResearch] = useState<NonNullable<EvidenceResponse["ownerResearch"]> | null>(null)
  const [prospecting, setProspecting] = useState<ProspectingSignal | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)
    setDetailsOpen(false)
    setRol(record.rol_numbers?.[0] || null)
    setCommune(null)
    setCirenEvidence(null)
    setSentinel(null)
    setMarketContext(null)
    setOwnerResearch(null)
    setProspecting(null)

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
        setRol(payload.rol || record.rol_numbers?.[0] || null)
        setCommune(payload.commune || null)
        setCirenEvidence(payload.ciren || null)
        setSentinel(payload.sentinel || null)
        setMarketContext(payload.marketContext || null)
        setOwnerResearch(payload.ownerResearch || null)
        setProspecting(payload.prospecting || null)
        setFailed(Boolean(payload.partial))
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.warn("[CAMPOS] intelligence evidence failed", error)
        setNearby([])
        setComparables([])
        setPublicMetrics([])
        setContact(null)
        setCirenEvidence(null)
        setSentinel(null)
        setMarketContext(null)
        setOwnerResearch(null)
        setProspecting(null)
        setFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [record.id, record.rol_numbers])

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
    if (record.owner) commercial += 5
    if (record.rol_numbers?.length) commercial += 4
    if (record.google_docs_link) commercial += 2
    if (contact?.pic) commercial += 2
    if (contact?.pic_phone || contact?.pic_email) commercial += 2
    commercial = clamp(commercial, 0, 15)

    const total = data + territorial + market + commercial
    return { total, data, territorial, market, commercial, label: scoreLabel(total) }
  }, [contact, marketEvidence, place?.distance_m, record, road?.distance_m])

  const fallbackNextAction = useMemo(() => {
    if (!record.rol_numbers?.length) return "Resolver ROL antes de análisis comercial profundo."
    if (!record.owner && !ownerResearch?.name) return "Identificar propietario y validar contacto."
    if (!contact?.pic && !contact?.pic_phone && !contact?.pic_email && !ownerResearch?.contactAvailable) return "Completar contacto responsable del campo."
    if (!road) return "Revisar acceso vial y conectividad territorial."
    if (marketEvidence.maxSample === 0 && publicMetrics.length === 0) return "Falta evidencia de mercado regional actualizada."
    return "Base suficiente para revisión comercial priorizada."
  }, [contact, marketEvidence.maxSample, ownerResearch, publicMetrics.length, record.owner, record.rol_numbers, road])

  const cirenSummary = ciren.samePropertyRol
    ? `Referencia complementaria: ROL ${ciren.samePropertyRol}`
    : ciren.neighborCount > 0
      ? `Referencia complementaria: ${ciren.neighborCount} predios cercanos`
      : null

  const nextAction = prospecting?.nextAction || fallbackNextAction
  const anomalyText = sentinel?.available
    ? sentinel.anomaly.interpretation
    : "Este ROL todavía no tiene memoria Sentinel persistida disponible para lectura temporal."
  const ownerDisplay = ownerResearch?.name
    ? `${ownerResearch.name}${ownerResearch.confidence != null ? ` · ${Math.round(ownerResearch.confidence * 100)}% confianza` : ""}`
    : record.owner || "Pendiente"
  const marketScopeLabel = marketContext?.scope === "commune" ? "comunal" : marketContext?.scope === "region" ? "regional" : "sin contexto"

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="sr-meta">Inteligencia cruzada del campo</p>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted-foreground">
            ROL + CIREN + memoria Sentinel-2 + mercado + evidencia de propietario. Prioriza investigación; no estima intención de venta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          <Badge variant="outline" className={signalBadgeClass(prospecting, sentinel)}>
            {signalLabel(prospecting, sentinel)}
          </Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-3 xl:grid-cols-6">
        <SignalCell label="ROL" value={rol || "Pendiente"} helper={commune || record.region} />
        <SignalCell
          label="Sentinel"
          value={sentinel?.available ? `${sentinel.observationCount} observaciones` : "Sin memoria"}
          helper={sentinel?.geometryMode === "ciren_polygon" ? "geometría CIREN" : sentinel?.available ? "centroide" : null}
        />
        <SignalCell label="NDVI" value={formatIndex(sentinel?.latest.ndvi)} helper={formatDelta(sentinel?.anomaly.ndviDelta) ? `Δ ${formatDelta(sentinel?.anomaly.ndviDelta)}` : null} />
        <SignalCell label="NDRE" value={formatIndex(sentinel?.latest.ndre)} helper="lectura actual" />
        <SignalCell label="NDMI" value={formatIndex(sentinel?.latest.ndmi)} helper={formatDelta(sentinel?.anomaly.ndmiDelta) ? `Δ ${formatDelta(sentinel?.anomaly.ndmiDelta)}` : null} />
        <SignalCell label="CIREN" value={cirenLabel(cirenEvidence?.status)} helper={cirenEvidence?.status === "not_found" ? "SII/Sentinel mantienen trazabilidad" : null} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-lg border border-border/70 bg-secondary/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-medium">Lectura temporal</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{anomalyText}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card px-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-muted-foreground">Mercado</p>
              <p className="mt-1 font-medium">{marketContext?.sampleCount ? `${marketContext.sampleCount} muestras` : "Sin muestra"}</p>
              <p className="mt-0.5 text-muted-foreground">{marketScopeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Propietario</p>
              <p className="mt-1 truncate font-medium">{ownerResearch?.name ? "Candidato resuelto" : record.owner ? "Registrado" : "Pendiente"}</p>
              <p className="mt-0.5 text-muted-foreground">{ownerResearch?.contactAvailable ? "contacto disponible" : "contacto por validar"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/25 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium">Siguiente acción</p>
          <p className="mt-1 text-xs text-muted-foreground">{nextAction}</p>
          {failed ? <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Parte de la evidencia complementaria no estuvo disponible; se muestran sólo datos confirmados recuperados.</p> : null}
        </div>
      </div>

      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mt-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border/70 bg-card px-4 py-2.5 text-left text-xs font-medium transition-colors hover:bg-secondary/40">
          <span className="flex items-center gap-2"><Database className="h-4 w-4 text-muted-foreground" />{detailsOpen ? "Ocultar evidencia completa" : "Ver evidencia completa"}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="sr-meta">Calidad operativa · Score v1</p>
              <p className="mt-1 max-w-2xl text-[11px] text-muted-foreground">Score histórico de completitud y contexto. Se conserva como evidencia secundaria, no como prioridad comercial.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums tracking-tight">{score.total}<span className="text-xs font-normal text-muted-foreground">/100</span></div>
              <Badge variant="outline" className={`mt-1 ${scoreBadgeClass(score.total)}`}>{score.label}</Badge>
            </div>
          </div>

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
              <Fact label={ownerResearch?.name ? "Propietario candidato" : "Propietario"} value={ownerDisplay} />
              <Fact label="ROL" value={rol || (record.rol_numbers?.length ? record.rol_numbers.join(", ") : "Pendiente")} />
              <Fact label="Responsable" value={contact?.pic || "Pendiente"} />
              <Fact label="Contacto" value={contact?.pic_phone || contact?.pic_email || (ownerResearch?.contactAvailable ? "Disponible en investigación" : "Pendiente")} />
            </Evidence>

            <Evidence icon={<MapPin className="h-4 w-4" />} title="Territorio">
              <Fact label="Región" value={record.region} />
              <Fact label="Comuna" value={commune || "Sin dato"} />
              <Fact label="Geometría" value={record.geometry_label || record.geometry_status} />
              <Fact label="Ubicación" value={Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude)) ? `${Number(record.latitude).toFixed(5)}, ${Number(record.longitude).toFixed(5)}` : "Sin coordenadas"} />
            </Evidence>

            <Evidence icon={<Route className="h-4 w-4" />} title="Entorno próximo">
              <Fact label="Vía" value={road ? `${road.feature_name || road.feature_type || "Vía"} · ${formatDistance(road.distance_m)}` : "Sin evidencia"} />
              <Fact label="Localidad" value={place ? `${place.feature_name || place.feature_type || "Lugar"} · ${formatDistance(place.distance_m)}` : "Sin evidencia"} />
              <Fact label="Agua" value={water ? `${water.feature_name || water.feature_type || "Cuerpo de agua"} · ${formatDistance(water.distance_m)}` : "Sin evidencia"} />
              <Fact label="Área protegida" value={protectedArea ? `${protectedArea.feature_name || "Referencia"} · ${formatDistance(protectedArea.distance_m)}` : "Sin evidencia cercana"} />
            </Evidence>

            <Evidence icon={<TrendingUp className="h-4 w-4" />} title="Mercado">
              <Fact label="Cobertura" value={marketContext?.sampleCount ? `${marketContext.sampleCount} muestras · ${marketScopeLabel}` : "Sin muestra"} />
              <Fact label="Mediana m²" value={marketEvidence.freshest?.median_price_m2_clp ? `$${Number(marketEvidence.freshest.median_price_m2_clp).toLocaleString("es-CL")}` : "Sin dato"} />
              <Fact label="Tendencia 30d" value={marketEvidence.freshest?.price_trend_30d != null ? `${Number(marketEvidence.freshest.price_trend_30d).toFixed(1)}%` : "Sin dato"} />
              <Fact label="Fuentes" value={marketEvidence.sources.length ? marketEvidence.sources.join(", ") : "Sin métricas públicas"} />
            </Evidence>
          </div>

          {cirenSummary ? <p className="mt-3 text-[11px] text-muted-foreground">CIREN · {cirenSummary}</p> : null}
          {prospecting?.reasons?.length ? (
            <div className="mt-3 rounded-lg border border-border/70 px-4 py-3">
              <p className="text-xs font-medium">Por qué esta señal tiene esta prioridad</p>
              <ul className="mt-2 grid gap-1 text-[11px] leading-5 text-muted-foreground lg:grid-cols-2">
                {prospecting.reasons.map((reason) => <li key={reason}>· {reason}</li>)}
              </ul>
            </div>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SignalCell({ label, value, helper }: { label: string; value: string; helper?: string | null }) {
  return (
    <div className="min-w-0 bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium tabular-nums">{value}</p>
      {helper ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

function Evidence({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-border/70 bg-secondary/20 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium">{icon}<span>{title}</span></div><div className="space-y-1.5">{children}</div></div>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 text-[11px]"><span className="shrink-0 text-muted-foreground">{label}</span><span className="min-w-0 text-right font-medium text-foreground">{value}</span></div>
}
