"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Clock3, Loader2, MapPin, Play, Radar, RefreshCw, Save, Sprout, UserRound } from "lucide-react"

import { ProspectingCombobox } from "@/components/prospeccion/prospecting-combobox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { CHILEAN_REGIONS } from "@/lib/chile-locations"
import { PROSPECTING_SPECIES_OPTIONS } from "@/lib/prospeccion/species-catalog"

type Candidate = {
  id: string
  title: string
  region: string | null
  commune: string | null
  source: string | null
  source_url: string | null
  area_ha: number
  opportunity_score: number
  prospecting_fit_score: number
  confidence: number
  discount_pct: number
  benchmark: { sample_count: number; source_count: number }
}

type OffMarketProspect = {
  id: string
  rol: string
  commune: string
  declaredSpecies: string[]
  targetSpeciesMatch: boolean
  source: string
  surveyYear: number
  areaHa: number | null
  stage: "detected"
  ownerStatus: "pending"
  contactStatus: "pending"
  evidenceLabel: string
}

type ProspectingCase = {
  id: string
  kind: "market" | "off_market"
  status: "ready_to_contact" | "owner_identified" | "verify_owner" | "review_market"
  score: number
  title: string
  location: string
  rol: string | null
  areaHa: number | null
  speciesEvidence: { target: string | null; declared: string[]; satelliteVerified: false }
  owner: { name: string; confidence: number; basis: string } | null
  contact: { name: string | null; phone: string | null; email: string | null } | null
  nextAction: string
}

type OwnerLead = { name: string; confidence: number; source?: string }

type OwnerLookupResult = {
  owner: { name: string; confidence: number; source: string; evidenceUrl: string; documentType: string | null } | null
  producer?: OwnerLead | null
  historicalOwner?: OwnerLead | null
  status: "owner_candidate_found" | "owner_pending"
  nextAction: string
}

type ProspectingResponse = {
  candidates: Candidate[]
  count: number
  offMarketProspects?: OffMarketProspect[]
  offMarketCount?: number
  cases?: ProspectingCase[]
  priorityCases?: ProspectingCase[]
  note: string
  outcome?: {
    status: "actionable_cases" | "qualified_candidates" | "regional_expansion" | "official_off_market_signal" | "no_match"
    summary: string
    recommendation: string
    generatedBy: "evidence" | "ai"
    speciesVerified: false
  }
  publicEvidence?: {
    ciren: { status: string; polygonCount: number; speciesMatchedCount: number; sampleRoles: string[]; offMarketProspects?: OffMarketProspect[] }
    odepa: { status: string; totalSurfaceHa: number; speciesMatchedSurfaceHa: number }
  }
  infrastructure?: {
    irrigation: { status: string; surveyYear: number | null; irrigatedAreaFeatures: number; intakeFeatures: number; canalFeatures: number }
    soils: { status: string; surveyYear: number | null; featureCount: number }
  }
  coverage: {
    market: string
    kmz: string
    speciesClassification: string
    autonomousDiscovery: string
    officialAgriSources?: string
    irrigationInfrastructure?: string
    soils?: string
    waterRights?: string
    ownerResearch?: string
  }
}

type SentinelAttentionSummary = {
  monitoredRols: number
  actionableCount: number
  strongCount: number
  watchCount: number
  generatedAt: string
  items: Array<{
    rol: string
    commune: string
    observationCount: number
    latestPeriod: string | null
    latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
    anomaly: {
      level: "watch" | "strong"
      ndviDelta: number | null
      ndmiDelta: number | null
      interpretation: string
    }
    severityScore: number
  }>
}


type CrossLayerSignalSummary = {
  generatedAt: string
  monitoredRols: number
  actionableCount: number
  highPriorityCount: number
  mediumPriorityCount: number
  items: Array<{
    rol: string
    kmzId: string | null
    commune: string | null
    region: string | null
    ownerName: string | null
    contactAvailable: boolean
    cirenStatus: "matched" | "partial" | "ambiguous" | "not_found" | "unknown"
    marketSampleCount: number
    latestPeriod: string | null
    latest: { ndvi: number | null; ndre: number | null; ndmi: number | null }
    anomaly: {
      level: "watch" | "strong"
      ndviDelta: number | null
      ndmiDelta: number | null
      interpretation: string
    }
    observationCount: number
    score: number
    level: "alta" | "media" | "observar"
    reasons: string[]
    nextAction: string
    guardrail: string
  }>
}

type ClientIntent = {
  id: string
  name: string
  email: string | null
  clientType: string
  status: string
  mainInterest: string | null
  criteria: {
    region: string | null
    commune: string | null
    minHa: number | null
    maxHa: number | null
    budgetMin: number | null
    budgetMax: number | null
    locations: string[]
  }
}

type Mandate = {
  id: string
  name: string
  client_id: string | null
  region: string | null
  commune: string | null
  species: string | null
  min_ha: number | null
  max_ha: number | null
  status: "active" | "paused" | "closed"
  last_candidate_count: number
  last_new_candidate_count: number
  last_run_at: string | null
  created_at: string
}

function mandateSummary(mandate: Mandate) {
  return [mandate.region, mandate.commune, mandate.species, mandate.min_ha != null ? `${mandate.min_ha}+ ha` : null, mandate.max_ha != null ? `hasta ${mandate.max_ha} ha` : null].filter(Boolean).join(" · ") || "Sin filtros"
}

function caseStatusLabel(status: ProspectingCase["status"]) {
  if (status === "ready_to_contact") return "Contacto verificable"
  if (status === "owner_identified") return "Propietario identificado"
  if (status === "verify_owner") return "Verificar propietario"
  return "Revisar mercado"
}

function normalizeSelection(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export default function ProspeccionPage() {
  const [region, setRegion] = useState("")
  const [commune, setCommune] = useState("")
  const [species, setSpecies] = useState("")
  const [minHa, setMinHa] = useState("")
  const [maxHa, setMaxHa] = useState("")
  const [mandateName, setMandateName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [activeMandateId, setActiveMandateId] = useState<string | null>(null)
  const [data, setData] = useState<ProspectingResponse | null>(null)
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [clients, setClients] = useState<ClientIntent[]>([])
  const [sentinelAttention, setSentinelAttention] = useState<SentinelAttentionSummary | null>(null)
  const [sentinelAttentionLoading, setSentinelAttentionLoading] = useState(true)
  const [crossLayerSignals, setCrossLayerSignals] = useState<CrossLayerSignalSummary | null>(null)
  const [crossLayerSignalsLoading, setCrossLayerSignalsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingMandates, setLoadingMandates] = useState(true)
  const [runningMandateId, setRunningMandateId] = useState<string | null>(null)
  const [creatingTaskFor, setCreatingTaskFor] = useState<string | null>(null)
  const [taskCreatedCandidateIds, setTaskCreatedCandidateIds] = useState<Set<string>>(new Set())
  const [ownerLookupRol, setOwnerLookupRol] = useState<string | null>(null)
  const [ownerLookupResults, setOwnerLookupResults] = useState<Record<string, OwnerLookupResult>>({})
  const [researchingPriority, setResearchingPriority] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mandatesError, setMandatesError] = useState<string | null>(null)

  const regionOptions = useMemo(() => CHILEAN_REGIONS
    .map((item) => ({ value: item.shortName, label: item.shortName, keywords: [item.name, item.code] }))
    .sort((a, b) => a.label.localeCompare(b.label, "es-CL")), [])
  const selectedRegionCatalog = useMemo(() => {
    const target = normalizeSelection(region)
    return CHILEAN_REGIONS.find((item) => normalizeSelection(item.shortName) === target || normalizeSelection(item.name) === target) ?? null
  }, [region])
  const communeOptions = useMemo(() => selectedRegionCatalog
    ? selectedRegionCatalog.provincias.flatMap((province) => province.comunas.map((item) => ({ value: item.name, label: item.name, keywords: [province.name, item.code], group: province.name }))).sort((a, b) => a.label.localeCompare(b.label, "es-CL"))
    : [], [selectedRegionCatalog])
  const speciesOptions = useMemo(() => PROSPECTING_SPECIES_OPTIONS.map((item) => ({ ...item })), [])

  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedClientId) || null, [clients, selectedClientId])
  const criteriaSummary = useMemo(() => {
    const parts = [region, commune, species, minHa ? `${minHa}+ ha` : "", maxHa ? `hasta ${maxHa} ha` : ""].filter(Boolean)
    return parts.length ? parts.join(" · ") : "Sin criterios aplicados"
  }, [region, commune, species, minHa, maxHa])
  const queueSummary = useMemo(() => {
    const prospects = data?.offMarketProspects ?? []
    const investigated = prospects.filter((item) => Boolean(ownerLookupResults[item.rol])).length
    const ownerIdentified = prospects.filter((item) => Boolean(ownerLookupResults[item.rol]?.owner)).length
    return { total: prospects.length, investigated, ownerIdentified, pending: Math.max(0, prospects.length - investigated) }
  }, [data?.offMarketProspects, ownerLookupResults])

  async function loadMandates() {
    setLoadingMandates(true)
    setMandatesError(null)
    try {
      const response = await fetch("/api/prospeccion/mandates", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudieron cargar los mandatos.")
      setMandates(body.mandates ?? [])
    } catch (cause) {
      setMandatesError(cause instanceof Error ? cause.message : "No se pudieron cargar los mandatos.")
    } finally {
      setLoadingMandates(false)
    }
  }

  async function loadClients() {
    try {
      const response = await fetch("/api/prospeccion/clients", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudieron cargar clientes.")
      setClients(body.clients ?? [])
    } catch (cause) {
      console.error("[Prospeccion] clients", cause)
    }
  }

  async function loadSentinelAttention() {
    setSentinelAttentionLoading(true)
    try {
      const response = await fetch("/api/prospeccion/sentinel-attention", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo cargar la vigilancia Sentinel.")
      setSentinelAttention(body as SentinelAttentionSummary)
    } catch (cause) {
      console.warn("[Prospeccion] sentinel attention", cause)
    } finally {
      setSentinelAttentionLoading(false)
    }
  }


  async function loadCrossLayerSignals() {
    setCrossLayerSignalsLoading(true)
    try {
      const response = await fetch("/api/prospeccion/signals", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudieron construir las señales de prospección.")
      setCrossLayerSignals(body as CrossLayerSignalSummary)
    } catch (cause) {
      console.warn("[Prospeccion] cross-layer signals", cause)
    } finally {
      setCrossLayerSignalsLoading(false)
    }
  }

  useEffect(() => { void Promise.all([loadMandates(), loadClients(), loadSentinelAttention(), loadCrossLayerSignals()]) }, [])

  function applyClient(clientId: string) {
    setSelectedClientId(clientId)
    setActiveMandateId(null)
    const client = clients.find((item) => item.id === clientId)
    if (!client) return
    if (client.criteria.region) setRegion(client.criteria.region)
    if (client.criteria.commune) setCommune(client.criteria.commune)
    if (client.criteria.minHa != null) setMinHa(String(client.criteria.minHa))
    if (client.criteria.maxHa != null) setMaxHa(String(client.criteria.maxHa))
    if (!mandateName.trim()) setMandateName(`Búsqueda · ${client.name}`)
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    setError(null)
    setActiveMandateId(null)
    setOwnerLookupResults({})
    const params = new URLSearchParams()
    if (region) params.set("region", region)
    if (commune) params.set("commune", commune)
    if (species) params.set("species", species)
    if (minHa) params.set("minHa", minHa)
    if (maxHa) params.set("maxHa", maxHa)
    params.set("limit", "60")
    try {
      const response = await fetch(`/api/prospeccion?${params.toString()}`, { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo ejecutar la prospección.")
      setData(body)
      await Promise.all([loadSentinelAttention(), loadCrossLayerSignals()])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo ejecutar la prospección.")
    } finally { setLoading(false) }
  }

  async function saveMandate() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/prospeccion/mandates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: mandateName, clientId: selectedClientId || null, region, commune, species, minHa, maxHa }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo guardar el mandato.")
      setMandateName("")
      if (body.mandate?.id) setActiveMandateId(body.mandate.id)
      await loadMandates()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el mandato.")
    } finally { setSaving(false) }
  }

  async function runMandate(mandate: Mandate) {
    setRunningMandateId(mandate.id)
    setError(null)
    try {
      const response = await fetch(`/api/prospeccion/mandates/${mandate.id}/run`, { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo ejecutar el mandato.")
      setActiveMandateId(mandate.id)
      setSelectedClientId(mandate.client_id || "")
      setRegion(mandate.region || "")
      setCommune(mandate.commune || "")
      setSpecies(mandate.species || "")
      setMinHa(mandate.min_ha == null ? "" : String(mandate.min_ha))
      setMaxHa(mandate.max_ha == null ? "" : String(mandate.max_ha))
      setOwnerLookupResults({})
      setData({
        candidates: body.candidates ?? [],
        count: body.count ?? 0,
        offMarketProspects: body.offMarketProspects ?? [],
        offMarketCount: body.offMarketCount ?? body.offMarketProspects?.length ?? 0,
        cases: body.cases ?? [],
        priorityCases: body.priorityCases ?? [],
        outcome: body.outcome,
        publicEvidence: body.publicEvidence,
        infrastructure: body.infrastructure,
        note: body.firstRun ? "Primera ejecución registrada." : body.newCount > 0 ? `${body.newCount} candidato${body.newCount === 1 ? " nuevo" : "s nuevos"}.` : "Sin candidatos nuevos.",
        coverage: body.coverage ?? { market: "active", kmz: "available-in-detail-flow", speciesClassification: "pending-satellite-pipeline", autonomousDiscovery: "official-polygon-discovery-active" },
      })
      await Promise.all([loadMandates(), loadSentinelAttention()])
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo ejecutar el mandato.") } finally { setRunningMandateId(null) }
  }

  async function createFollowUpTask(candidate: Candidate) {
    if (!activeMandateId || !selectedClientId) return
    setCreatingTaskFor(candidate.id)
    setError(null)
    try {
      const response = await fetch("/api/prospeccion/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: selectedClientId, mandateId: activeMandateId, candidateId: candidate.id }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo crear la tarea comercial.")
      setTaskCreatedCandidateIds((previous) => new Set(previous).add(candidate.id))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la tarea comercial.") } finally { setCreatingTaskFor(null) }
  }

  async function ownerResearch(prospect: OffMarketProspect) {
    const response = await fetch("/api/prospeccion/off-market-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: prospect.rol, commune: prospect.commune }),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "No se pudo investigar el propietario.")
    return body as OwnerLookupResult
  }

  async function investigateOwner(prospect: OffMarketProspect) {
    setOwnerLookupRol(prospect.rol)
    setError(null)
    try {
      const body = await ownerResearch(prospect)
      setOwnerLookupResults((previous) => ({ ...previous, [prospect.rol]: body }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo investigar el propietario.")
    } finally {
      setOwnerLookupRol(null)
    }
  }

  async function investigatePriorityOwners() {
    if (!data?.priorityCases?.length || !data.offMarketProspects?.length) return
    const byRol = new Map(data.offMarketProspects.map((item) => [item.rol, item]))
    const targets = data.priorityCases
      .filter((item) => item.kind === "off_market" && item.rol && !ownerLookupResults[item.rol])
      .map((item) => byRol.get(String(item.rol)))
      .filter((item): item is OffMarketProspect => Boolean(item))
      .slice(0, 3)
    if (!targets.length) return

    setResearchingPriority(true)
    setError(null)
    try {
      for (const prospect of targets) {
        setOwnerLookupRol(prospect.rol)
        try {
          const result = await ownerResearch(prospect)
          setOwnerLookupResults((previous) => ({ ...previous, [prospect.rol]: result }))
        } catch (cause) {
          console.warn("[Prospeccion] priority owner research", prospect.rol, cause)
        }
      }
    } finally {
      setOwnerLookupRol(null)
      setResearchingPriority(false)
    }
  }

  function changeRegion(nextRegion: string) {
    setRegion(nextRegion)
    const next = CHILEAN_REGIONS.find((item) => item.shortName === nextRegion)
    const currentCommuneStillValid = next?.provincias.some((province) => province.comunas.some((item) => normalizeSelection(item.name) === normalizeSelection(commune)))
    if (!currentCommuneStillValid) setCommune("")
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6">
      <WorkspaceHeading eyebrow="Prospección inteligente" title="Poner más campos sobre la mesa" description="Define comuna, sector, superficie y especie objetivo. Sur Realista rastrea mercado publicado y catastros oficiales para entregar opciones concretas, incluyendo ROL fuera de portales, y prioriza qué investigar primero." outcome="Resultado útil: 3 prioridades claras + cola secundaria + siguiente acción verificable." />

      <form onSubmit={runSearch} className="grid gap-4 border-y border-border bg-card px-4 py-5 md:grid-cols-2 xl:grid-cols-5 sm:px-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Región</label>
          <ProspectingCombobox value={region} options={regionOptions} onChange={changeRegion} placeholder="Busca una región" emptyLabel="No encontramos esa región" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Comuna / sector</label>
          <ProspectingCombobox value={commune} options={communeOptions} onChange={setCommune} placeholder={region ? "Busca una comuna" : "Selecciona región primero"} emptyLabel="No encontramos esa comuna en la región" disabled={!region} />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Especie objetivo</label>
          <ProspectingCombobox value={species} options={speciesOptions} onChange={setSpecies} placeholder="Ej. cereza, manzana, nogal" emptyLabel="No encontramos esa especie" />
        </div>
        <div className="grid grid-cols-2 gap-2"><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Mín. ha</label><Input inputMode="decimal" value={minHa} onChange={(e) => setMinHa(e.target.value)} placeholder="15" /></div><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Máx. ha</label><Input inputMode="decimal" value={maxHa} onChange={(e) => setMaxHa(e.target.value)} placeholder="80" /></div></div>
        <div className="flex items-end gap-2"><Button type="submit" className="flex-1" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}Prospectar</Button>{data ? <Button type="button" variant="outline" size="icon" onClick={() => void runSearch()} disabled={loading} aria-label="Actualizar"><RefreshCw className="h-4 w-4" aria-hidden="true" /></Button> : null}</div>
      </form>

      {data?.outcome ? <Card className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge>{data.outcome.status.replaceAll("_", " ")}</Badge><Badge variant="outline">{data.outcome.generatedBy === "ai" ? "Síntesis IA" : "Evidencia"}</Badge></div><h2 className="mt-4 text-xl font-medium">Resultado de la prospección</h2><p className="mt-2 max-w-5xl text-sm leading-6">{data.outcome.summary}</p><p className="mt-3 text-sm"><span className="text-muted-foreground">Siguiente acción:</span> {data.outcome.recommendation}</p><div className="mt-5 grid gap-3 md:grid-cols-4"><div><p className="text-xs text-muted-foreground">Publicados</p><p className="mt-1 text-2xl font-medium">{data.count}</p></div><div><p className="text-xs text-muted-foreground">Fuera de portal</p><p className="mt-1 text-2xl font-medium">{data.offMarketCount ?? data.offMarketProspects?.length ?? 0}</p></div><div><p className="text-xs text-muted-foreground">Riego regional</p><p className="mt-1 text-sm font-medium">{data.infrastructure?.irrigation.status === "available" ? `${data.infrastructure.irrigation.canalFeatures} canales · ${data.infrastructure.irrigation.intakeFeatures} bocatomas` : "Pendiente"}</p></div><div><p className="text-xs text-muted-foreground">Suelos</p><p className="mt-1 text-sm font-medium">{data.infrastructure?.soils.status === "available" ? "Cobertura disponible" : "Pendiente"}</p></div></div></Card> : null}


      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cruce de capas</p>
            <h2 className="mt-1 text-xl font-medium">Señales de prospección</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Prioriza ROL donde convergen ubicación/SII, propietario, CIREN, memoria Sentinel y cobertura de mercado. El score ordena evidencia; no predice intención de venta.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {crossLayerSignalsLoading ? <Badge variant="outline">Actualizando señales</Badge> : crossLayerSignals ? <>
              <Badge>{crossLayerSignals.highPriorityCount} prioridad alta</Badge>
              <Badge variant="outline">{crossLayerSignals.actionableCount} señales activas</Badge>
              <Badge variant="outline">{crossLayerSignals.monitoredRols} ROL monitoreados</Badge>
            </> : null}
          </div>
        </div>

        {crossLayerSignalsLoading ? <Card className="flex items-center gap-3 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Cruzando evidencia territorial, satelital y de mercado…</Card> : crossLayerSignals?.items.length ? <div className="grid gap-3 xl:grid-cols-3">
          {crossLayerSignals.items.slice(0, 6).map((signal, index) => <Card key={signal.rol} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Badge>#{index + 1}</Badge><Badge variant={signal.level === "alta" ? "default" : "outline"}>{signal.level === "alta" ? "Prioridad alta" : signal.level === "media" ? "Prioridad media" : "Observar"}</Badge></div>
              <span className="text-xs text-muted-foreground">convergencia {signal.score}/100</span>
            </div>
            <h3 className="mt-4 text-lg font-medium">ROL {signal.rol}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{[signal.commune, signal.region].filter(Boolean).join(" · ") || "Ubicación parcial"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">Sentinel · {signal.anomaly.level === "strong" ? "cambio fuerte" : "vigilar"}</Badge>
              <Badge variant="outline">CIREN · {signal.cirenStatus}</Badge>
              {signal.contactAvailable ? <Badge variant="outline">Contacto verificable</Badge> : signal.ownerName ? <Badge variant="outline">Propietario identificado</Badge> : <Badge variant="outline">Propietario pendiente</Badge>}
              {signal.marketSampleCount > 0 ? <Badge variant="outline">{signal.marketSampleCount} muestras mercado</Badge> : null}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted-foreground">NDVI</span><p className="mt-1 font-medium">{signal.latest.ndvi == null ? "—" : signal.latest.ndvi.toFixed(3)}</p></div>
              <div><span className="text-muted-foreground">NDRE</span><p className="mt-1 font-medium">{signal.latest.ndre == null ? "—" : signal.latest.ndre.toFixed(3)}</p></div>
              <div><span className="text-muted-foreground">NDMI</span><p className="mt-1 font-medium">{signal.latest.ndmi == null ? "—" : signal.latest.ndmi.toFixed(3)}</p></div>
            </div>
            <p className="mt-4 text-sm leading-6">{signal.anomaly.interpretation}</p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{signal.reasons.slice(1).join(" · ")}</p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-medium">{signal.nextAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline"><Link href={`/prospeccion/sentinel?rol=${encodeURIComponent(signal.rol)}`}><Radar className="h-4 w-4" aria-hidden="true" />Ver evidencia<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
              </div>
            </div>
          </Card>)}
        </div> : <Card className="p-5 text-sm text-muted-foreground">No hay señales temporales que superen los umbrales de atención en este momento.</Card>}
      </section>

      {data?.priorityCases?.length ? <section className="space-y-4"><div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Qué importa ahora</p><h2 className="mt-1 text-xl font-medium">Prioridades de hoy</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">El Core ordena la evidencia y deja sólo tres casos arriba. La memoria Sentinel entra aquí únicamente cuando detecta un cambio espectral persistente que requiere revisión.</p></div><div className="flex flex-wrap items-center gap-2">{sentinelAttentionLoading ? <Badge variant="outline">Sentinel · actualizando</Badge> : sentinelAttention ? <Button asChild variant={sentinelAttention.actionableCount > 0 ? "default" : "outline"} size="sm"><Link href="/prospeccion/sentinel/alertas"><Radar className="h-4 w-4" aria-hidden="true" />{sentinelAttention.actionableCount > 0 ? `${sentinelAttention.actionableCount} cambio${sentinelAttention.actionableCount === 1 ? "" : "s"} Sentinel` : `${sentinelAttention.monitoredRols} ROL sin alertas`}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button> : null}<Button type="button" onClick={() => void investigatePriorityOwners()} disabled={researchingPriority || !data.priorityCases.some((item) => item.kind === "off_market" && item.rol && !ownerLookupResults[item.rol])}>{researchingPriority ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserRound className="h-4 w-4" aria-hidden="true" />}Investigar top 3</Button></div></div><div className="grid gap-3 xl:grid-cols-3">{data.priorityCases.map((item, index) => { const lookup = item.rol ? ownerLookupResults[item.rol] : null; const ownerName = lookup?.owner?.name || item.owner?.name || null; const sentinelSignal = item.rol ? sentinelAttention?.items.find((signal) => signal.rol === item.rol) : null; return <Card key={item.id} className="p-5"><div className="flex items-center justify-between gap-3"><Badge>#{index + 1}</Badge><span className="text-xs text-muted-foreground">score {item.score}/100</span></div><h3 className="mt-4 text-lg font-medium">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.location}{item.areaHa != null ? ` · ${item.areaHa.toLocaleString("es-CL")} ha` : ""}</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline">{caseStatusLabel(item.status)}</Badge>{item.speciesEvidence.declared.length ? <Badge variant="outline">{item.speciesEvidence.declared[0]}</Badge> : null}{sentinelSignal ? <Badge variant="outline">Sentinel · {sentinelSignal.anomaly.level === "strong" ? "cambio fuerte" : "vigilar"}{sentinelSignal.anomaly.ndviDelta != null ? ` · ΔNDVI ${sentinelSignal.anomaly.ndviDelta > 0 ? "+" : ""}${sentinelSignal.anomaly.ndviDelta.toFixed(2)}` : ""}</Badge> : null}</div>{sentinelSignal ? <><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><span className="text-muted-foreground">NDVI</span><p className="mt-1 font-medium">{sentinelSignal.latest.ndvi == null ? "—" : sentinelSignal.latest.ndvi.toFixed(3)}</p></div><div><span className="text-muted-foreground">NDRE</span><p className="mt-1 font-medium">{sentinelSignal.latest.ndre == null ? "—" : sentinelSignal.latest.ndre.toFixed(3)}</p></div><div><span className="text-muted-foreground">NDMI</span><p className="mt-1 font-medium">{sentinelSignal.latest.ndmi == null ? "—" : sentinelSignal.latest.ndmi.toFixed(3)}</p></div></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{sentinelSignal.observationCount} observaciones persistidas · cambio espectral, no diagnóstico agronómico.</p></> : null}<div className="mt-4 border-l-2 border-border pl-3">{ownerName ? <><p className="text-sm font-medium">Propietario candidato: {ownerName}</p><p className="mt-1 text-xs text-muted-foreground">Requiere validación registral antes de contacto.</p></> : lookup?.producer ? <><p className="text-sm font-medium">Productor/operador: {lookup.producer.name}</p><p className="mt-1 text-xs text-muted-foreground">No equivale a propietario legal.</p></> : lookup?.historicalOwner ? <><p className="text-sm font-medium">Propietario histórico: {lookup.historicalOwner.name}</p><p className="mt-1 text-xs text-muted-foreground">No asumir vigencia actual.</p></> : <><p className="text-sm font-medium">Propietario por resolver</p><p className="mt-1 text-xs text-muted-foreground">{item.nextAction}</p></>}</div></Card>})}</div><div className="grid gap-3 md:grid-cols-4"><Card className="p-4"><p className="text-xs text-muted-foreground">Cola total</p><p className="mt-1 text-2xl font-medium">{queueSummary.total}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Investigados</p><p className="mt-1 text-2xl font-medium">{queueSummary.investigated}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Propietario identificado</p><p className="mt-1 text-2xl font-medium">{queueSummary.ownerIdentified}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="mt-1 text-2xl font-medium">{queueSummary.pending}</p></Card></div></section> : null}

      {data?.offMarketProspects?.length ? <section className="space-y-4"><div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cola secundaria</p><h2 className="mt-1 text-xl font-medium">Prospectos para seguir investigando</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Cada fila es un ROL real encontrado en catastro oficial. No significa que esté a la venta. Las prioridades de arriba son las que conviene trabajar primero.</p></div><Badge variant="outline">{data.offMarketProspects.length} opciones</Badge></div><div className="grid gap-3 xl:grid-cols-2">{data.offMarketProspects.map((prospect) => { const lookup = ownerLookupResults[prospect.rol]; return <Card key={prospect.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>Fuera de portal</Badge><Badge variant="outline">Detectado</Badge>{prospect.targetSpeciesMatch ? <Badge variant="outline">Especie declarada</Badge> : null}</div><h3 className="mt-3 text-lg font-medium">ROL {prospect.rol}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{prospect.commune || "Comuna pendiente"} · Catastro {prospect.surveyYear}</p><p className="mt-3 text-sm">{prospect.declaredSpecies.length ? prospect.declaredSpecies.join(" · ") : "Sin especie declarada"}</p><p className="mt-2 text-xs text-muted-foreground">{prospect.evidenceLabel}</p>{lookup ? <div className="mt-4 border-l-2 border-border pl-3">{lookup.owner ? <><p className="text-sm font-medium">Propietario candidato: {lookup.owner.name}</p><p className="mt-1 text-xs text-muted-foreground">Confianza {Math.round(lookup.owner.confidence * 100)}% · fuente {lookup.owner.source}. Validar antes de contacto.</p></> : lookup.producer ? <><p className="text-sm font-medium">Productor/operador asociado: {lookup.producer.name}</p><p className="mt-1 text-xs text-muted-foreground">No equivale a propietario legal. {lookup.nextAction}</p></> : lookup.historicalOwner ? <><p className="text-sm font-medium">Propietario histórico: {lookup.historicalOwner.name}</p><p className="mt-1 text-xs text-muted-foreground">No asumir vigencia actual. {lookup.nextAction}</p></> : <><p className="text-sm font-medium">Propietario aún no resuelto</p><p className="mt-1 text-xs text-muted-foreground">{lookup.nextAction}</p></>}</div> : null}</div><div className="flex shrink-0 flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/prospeccion/sentinel?rol=${encodeURIComponent(prospect.rol)}`}><Radar className="h-4 w-4" aria-hidden="true" />Analizar campo</Link></Button><Button type="button" variant={lookup?.owner ? "outline" : "default"} onClick={() => void investigateOwner(prospect)} disabled={ownerLookupRol === prospect.rol}>{ownerLookupRol === prospect.rol ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : lookup?.owner ? <Check className="h-4 w-4" aria-hidden="true" /> : <UserRound className="h-4 w-4" aria-hidden="true" />}{lookup?.owner ? "Revalidar propietario" : "Investigar propietario"}</Button></div></div></Card>})}</div></section> : null}

      <section className="grid gap-4 md:grid-cols-4"><Card className="p-4"><p className="text-xs text-muted-foreground">Búsqueda</p><p className="mt-1 text-sm font-medium">{criteriaSummary}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Especie satelital</p><p className="mt-1 text-sm font-medium">No verificada todavía</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Opciones totales</p><p className="mt-1 text-2xl font-medium">{data ? data.count + (data.offMarketCount ?? data.offMarketProspects?.length ?? 0) : "—"}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Cliente</p><p className="mt-1 text-sm font-medium">{selectedClient?.name || "Opcional"}</p></Card></section>

      <section className="space-y-3"><div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Búsquedas vivas</p><h2 className="mt-1 text-xl font-medium">Mandatos guardados</h2><p className="mt-1 text-sm text-muted-foreground">Los mandatos activos se revisan automáticamente cada día. Aquí puedes ejecutarlos también bajo demanda. No requiere cliente.</p></div><div className="flex w-full gap-2 lg:w-auto"><Input className="lg:w-72" value={mandateName} onChange={(e) => setMandateName(e.target.value)} placeholder="Nombre del mandato" /><Button type="button" variant="outline" onClick={() => void saveMandate()} disabled={saving || !mandateName.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}Guardar</Button></div></div>{mandatesError ? <Card className="p-4 text-sm text-muted-foreground">Mandatos persistentes aún no disponibles: {mandatesError}</Card> : loadingMandates ? <Card className="p-5 text-sm text-muted-foreground">Cargando mandatos…</Card> : !mandates.length ? <Card className="p-5 text-sm text-muted-foreground">Todavía no hay mandatos guardados.</Card> : <div className="grid gap-3 xl:grid-cols-2">{mandates.map((mandate) => <Card key={mandate.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{mandate.name}</h3><Badge variant={mandate.status === "active" ? "default" : "secondary"}>{mandate.status}</Badge>{mandate.last_new_candidate_count > 0 ? <Badge variant="outline">{mandate.last_new_candidate_count} nuevos</Badge> : null}</div><p className="mt-2 text-sm text-muted-foreground">{mandateSummary(mandate)}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{mandate.last_candidate_count} candidatos</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{mandate.last_run_at ? new Date(mandate.last_run_at).toLocaleString("es-CL") : "Nunca ejecutado"}</span></div></div><Button type="button" variant="outline" onClick={() => void runMandate(mandate)} disabled={runningMandateId === mandate.id || mandate.status !== "active"}>{runningMandateId === mandate.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}Ejecutar</Button></div></Card>)}</div>}</section>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}
      {!data && !loading ? <Card className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center"><Sprout className="h-8 w-8 text-primary" aria-hidden="true" /><h2 className="text-lg font-medium">Define qué campo estás buscando</h2><p className="max-w-2xl text-sm leading-6 text-muted-foreground">La meta no es esperar un aviso: es generar alternativas, verificar las que calzan e investigar propietario cuando existe evidencia suficiente.</p></Card> : null}

      {data?.candidates?.length ? <div className="space-y-4"><div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mercado publicado</p><h2 className="mt-1 text-xl font-medium">Candidatos publicados</h2></div><Badge variant="outline">{data.count} candidatos</Badge></div><div className="space-y-3">{data.candidates.map((candidate) => { const taskCreated = taskCreatedCandidateIds.has(candidate.id); return <Card key={candidate.id} className="p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>{candidate.prospecting_fit_score}/100 ajuste</Badge><Badge variant="outline">{candidate.opportunity_score}/100 mercado</Badge><span className="text-xs text-muted-foreground">confianza {candidate.confidence}%</span></div><h3 className="mt-3 text-lg font-medium">{candidate.title}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{[candidate.commune, candidate.region].filter(Boolean).join(" · ") || "Ubicación pendiente"}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span><b>{candidate.area_ha.toLocaleString("es-CL")} ha</b></span><span>{candidate.discount_pct}% bajo benchmark</span><span>{candidate.benchmark.sample_count} comparables</span><span>{candidate.benchmark.source_count} fuentes</span></div></div><div className="flex shrink-0 flex-wrap gap-2">{activeMandateId && selectedClientId ? <Button type="button" onClick={() => void createFollowUpTask(candidate)} disabled={creatingTaskFor === candidate.id || taskCreated}>{creatingTaskFor === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : taskCreated ? <Check className="h-4 w-4" aria-hidden="true" /> : null}{taskCreated ? "Tarea creada" : "Crear seguimiento"}</Button> : null}<Button asChild variant="outline"><Link href={`/home-spotter/opportunities/${candidate.id}`}>Ver evidencia<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></div></div></Card>})}</div></div> : data && !data.candidates.length && !data.offMarketProspects?.length ? <Card className="p-8 text-center text-sm text-muted-foreground">No encontramos opciones verificables con estos criterios en esta ejecución.</Card> : null}

      <Card className="p-5"><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Vincular cliente después de prospectar</label><select value={selectedClientId} onChange={(event) => applyClient(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Sin cliente vinculado</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.mainInterest ? ` · ${client.mainInterest}` : ""}</option>)}</select></div><div className="text-sm text-muted-foreground">{selectedClient ? <span className="flex items-center gap-2"><UserRound className="h-4 w-4" aria-hidden="true" />{selectedClient.name} · {selectedClient.clientType}</span> : "Opcional. Sólo habilita seguimiento comercial."}</div></div></Card>
    </main>
  )
}
