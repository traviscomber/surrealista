"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Radar, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

type TerritorialCoverage = {
  scope: "commune" | "region" | "unresolved"
  label: string | null
  kmz_count: number | null
  owner_identified_count: number | null
  owner_evidence_count: number | null
  contact_ready_count: number | null
  sampled: boolean
}

type CandidateLevelEvidence = {
  candidate_count: number
  reliable_point_count: number
  spatial_link_count: number
  owner_evidence_count: number
  contactable_count: number
}

type SpatialLink = {
  candidate_id: string
  kmz_id: string | null
  kmz_name: string | null
  kmz_address: string | null
  distance_km: number
  spatial_confidence: "high" | "medium" | "nearby"
  rol_numbers: string[]
  owner: { name: string; confidence: number; basis: string } | null
  contactable: boolean
  identity_status: "spatial_candidate"
}

type DemandSignal = {
  id: string
  source: string
  min_ha: number | null
  max_ha: number | null
  crop: string | null
  region: string | null
  commune: string | null
  transaction_type: string | null
  production_status: string | null
  raw_requirement: string
  raw_detail: string
  source_url: string
  first_seen_at: string
  last_seen_at: string
  candidate_count: number
  top_candidate_score: number | null
  territorial_coverage: TerritorialCoverage
  candidate_level_evidence: CandidateLevelEvidence
  top_spatial_links: SpatialLink[]
  spatial_note: string
}

function metric(value: number | null, sampled = false) {
  if (value == null) return "—"
  return `${sampled ? "≥" : ""}${value}`
}

export default function MarketDemandPage() {
  const [signals, setSignals] = useState<DemandSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/prospeccion/market-demand", { cache: "no-store" })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "No se pudo cargar la demanda observada.")
        setSignals(body.signals ?? [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo cargar la demanda observada.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function createMandate(signal: DemandSignal) {
    setSavingId(signal.id)
    setError(null)
    try {
      const response = await fetch("/api/prospeccion/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Mercado · ${signal.crop || signal.raw_requirement}`,
          region: signal.region,
          commune: signal.commune,
          species: signal.crop,
          minHa: signal.min_ha,
          maxHa: signal.max_ha,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo crear el mandato.")
      setSavedIds((previous) => new Set(previous).add(signal.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el mandato.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-3 px-0">
          <Link href="/prospeccion"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a Prospección</Link>
        </Button>
        <WorkspaceHeading
          eyebrow="Inteligencia competitiva"
          title="Demanda detectada en mercado"
          description="Requerimientos públicos observados en brokers agrícolas y cruzados contra oportunidades, cobertura KMZ y evidencia de propietarios de Sur Realista."
          outcome="Convertir demanda externa observable en mandatos accionables sin confundirla con demanda propia de clientes."
        />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Señales activas</p><p className="mt-1 text-2xl font-medium">{loading ? "—" : signals.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Con candidatos SR</p><p className="mt-1 text-2xl font-medium">{loading ? "—" : signals.filter((signal) => signal.candidate_count > 0).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Con vínculo KMZ puntual</p><p className="mt-1 text-2xl font-medium">{loading ? "—" : signals.filter((signal) => (signal.candidate_level_evidence?.spatial_link_count || 0) > 0).length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Fuente inicial</p><p className="mt-1 text-sm font-medium">EVilas Agro · pública</p></Card>
      </section>

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {loading ? (
        <Card className="flex min-h-[220px] items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Cargando señales…</Card>
      ) : !signals.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No hay señales activas persistidas todavía. Primero debe ejecutarse el scraper EVilas en un entorno con la migración aplicada.</Card>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => {
            const saved = savedIds.has(signal.id)
            const coverage = signal.territorial_coverage
            const point = signal.candidate_level_evidence
            return (
              <Card key={signal.id} className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{signal.source}</Badge>
                      {signal.crop ? <Badge>{signal.crop}</Badge> : null}
                      {signal.transaction_type ? <Badge variant="secondary">{signal.transaction_type}</Badge> : null}
                      {signal.production_status ? <Badge variant="secondary">{signal.production_status}</Badge> : null}
                    </div>
                    <h2 className="mt-3 text-lg font-medium">{signal.raw_requirement}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.raw_detail}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span>{[signal.commune, signal.region].filter(Boolean).join(" · ") || "Ubicación amplia/no especificada"}</span>
                      <span>{signal.min_ha != null ? `${signal.min_ha} ha mín.` : "Sin mínimo estructurado"}</span>
                      <span>{signal.max_ha != null ? `${signal.max_ha} ha máx.` : "Sin máximo estructurado"}</span>
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-5">
                      <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">1 · Oportunidades</p><p className="mt-1 text-xl font-medium">{signal.candidate_count}</p><p className="mt-1 text-xs text-muted-foreground">mercado SR</p></div>
                      <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">2 · Punto confiable</p><p className="mt-1 text-xl font-medium">{point?.reliable_point_count ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">georreferencia utilizable</p></div>
                      <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">3 · KMZ candidato</p><p className="mt-1 text-xl font-medium">{point?.spatial_link_count ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">≤ 3 km del listing</p></div>
                      <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">4 · Propietario</p><p className="mt-1 text-xl font-medium">{point?.owner_evidence_count ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">con evidencia</p></div>
                      <div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">5 · Contactable</p><p className="mt-1 text-xl font-medium">{point?.contactable_count ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">teléfono/email</p></div>
                    </div>

                    {signal.top_spatial_links?.length ? (
                      <div className="mt-4 space-y-2 border-t border-border pt-4">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Vínculos candidato → KMZ</p>
                        {signal.top_spatial_links.map((link) => (
                          <div key={`${link.candidate_id}-${link.kmz_id || link.kmz_name}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="font-medium">{link.kmz_name || "KMZ sin nombre"}</span>
                            <span className="text-muted-foreground">{link.distance_km} km</span>
                            <Badge variant="outline">{link.spatial_confidence}</Badge>
                            {link.rol_numbers?.length ? <span className="text-muted-foreground">ROL {link.rol_numbers.slice(0, 2).join(", ")}</span> : null}
                            {link.owner ? <span>{link.owner.name}</span> : <span className="text-muted-foreground">propietario pendiente</span>}
                            {link.contactable ? <Badge>contactable</Badge> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-4 max-w-4xl text-xs leading-5 text-muted-foreground">
                      Esta segunda capa ya vincula cada oportunidad georreferenciada con KMZ cercanos. Sigue siendo evidencia espacial, no identidad catastral. La identidad exacta exige ROL coincidente o intersección de polígonos. Como contexto, la zona contiene {metric(coverage?.kmz_count ?? null, coverage?.sampled)} KMZ y {metric(coverage?.owner_evidence_count ?? null, coverage?.sampled)} propietarios con evidencia.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:min-w-56">
                    <div className="border border-border p-3">
                      <p className="text-xs text-muted-foreground">Cruce Sur Realista</p>
                      <p className="mt-1 text-xl font-medium">{signal.candidate_count} candidatos</p>
                      <p className="mt-1 text-xs text-muted-foreground">{signal.top_candidate_score != null ? `Mejor ajuste ${signal.top_candidate_score}/100` : "Sin coincidencias actuales"}</p>
                    </div>
                    <Button type="button" onClick={() => void createMandate(signal)} disabled={savingId === signal.id || saved}>
                      {savingId === signal.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : saved ? <Save className="h-4 w-4" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}
                      {saved ? "Mandato creado" : "Crear mandato"}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
