"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Database, Loader2, MapPinned, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CoverageSummary = {
  totalKmz: number
  classifiedKmz: number
  unresolvedKmz: number
  classificationPct: number
  communes: number
  communesWithInciti: number
  kmzWithInciti: number
  kmzWithoutInciti: number
  coveragePct: number
}

type CoverageResponse = {
  success: boolean
  summary?: CoverageSummary
  error?: string
}

function format(value: number) {
  return value.toLocaleString("es-CL")
}

export function TerritorialCoverageSummary() {
  const supabase = useMemo(() => createClient(), [])
  const [summary, setSummary] = useState<CoverageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const siteAccessToken = sessionStorage.getItem("site_access_token")
      if (!session?.access_token && !siteAccessToken) throw new Error("No autenticado")
      const headers = {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(siteAccessToken ? { "X-Site-Access-Token": siteAccessToken } : {}),
      }
      const response = await fetch("/api/admin/intelligence/territorial/coverage", { headers, cache: "no-store" })
      const data = (await response.json().catch(() => ({}))) as CoverageResponse
      if (!response.ok || !data.success || !data.summary) throw new Error(data.error || `HTTP ${response.status}`)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la cobertura territorial")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando cobertura del inventario…</CardContent></Card>
  }

  if (error || !summary) {
    return <Alert variant="destructive"><AlertDescription>{error || "Cobertura no disponible"}</AlertDescription></Alert>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Database className="h-4 w-4" />KMZ totales</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{format(summary.totalKmz)}</div><p className="mt-1 text-xs text-muted-foreground">Universo interno Sur Realista</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><MapPinned className="h-4 w-4" />Con comuna</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{format(summary.classifiedKmz)}</div><p className="mt-1 text-xs text-muted-foreground">{summary.classificationPct}% clasificado</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" />Sin comuna</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{format(summary.unresolvedKmz)}</div><p className="mt-1 text-xs text-muted-foreground">Requieren resolución territorial</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4" />Con Inciti</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{format(summary.kmzWithInciti)}</div><p className="mt-1 text-xs text-muted-foreground">{summary.coveragePct}% de los clasificados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" />Comunas cubiertas</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{summary.communesWithInciti}/{summary.communes}</div><p className="mt-1 text-xs text-muted-foreground">Data Hub persistido</p></CardContent>
        </Card>
      </div>
      <Alert>
        <AlertDescription>
          Cobertura operativa, no comercial: {format(summary.kmzWithoutInciti)} KMZ ya tienen comuna conocida pero todavía no poseen contexto Inciti. La expansión del crawler se prioriza por volumen de inventario para reducir esa brecha primero.
        </AlertDescription>
      </Alert>
    </div>
  )
}
