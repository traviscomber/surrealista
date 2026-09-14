"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock3, Loader2, MapPin, Play, Radar, RefreshCw, Save, Sprout } from "lucide-react"

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
  benchmark: {
    sample_count: number
    source_count: number
  }
}

type ProspectingResponse = {
  candidates: Candidate[]
  count: number
  note: string
  coverage: {
    market: string
    kmz: string
    speciesClassification: string
    autonomousDiscovery: string
  }
}

type Mandate = {
  id: string
  name: string
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
  return [
    mandate.region,
    mandate.commune,
    mandate.species,
    mandate.min_ha != null ? `${mandate.min_ha}+ ha` : null,
    mandate.max_ha != null ? `hasta ${mandate.max_ha} ha` : null,
  ].filter(Boolean).join(" · ") || "Sin filtros"
}

export default function ProspeccionPage() {
  const [region, setRegion] = useState("")
  const [commune, setCommune] = useState("")
  const [species, setSpecies] = useState("")
  const [minHa, setMinHa] = useState("")
  const [maxHa, setMaxHa] = useState("")
  const [mandateName, setMandateName] = useState("")
  const [data, setData] = useState<ProspectingResponse | null>(null)
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingMandates, setLoadingMandates] = useState(true)
  const [runningMandateId, setRunningMandateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mandatesError, setMandatesError] = useState<string | null>(null)

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

  useEffect(() => {
    void loadMandates()
  }, [])

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    setLoading(true)
    setError(null)

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
    } finally {
      setLoading(false)
    }
  }

  async function saveMandate() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/prospeccion/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mandateName, region, commune, species, minHa, maxHa }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo guardar el mandato.")
      setMandateName("")
      await loadMandates()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el mandato.")
    } finally {
      setSaving(false)
    }
  }

  async function runMandate(mandate: Mandate) {
    setRunningMandateId(mandate.id)
    setError(null)
    try {
      const response = await fetch(`/api/prospeccion/mandates/${mandate.id}/run`, { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo ejecutar el mandato.")
      setRegion(mandate.region || "")
      setCommune(mandate.commune || "")
      setSpecies(mandate.species || "")
      setMinHa(mandate.min_ha == null ? "" : String(mandate.min_ha))
      setMaxHa(mandate.max_ha == null ? "" : String(mandate.max_ha))
      setData({
        candidates: body.candidates ?? [],
        count: body.count ?? 0,
        note: body.firstRun
          ? "Primera ejecución registrada. Los siguientes cambios podrán identificar candidatos nuevos."
          : body.newCount > 0
            ? `${body.newCount} candidato${body.newCount === 1 ? " nuevo" : "s nuevos"} desde la ejecución anterior.`
            : "Sin candidatos nuevos desde la ejecución anterior.",
        coverage: {
          market: "active",
          kmz: "available-in-detail-flow",
          speciesClassification: "pending-satellite-pipeline",
          autonomousDiscovery: "not-yet-active",
        },
      })
      await loadMandates()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo ejecutar el mandato.")
    } finally {
      setRunningMandateId(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6">
      <WorkspaceHeading
        eyebrow="Prospección inteligente"
        title="Buscar predios antes de que lleguen al mercado"
        description="Define un mandato de búsqueda y prioriza candidatos usando ubicación, superficie y señal de mercado real. La clasificación satelital por especie se incorpora como siguiente capa, sin inventar resultados mientras no exista evidencia."
        outcome="Convertir un requerimiento comercial en una lista corta, explicable y trazable de predios para investigar."
      />

      <form onSubmit={runSearch} className="grid gap-4 border-y border-border bg-card px-4 py-5 md:grid-cols-2 xl:grid-cols-5 sm:px-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Región</label>
          <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Ej. Maule" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Comuna / sector</label>
          <Input value={commune} onChange={(e) => setCommune(e.target.value)} placeholder="Ej. Curicó" />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Especie objetivo</label>
          <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ej. cerezos" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Mín. ha</label>
            <Input inputMode="decimal" value={minHa} onChange={(e) => setMinHa(e.target.value)} placeholder="15" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Máx. ha</label>
            <Input inputMode="decimal" value={maxHa} onChange={(e) => setMaxHa(e.target.value)} placeholder="80" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}
            Buscar candidatos
          </Button>
          {data ? (
            <Button type="button" variant="outline" size="icon" onClick={() => void runSearch()} disabled={loading} aria-label="Actualizar">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </form>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Mandato</p><p className="mt-1 text-sm font-medium">{criteriaSummary}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Mercado</p><p className="mt-1 text-sm font-medium">{data?.coverage.market === "active" ? "Activo" : "Pendiente de ejecutar"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Especie satelital</p><p className="mt-1 text-sm font-medium">Pendiente · no participa del score</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Candidatos</p><p className="mt-1 text-2xl font-medium">{data?.count ?? "—"}</p></Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Búsquedas vivas</p>
            <h2 className="mt-1 text-xl font-medium">Mandatos guardados</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cada ejecución conserva el conjunto anterior y marca sólo los candidatos que aparecieron después.</p>
          </div>
          <div className="flex w-full gap-2 lg:w-auto">
            <Input className="lg:w-72" value={mandateName} onChange={(e) => setMandateName(e.target.value)} placeholder="Nombre del mandato" />
            <Button type="button" variant="outline" onClick={() => void saveMandate()} disabled={saving || !mandateName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Guardar
            </Button>
          </div>
        </div>

        {mandatesError ? (
          <Card className="p-4 text-sm text-muted-foreground">Mandatos persistentes aún no disponibles en este entorno: {mandatesError}</Card>
        ) : loadingMandates ? (
          <Card className="p-5 text-sm text-muted-foreground">Cargando mandatos…</Card>
        ) : !mandates.length ? (
          <Card className="p-5 text-sm text-muted-foreground">Todavía no hay mandatos guardados. Define criterios arriba, nómbralo y guárdalo.</Card>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {mandates.map((mandate) => (
              <Card key={mandate.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{mandate.name}</h3>
                      <Badge variant={mandate.status === "active" ? "default" : "secondary"}>{mandate.status}</Badge>
                      {mandate.last_new_candidate_count > 0 ? <Badge variant="outline">{mandate.last_new_candidate_count} nuevos</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{mandateSummary(mandate)}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{mandate.last_candidate_count} candidatos</span>
                      <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{mandate.last_run_at ? new Date(mandate.last_run_at).toLocaleString("es-CL") : "Nunca ejecutado"}</span>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={() => void runMandate(mandate)} disabled={runningMandateId === mandate.id || mandate.status !== "active"}>
                    {runningMandateId === mandate.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                    Ejecutar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {!data && !loading ? (
        <Card className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
          <Sprout className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-medium">Define el primer mandato</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Prospección v1 trabaja sólo con evidencia disponible hoy. No afirmará detectar cerezos, kiwis u otra especie hasta que exista el pipeline satelital correspondiente.</p>
        </Card>
      ) : null}

      {data ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Resultados</p>
              <h2 className="mt-1 text-xl font-medium">Candidatos priorizados</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{data.note}</p>
            </div>
            <Badge variant="outline">{data.count} candidatos</Badge>
          </div>

          {!data.candidates.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No hay candidatos actuales que cumplan simultáneamente los criterios y tengan evidencia de mercado suficiente.</Card>
          ) : (
            <div className="space-y-3">
              {data.candidates.map((candidate) => (
                <Card key={candidate.id} className="p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{candidate.prospecting_fit_score}/100 ajuste</Badge>
                        <Badge variant="outline">{candidate.opportunity_score}/100 mercado</Badge>
                        <span className="text-xs text-muted-foreground">confianza {candidate.confidence}%</span>
                      </div>
                      <h3 className="mt-3 text-lg font-medium">{candidate.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{[candidate.commune, candidate.region].filter(Boolean).join(" · ") || "Ubicación pendiente"}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span><b>{candidate.area_ha.toLocaleString("es-CL")} ha</b></span>
                        <span>{candidate.discount_pct}% bajo benchmark</span>
                        <span>{candidate.benchmark.sample_count} comparables</span>
                        <span>{candidate.benchmark.source_count} fuentes</span>
                        <span>{candidate.source || "Fuente pendiente"}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button asChild variant="outline"><Link href={`/home-spotter/opportunities/${candidate.id}`}>Ver evidencia<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </main>
  )
}
