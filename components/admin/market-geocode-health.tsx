"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3, MapPin, RefreshCw, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Health = {
  active: number
  geocoded: number
  point: number
  territorial: number
  neverAttempted: number
  noMatch: number
  errors: number
  attemptedLastHour: number
  retryReady: number
}

const EMPTY: Health = {
  active: 0,
  geocoded: 0,
  point: 0,
  territorial: 0,
  neverAttempted: 0,
  noMatch: 0,
  errors: 0,
  attemptedLastHour: 0,
  retryReady: 0,
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-medium text-foreground">{label}</div>
      {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  )
}

export function MarketGeocodeHealth() {
  const supabase = useMemo(() => createClient(), [])
  const [health, setHealth] = useState<Health>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    try {
      const [active, geocoded, point, territorial, neverAttempted, noMatch, errors, recent, retryReady] = await Promise.all([
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).not("lat", "is", null).not("lng", "is", null),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).eq("geocode_precision", "point"),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).eq("geocode_precision", "territorial"),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).is("lat", null).or("geocode_attempt_count.is.null,geocode_attempt_count.eq.0"),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).eq("geocode_status", "no_match"),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).eq("geocode_status", "error"),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).gte("geocode_attempted_at", hourAgo),
        supabase.from("properties_external").select("id", { count: "exact", head: true }).eq("is_active", true).is("lat", null).lte("geocode_next_retry_at", now),
      ])

      const firstError = [active, geocoded, point, territorial, neverAttempted, noMatch, errors, recent, retryReady].find((result) => result.error)?.error
      if (firstError) throw firstError

      setHealth({
        active: active.count ?? 0,
        geocoded: geocoded.count ?? 0,
        point: point.count ?? 0,
        territorial: territorial.count ?? 0,
        neverAttempted: neverAttempted.count ?? 0,
        noMatch: noMatch.count ?? 0,
        errors: errors.count ?? 0,
        attemptedLastHour: recent.count ?? 0,
        retryReady: retryReady.count ?? 0,
      })
      setRefreshedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el estado de geocodificación")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void refresh() }, [refresh])

  const coverage = health.active > 0 ? (health.geocoded / health.active) * 100 : 0
  const progressing = health.attemptedLastHour > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Cobertura geográfica del mercado
            </CardTitle>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Distingue ubicación puntual de contexto territorial aproximado. Solo los puntos confiables se usan para distancias y vecinos exactos.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Avisos activos" value={loading ? "…" : health.active.toLocaleString("es-CL")} detail="Inventario externo vigente" />
          <Metric label="Con ubicación" value={loading ? "…" : health.geocoded.toLocaleString("es-CL")} detail={`${coverage.toFixed(1)}% de cobertura total`} />
          <Metric label="Punto confiable" value={loading ? "…" : health.point.toLocaleString("es-CL")} detail="Apto para distancias y vecinos" />
          <Metric label="Ubicación territorial" value={loading ? "…" : health.territorial.toLocaleString("es-CL")} detail="Aproximada: comuna/sector" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Sin intentar" value={loading ? "…" : health.neverAttempted.toLocaleString("es-CL")} detail="Prioridad de próximas corridas" />
          <Metric label="Intentos última hora" value={loading ? "…" : health.attemptedLastHour.toLocaleString("es-CL")} detail="Ritmo observado" />
          <Metric label="Sin coincidencia" value={loading ? "…" : health.noMatch.toLocaleString("es-CL")} detail="Reintento con backoff" />
          <Metric label="Listos para retry" value={loading ? "…" : health.retryReady.toLocaleString("es-CL")} detail="Ya cumplieron su espera" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <div><div className="text-sm font-medium">{health.noMatch.toLocaleString("es-CL")} sin coincidencia</div><div className="text-xs text-muted-foreground">No se fuerzan coordenadas dudosas</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <div><div className="text-sm font-medium">{health.retryReady.toLocaleString("es-CL")} listos para retry</div><div className="text-xs text-muted-foreground">Cola balanceada por fuente</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            {health.errors > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            <div><div className="text-sm font-medium">{health.errors.toLocaleString("es-CL")} errores</div><div className="text-xs text-muted-foreground">Fallos técnicos pendientes</div></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{progressing ? "El proceso registró actividad durante la última hora." : "Sin actividad registrada durante la última hora."}</span>
          {refreshedAt ? <span>Actualizado {refreshedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}
