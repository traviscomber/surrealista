"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Loader2, MapPin, Route, ShieldCheck, TrendingUp, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { KmzInventoryRecord } from "@/lib/kmz/kmz-inventory-service"

type CirenSignal = {
  samePropertyRol?: string | null
  commune?: string | null
  neighborCount: number
  hasCoverage: boolean
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

type EvidenceResponse = {
  nearby?: NearbyFeature[]
  comparables?: MarketComparable[]
  publicMetrics?: PublicMetric[]
  contact?: ContactRow | null
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

export function CampoIntelligencePanelV2({ record, ciren }: { record: KmzInventoryRecord; ciren: CirenSignal }) {
  const [nearby, setNearby] = useState<NearbyFeature[]>([])
  const [comparables, setComparables] = useState<MarketComparable[]>([])
  const [publicMetrics, setPublicMetrics] = useState<PublicMetric[]>([])
  const [contact, setContact] = useState<ContactRow | null>(null)
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
        setFailed(Boolean(payload.partial))
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.warn("[CAMPOS] intelligence evidence failed", error)
        setNearby([])
        setComparables([])
        setPublicMetrics([])
        setContact(null)
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
    if (Number.isFinite(placeDistance)) territorial += placeDistance <= 2000 ? 5 : placeDistance <= 5000 ? 3 : 0
    territorial += ciren.samePropertyRol ? 5 : ciren.neighborCount > 0 ? 3 : 0
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
  }, [ciren.neighborCount, ciren.samePropertyRol, contact, marketEvidence, place?.distance_m, record, road?.distance_m])

  const nextAction = useMemo(() => {
    if (!record.rol_numbers?.length) return "Resolver ROL antes de análisis comercial profundo."
    if (!record.owner) return "Identificar propietario y validar contacto."
    if (!contact?.pic && !contact?.pic_phone && !contact?.pic_email) return "Completar contacto responsable del campo."
    if (!road) return "Revisar acceso vial y conectividad territorial."
    if (marketEvidence.maxSample === 0 && publicMetrics.length === 0) return "Falta evidencia de mercado regional actualizada."
    return "Base suficiente para revisión comercial priorizada."
  }, [contact, marketEvidence.maxSample, publicMetrics.length, record.owner, record.rol_numbers, road])

  return (
    <div className="mt-4 border-t border-border/70 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sr-meta">Ficha operativa · Score v1</p>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Prioriza revisión usando evidencia existente. No es una tasación ni una estimación de rentabilidad.</p>
        </div>
        <div className="flex items-center gap-3">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums tracking-tight">{score.total}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
            <Badge variant="outline" className={`mt-1 ${scoreBadgeClass(score.total)}`}>{score.label}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <Evidence icon={<UserRound className="h-4 w-4" />} title="Identidad">
          <Fact label="Propietario" value={record.owner || "Pendiente"} />
          <Fact label="ROL" value={record.rol_numbers?.length ? record.rol_numbers.join(", ") : "Pendiente"} />
          <Fact label="Responsable" value={contact?.pic || "Pendiente"} />
          <Fact label="Contacto" value={contact?.pic_phone || contact?.pic_email || "Pendiente"} />
        </Evidence>

        <Evidence icon={<MapPin className="h-4 w-4" />} title="Territorio">
          <Fact label="Región" value={record.region} />
          <Fact label="Comuna CIREN" value={ciren.commune || "Sin coincidencia"} />
          <Fact label="Geometría" value={record.geometry_label || record.geometry_status} />
          <Fact label="CIREN" value={ciren.samePropertyRol ? `Predio asociado · ${ciren.samePropertyRol}` : ciren.hasCoverage ? `${ciren.neighborCount} referencias` : "Sin cobertura"} />
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
          <Fact label="Tendencia 30d" value={marketEvidence.freshest?.price_trend_30d != null ? `${Number(marketEvidence.freshest.price_trend_30d).toFixed(1)}%` : "Sin dato"} />
          <Fact label="Fuentes" value={marketEvidence.sources.length ? marketEvidence.sources.join(", ") : "Sin métricas públicas"} />
        </Evidence>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/25 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium">Siguiente acción sugerida</p>
          <p className="mt-1 text-xs text-muted-foreground">{nextAction}</p>
          {failed ? <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Parte de la evidencia complementaria no estuvo disponible; el score se calculó solo con datos recuperados.</p> : null}
        </div>
      </div>
    </div>
  )
}

function Evidence({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-border/70 bg-secondary/20 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium">{icon}<span>{title}</span></div><div className="space-y-1.5">{children}</div></div>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 text-[11px]"><span className="shrink-0 text-muted-foreground">{label}</span><span className="min-w-0 text-right font-medium text-foreground">{value}</span></div>
}
