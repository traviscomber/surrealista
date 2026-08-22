"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Building2, Database, FileArchive, Loader2, MapPinned, RefreshCw, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Profile = {
  commune: string
  region: string | null
  population: number | null
  properties: number | null
  sales: number | null
  housing: number | null
  occupancyRatePct: number | null
  apartments: number | null
  residentialProjects: number | null
  avgPersonsPerUnit: number | null
  salesPer100Properties: number | null
  apartmentsSharePct: number | null
  marketDepthScore: number | null
  kmzCount: number
  coveragePct: number
  scrapedAt: string | null
}

type IntelligenceResponse = {
  success: boolean
  generatedAt?: string
  formula?: {
    label: string
    note: string
    weights: Record<string, number>
  }
  coverage?: { communes: number; metrics: string[]; kmzMatched?: number }
  profiles?: Profile[]
  error?: string
}

function formatNumber(value: number | null, maximumFractionDigits = 0) {
  if (value == null) return "—"
  return value.toLocaleString("es-CL", { maximumFractionDigits })
}

export function TerritorialIntelligencePanel() {
  const supabase = useMemo(() => createClient(), [])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [formulaNote, setFormulaNote] = useState<string | null>(null)

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const siteAccessToken = sessionStorage.getItem("site_access_token")
    if (!session?.access_token && !siteAccessToken) throw new Error("No autenticado")
    return {
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(siteAccessToken ? { "X-Site-Access-Token": siteAccessToken } : {}),
    }
  }, [supabase])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getHeaders()
      const response = await fetch("/api/admin/intelligence/territorial", { headers, cache: "no-store" })
      const data = (await response.json().catch(() => ({}))) as IntelligenceResponse
      if (!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`)
      setProfiles(data.profiles || [])
      setGeneratedAt(data.generatedAt || null)
      setFormulaNote(data.formula?.note || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la inteligencia territorial")
    } finally {
      setLoading(false)
    }
  }, [getHeaders])

  useEffect(() => { void load() }, [load])

  const totals = useMemo(() => ({
    communes: profiles.length,
    properties: profiles.reduce((sum, item) => sum + (item.properties || 0), 0),
    sales: profiles.reduce((sum, item) => sum + (item.sales || 0), 0),
    kmz: profiles.reduce((sum, item) => sum + (item.kmzCount || 0), 0),
  }), [profiles])

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Uso interno Sur Realista. Este ranking prioriza profundidad de mercado para investigación; los KMZ muestran nuestro footprint interno y no alteran el score.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><MapPinned className="h-4 w-4" />Comunas con cobertura</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{formatNumber(totals.communes)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4" />Propiedades observadas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{formatNumber(totals.properties)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" />Ventas históricas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{formatNumber(totals.sales)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><FileArchive className="h-4 w-4" />KMZ Sur Realista</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{formatNumber(totals.kmz)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Ranking interno de profundidad de mercado</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">25% población · 25% propiedades · 30% ventas · 20% proyectos residenciales. KMZ se muestra aparte.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Comuna</th>
                  <th className="py-2 pr-4 text-right">Score</th>
                  <th className="py-2 pr-4 text-right">KMZ SR</th>
                  <th className="py-2 pr-4 text-right">Población</th>
                  <th className="py-2 pr-4 text-right">Propiedades</th>
                  <th className="py-2 pr-4 text-right">Ventas</th>
                  <th className="py-2 pr-4 text-right">Ventas / 100 prop.</th>
                  <th className="py-2 pr-4 text-right">Proyectos</th>
                  <th className="py-2 pr-4 text-right">Ocupación</th>
                  <th className="py-2 pr-4 text-right">Deptos.</th>
                  <th className="py-2">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr key={profile.commune} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{index + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{profile.commune}</div>
                      <div className="text-xs text-muted-foreground">{profile.region || "—"}</div>
                    </td>
                    <td className="py-3 pr-4 text-right"><Badge variant="secondary">{profile.marketDepthScore ?? "—"}</Badge></td>
                    <td className="py-3 pr-4 text-right tabular-nums font-medium">{formatNumber(profile.kmzCount)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatNumber(profile.population)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatNumber(profile.properties)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatNumber(profile.sales)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatNumber(profile.salesPer100Properties, 1)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatNumber(profile.residentialProjects)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{profile.occupancyRatePct == null ? "—" : `${formatNumber(profile.occupancyRatePct, 1)}%`}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{profile.apartmentsSharePct == null ? "—" : `${formatNumber(profile.apartmentsSharePct, 1)}%`}</td>
                    <td className="py-3"><Badge variant={profile.coveragePct === 100 ? "default" : "outline"}>{profile.coveragePct}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && profiles.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No hay comunas disponibles todavía.</div>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            <span>Fuente externa: Inciti Data Hub público · parser v2.</span>
            <span>Fuente interna: KMZ resueltos por comuna SII.</span>
            {generatedAt && <span>Generado {new Date(generatedAt).toLocaleString("es-CL")}.</span>}
            {formulaNote && <span>{formulaNote}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
