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
        <Card className="p-4"><p className="text-xs text-muted-foreground">Con cobertura KMZ</p><p className="mt-1 text-2xl font-medium">{loading ? "—" : signals.filter((signal) => (signal.territorial_coverage?.kmz_count || 0) > 0).length}</p></Card>
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

                    <div className="mt-5 grid gap-2 sm:grid-cols-4">
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">1 · Oportunidades</p>
                        <p className="mt-1 text-xl font-medium">{signal.candidate_count}</p>
                        <p className="mt-1 text-xs text-muted-foreground">mercado SR</p>
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">2 · KMZ en zona</p>
                        <p className="mt-1 text-xl font-medium">{metric(coverage?.kmz_count ?? null, coverage?.sampled)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{coverage?.scope === "unresolved" ? "sin ubicación suficiente" : coverage?.label || "territorio"}</p>
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">3 · Propietario</p>
                        <p className="mt-1 text-xl font-medium">{metric(coverage?.owner_evidence_count ?? null, coverage?.sampled)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">identidad con evidencia</p>
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground">4 · Contactables</p>
                        <p className="mt-1 text-xl font-medium">{metric(coverage?.contact_ready_count ?? null, coverage?.sampled)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">propietario + teléfono/email</p>
                      </div>
                    </div>

                    <p className="mt-4 max-w-4xl text-xs leading-5 text-muted-foreground">
                      La cobertura KMZ es territorial por comuna o región; todavía no representa una vinculación 1:1 entre cada oportunidad publicada y un KMZ específico. El sistema no infiere propietario ni contacto cuando falta evidencia.
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
