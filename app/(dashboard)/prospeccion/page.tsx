"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Clock3, Loader2, MapPin, Play, Radar, RefreshCw, Save, Sprout, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

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
  stage: "detected"
  ownerStatus: "pending"
  contactStatus: "pending"
  evidenceLabel: string
}

type OwnerLookupResult = {
  owner: { name: string; confidence: number; source: string; evidenceUrl: string; documentType: string | null } | null
  status: "owner_candidate_found" | "owner_pending"
  nextAction: string
}

type ProspectingResponse = {
  candidates: Candidate[]
  count: number
  offMarketProspects?: OffMarketProspect[]
  offMarketCount?: number
  note: string
  outcome?: {
    status: "qualified_candidates" | "regional_expansion" | "official_off_market_signal" | "no_match"
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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingMandates, setLoadingMandates] = useState(true)
  const [runningMandateId, setRunningMandateId] = useState<string | null>(null)
  const [creatingTaskFor, setCreatingTaskFor] = useState<string | null>(null)
  const [taskCreatedCandidateIds, setTaskCreatedCandidateIds] = useState<Set<string>>(new Set())
  const [ownerLookupRol, setOwnerLookupRol] = useState<string | null>(null)
  const [ownerLookupResults, setOwnerLookupResults] = useState<Record<string, OwnerLookupResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [mandatesError, setMandatesError] = useState<string | null>(null)

  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedClientId) || null, [clients, selectedClientId])
  const criteriaSummary = useMemo(() => {
    const parts = [region, commune, species, minHa ? `${minHa}+ ha` : "", maxHa ? `hasta ${maxHa} ha` : ""].filter(Boolean)
    return parts.length ? parts.join(" · ") : "Sin criterios aplicados"
  }, [region, commune, species, minHa, maxHa])

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

  useEffect(() => { void Promise.all([loadMandates(), loadClients()]) }, [])

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
      setData({ candidates: body.candidates ?? [], count: body.count ?? 0, note: body.firstRun ? "Primera ejecución registrada." : body.newCount > 0 ? `${body.newCount} candidato${body.newCount === 1 ? " nuevo" : "s nuevos"}.` : "Sin candidatos nuevos.", coverage: { market: "active", kmz: "available-in-detail-flow", speciesClassification: "pending-satellite-pipeline", autonomousDiscovery: "not-yet-active" } })
      await loadMandates()
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

  async function investigateOwner(prospect: OffMarketProspect) {
    setOwnerLookupRol(prospect.rol)
    setError(null)
    try {
      const response = await fetch("/api/prospeccion/off-market-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: prospect.rol, commune: prospect.commune }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo investigar el propietario.")
      setOwnerLookupResults((previous) => ({ ...previous, [prospect.rol]: body }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo investigar el propietario.")
    } finally {
      setOwnerLookupRol(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6">
      <WorkspaceHeading eyebrow="Prospección inteligente" title="Poner más campos sobre la mesa" description="Define comuna, sector, superficie y especie objetivo. Sur Realista rastrea mercado publicado y catastros oficiales para entregar opciones concretas, incluyendo ROL fuera de portales, y permite investigar propietario antes de contacto." outcome="Resultado útil: opciones publicadas + prospectos fuera de portal + siguiente acción verificable." />

      <form onSubmit={runSearch} className="grid gap-4 border-y border-border bg-card px-4 py-5 md:grid-cols-2 xl:grid-cols-5 sm:px-6">
        <div><label className="mb-2 block text-xs font-medium text-muted-foreground">Región</label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Ej. Maule" /></div>
        <div><label className="mb-2 block text-xs font-medium text-muted-foreground">Comuna / sector</label><Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Ej. Curicó" /></div>
        <div><label className="mb-2 block text-xs font-medium text-muted-foreground">Especie objetivo</label><Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ej. cerezos" /></div>
        <div className="grid grid-cols-2 gap-2"><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Mín. ha</label><Input inputMode="decimal" value={minHa} onChange={(e) => setMinHa(e.target.value)} placeholder="15" /></div><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Máx. ha</label><Input inputMode="decimal" value={maxHa} onChange={(e) => setMaxHa(e.target.value)} placeholder="80" /></div></div>
        <div className="flex items-end gap-2"><Button type="submit" className="flex-1" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}Prospectar</Button>{data ? <Button type="button" variant="outline" size="icon" onClick={() => void runSearch()} disabled={loading} aria-label="Actualizar"><RefreshCw className="h-4 w-4" aria-hidden="true" /></Button> : null}</div>
      </form>

      {data?.outcome ? <Card className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge>{data.outcome.status.replaceAll("_", " ")}</Badge><Badge variant="outline">{data.outcome.generatedBy === "ai" ? "Síntesis IA" : "Evidencia"}</Badge></div><h2 className="mt-4 text-xl font-medium">Resultado de la prospección</h2><p className="mt-2 max-w-5xl text-sm leading-6">{data.outcome.summary}</p><p className="mt-3 text-sm"><span className="text-muted-foreground">Siguiente acción:</span> {data.outcome.recommendation}</p><div className="mt-5 grid gap-3 md:grid-cols-4"><div><p className="text-xs text-muted-foreground">Publicados</p><p className="mt-1 text-2xl font-medium">{data.count}</p></div><div><p className="text-xs text-muted-foreground">Fuera de portal</p><p className="mt-1 text-2xl font-medium">{data.offMarketCount ?? data.offMarketProspects?.length ?? 0}</p></div><div><p className="text-xs text-muted-foreground">Riego regional</p><p className="mt-1 text-sm font-medium">{data.infrastructure?.irrigation.status === "available" ? `${data.infrastructure.irrigation.canalFeatures} canales · ${data.infrastructure.irrigation.intakeFeatures} bocatomas` : "Pendiente"}</p></div><div><p className="text-xs text-muted-foreground">Suelos</p><p className="mt-1 text-sm font-medium">{data.infrastructure?.soils.status === "available" ? "Cobertura disponible" : "Pendiente"}</p></div></div></Card> : null}

      {data?.offMarketProspects?.length ? <section className="space-y-4"><div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Antes del portal</p><h2 className="mt-1 text-xl font-medium">Prospectos fuera de mercado</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Cada fila es un ROL real encontrado en catastro oficial. No significa que esté a la venta: es una opción concreta para verificar, investigar propietario y decidir si vale la pena contactar.</p></div><Badge variant="outline">{data.offMarketProspects.length} opciones</Badge></div><div className="grid gap-3 xl:grid-cols-2">{data.offMarketProspects.map((prospect) => { const lookup = ownerLookupResults[prospect.rol]; return <Card key={prospect.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>Fuera de portal</Badge><Badge variant="outline">Detectado</Badge>{prospect.targetSpeciesMatch ? <Badge variant="outline">Especie declarada</Badge> : null}</div><h3 className="mt-3 text-lg font-medium">ROL {prospect.rol}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{prospect.commune || "Comuna pendiente"} · Catastro {prospect.surveyYear}</p><p className="mt-3 text-sm">{prospect.declaredSpecies.length ? prospect.declaredSpecies.join(" · ") : "Sin especie declarada"}</p><p className="mt-2 text-xs text-muted-foreground">{prospect.evidenceLabel}</p>{lookup ? <div className="mt-4 border-l-2 border-border pl-3">{lookup.owner ? <><p className="text-sm font-medium">Propietario candidato: {lookup.owner.name}</p><p className="mt-1 text-xs text-muted-foreground">Confianza {Math.round(lookup.owner.confidence * 100)}% · fuente {lookup.owner.source}. Validar antes de contacto.</p></> : <><p className="text-sm font-medium">Propietario aún no resuelto</p><p className="mt-1 text-xs text-muted-foreground">{lookup.nextAction}</p></>}</div> : null}</div><div className="shrink-0"><Button type="button" variant={lookup?.owner ? "outline" : "default"} onClick={() => void investigateOwner(prospect)} disabled={ownerLookupRol === prospect.rol}>{ownerLookupRol === prospect.rol ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : lookup?.owner ? <Check className="h-4 w-4" aria-hidden="true" /> : <UserRound className="h-4 w-4" aria-hidden="true" />}{lookup?.owner ? "Revalidar propietario" : "Investigar propietario"}</Button></div></div></Card>})}</div></section> : null}

      <section className="grid gap-4 md:grid-cols-4"><Card className="p-4"><p className="text-xs text-muted-foreground">Búsqueda</p><p className="mt-1 text-sm font-medium">{criteriaSummary}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Especie satelital</p><p className="mt-1 text-sm font-medium">No verificada todavía</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Opciones totales</p><p className="mt-1 text-2xl font-medium">{data ? data.count + (data.offMarketCount ?? data.offMarketProspects?.length ?? 0) : "—"}</p></Card><Card className="p-4"><p className="text-xs text-muted-foreground">Cliente</p><p className="mt-1 text-sm font-medium">{selectedClient?.name || "Opcional"}</p></Card></section>

      <section className="space-y-3"><div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Búsquedas vivas</p><h2 className="mt-1 text-xl font-medium">Mandatos guardados</h2><p className="mt-1 text-sm text-muted-foreground">Guarda la prospección para volver a ejecutarla y detectar nuevas entradas. No requiere cliente.</p></div><div className="flex w-full gap-2 lg:w-auto"><Input className="lg:w-72" value={mandateName} onChange={(e) => setMandateName(e.target.value)} placeholder="Nombre del mandato" /><Button type="button" variant="outline" onClick={() => void saveMandate()} disabled={saving || !mandateName.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}Guardar</Button></div></div>{mandatesError ? <Card className="p-4 text-sm text-muted-foreground">Mandatos persistentes aún no disponibles: {mandatesError}</Card> : loadingMandates ? <Card className="p-5 text-sm text-muted-foreground">Cargando mandatos…</Card> : !mandates.length ? <Card className="p-5 text-sm text-muted-foreground">Todavía no hay mandatos guardados.</Card> : <div className="grid gap-3 xl:grid-cols-2">{mandates.map((mandate) => <Card key={mandate.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{mandate.name}</h3><Badge variant={mandate.status === "active" ? "default" : "secondary"}>{mandate.status}</Badge>{mandate.last_new_candidate_count > 0 ? <Badge variant="outline">{mandate.last_new_candidate_count} nuevos</Badge> : null}</div><p className="mt-2 text-sm text-muted-foreground">{mandateSummary(mandate)}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{mandate.last_candidate_count} candidatos</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{mandate.last_run_at ? new Date(mandate.last_run_at).toLocaleString("es-CL") : "Nunca ejecutado"}</span></div></div><Button type="button" variant="outline" onClick={() => void runMandate(mandate)} disabled={runningMandateId === mandate.id || mandate.status !== "active"}>{runningMandateId === mandate.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}Ejecutar</Button></div></Card>)}</div>}</section>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}
      {!data && !loading ? <Card className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center"><Sprout className="h-8 w-8 text-primary" aria-hidden="true" /><h2 className="text-lg font-medium">Define qué campo estás buscando</h2><p className="max-w-2xl text-sm leading-6 text-muted-foreground">La meta no es esperar un aviso: es generar alternativas, verificar las que calzan e investigar propietario cuando existe evidencia suficiente.</p></Card> : null}

      {data?.candidates?.length ? <div className="space-y-4"><div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mercado publicado</p><h2 className="mt-1 text-xl font-medium">Candidatos publicados</h2></div><Badge variant="outline">{data.count} candidatos</Badge></div><div className="space-y-3">{data.candidates.map((candidate) => { const taskCreated = taskCreatedCandidateIds.has(candidate.id); return <Card key={candidate.id} className="p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge>{candidate.prospecting_fit_score}/100 ajuste</Badge><Badge variant="outline">{candidate.opportunity_score}/100 mercado</Badge><span className="text-xs text-muted-foreground">confianza {candidate.confidence}%</span></div><h3 className="mt-3 text-lg font-medium">{candidate.title}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{[candidate.commune, candidate.region].filter(Boolean).join(" · ") || "Ubicación pendiente"}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span><b>{candidate.area_ha.toLocaleString("es-CL")} ha</b></span><span>{candidate.discount_pct}% bajo benchmark</span><span>{candidate.benchmark.sample_count} comparables</span><span>{candidate.benchmark.source_count} fuentes</span></div></div><div className="flex shrink-0 flex-wrap gap-2">{activeMandateId && selectedClientId ? <Button type="button" onClick={() => void createFollowUpTask(candidate)} disabled={creatingTaskFor === candidate.id || taskCreated}>{creatingTaskFor === candidate.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : taskCreated ? <Check className="h-4 w-4" aria-hidden="true" /> : null}{taskCreated ? "Tarea creada" : "Crear seguimiento"}</Button> : null}<Button asChild variant="outline"><Link href={`/home-spotter/opportunities/${candidate.id}`}>Ver evidencia<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></div></div></Card>})}</div></div> : data && !data.candidates.length && !data.offMarketProspects?.length ? <Card className="p-8 text-center text-sm text-muted-foreground">No encontramos opciones verificables con estos criterios en esta ejecución.</Card> : null}

      <Card className="p-5"><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div><label className="mb-2 block text-xs font-medium text-muted-foreground">Vincular cliente después de prospectar</label><select value={selectedClientId} onChange={(event) => applyClient(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Sin cliente vinculado</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.mainInterest ? ` · ${client.mainInterest}` : ""}</option>)}</select></div><div className="text-sm text-muted-foreground">{selectedClient ? <span className="flex items-center gap-2"><UserRound className="h-4 w-4" aria-hidden="true" />{selectedClient.name} · {selectedClient.clientType}</span> : "Opcional. Sólo habilita seguimiento comercial."}</div></div></Card>
    </main>
  )
}
