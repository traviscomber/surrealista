"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, MapPin, Radar, RefreshCw, Sprout } from "lucide-react"

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

export default function ProspeccionPage() {
  const [region, setRegion] = useState("")
  const [commune, setCommune] = useState("")
  const [species, setSpecies] = useState("")
  const [minHa, setMinHa] = useState("")
  const [maxHa, setMaxHa] = useState("")
  const [data, setData] = useState<ProspectingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criteriaSummary = useMemo(() => {
    const parts = [region, commune, species, minHa ? `${minHa}+ ha` : "", maxHa ? `hasta ${maxHa} ha` : ""].filter(Boolean)
    return parts.length ? parts.join(" · ") : "Sin criterios aplicados"
  }, [region, commune, species, minHa, maxHa])

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

      {error ? <Card className="border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</Card> : null}

      {!data && !loading ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
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
