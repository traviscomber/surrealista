"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, MapPin, PlayCircle, RefreshCw, XCircle } from "lucide-react"
import scraperConfig from "@/config/scrapers.json"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ScrapeRun = {
  id: string
  source: string
  status: "pending" | "running" | "completed" | "failed" | "partial"
  region: string | null
  operation: string | null
  properties_found: number
  properties_inserted: number
  properties_updated: number
  properties_skipped: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  created_at: string
}

type SourceStat = {
  source: string
  total: number
  last_scraped: string | null
  regions: string[]
}

type ScraperSource = (typeof scraperConfig.sources)[number]

const SOURCES = scraperConfig.sources

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950", label: "Completado" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", label: "Fallido" },
  running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950", label: "Corriendo" },
  partial: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950", label: "Parcial" },
  pending: { icon: Clock, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-900", label: "Pendiente" },
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—"
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatRelative(iso: string | null) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (hours > 24) return `hace ${Math.floor(hours / 24)}d`
  if (hours > 0) return `hace ${hours}h`
  if (minutes > 0) return `hace ${minutes}m`
  return "ahora"
}

function StatBadge({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${highlight ? "bg-emerald-50 dark:bg-emerald-950" : "bg-muted"}`}>
      <div className={`text-lg font-bold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {value.toLocaleString("es-CL")}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function SourceCard({
  source,
  stat,
  lastRun,
  onRun,
  running,
}: {
  source: ScraperSource
  stat: SourceStat | null
  lastRun: ScrapeRun | null
  onRun: (key: string) => void
  running: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const status = lastRun ? STATUS_CONFIG[lastRun.status] : null
  const StatusIcon = status?.icon

  return (
    <Card className={`overflow-hidden border transition-all ${source.enabled ? "hover:border-border/80" : "opacity-70"}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`h-2 w-2 flex-shrink-0 rounded-full ${source.enabled ? source.group === "south" ? "bg-emerald-500" : "bg-blue-500" : "bg-gray-400"}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{source.label}</span>
                {!source.enabled && <Badge variant="outline" className="text-[10px]">Desactivado</Badge>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{source.focus}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {status && StatusIcon && (
              <div className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${status.bg}`}>
                <StatusIcon className={`h-3 w-3 ${status.color} ${lastRun?.status === "running" ? "animate-spin" : ""}`} />
                <span className={`${status.color} font-medium`}>{status.label}</span>
              </div>
            )}
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => onRun(source.key)} disabled={running || !source.enabled}>
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
              Ejecutar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {stat ? (
          <div className="mx-4 mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-border text-center">
            <div className="bg-background px-3 py-2"><div className="text-sm font-semibold">{stat.total.toLocaleString("es-CL")}</div><div className="text-xs text-muted-foreground">propiedades</div></div>
            <div className="bg-background px-3 py-2"><div className="text-sm font-semibold">{stat.regions.length}</div><div className="text-xs text-muted-foreground">regiones</div></div>
            <div className="bg-background px-3 py-2"><div className="text-sm font-semibold">{formatRelative(stat.last_scraped)}</div><div className="text-xs text-muted-foreground">última vez</div></div>
          </div>
        ) : (
          <div className="mx-4 mb-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {source.enabled ? "Sin datos aún" : source.disabledReason || "Fuente pendiente de validación"}
          </div>
        )}

        {expanded && lastRun && (
          <div className="space-y-2 border-t bg-muted/40 px-4 py-3 text-xs">
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span>Encontradas: <strong className="text-foreground">{lastRun.properties_found}</strong></span>
              <span>Insertadas: <strong className="text-emerald-600">{lastRun.properties_inserted}</strong></span>
              <span>Actualizadas: <strong className="text-blue-600">{lastRun.properties_updated}</strong></span>
              <span>Omitidas: <strong className="text-foreground">{lastRun.properties_skipped}</strong></span>
              <span>Duración: <strong className="text-foreground">{formatDuration(lastRun.duration_seconds)}</strong></span>
            </div>
            {lastRun.error_message && <div className="rounded bg-red-50 px-2 py-1 text-red-600 dark:bg-red-950">{lastRun.error_message}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ScrapersPanel() {
  const supabase = useMemo(() => createClient(), [])
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([])
  const [lastRuns, setLastRuns] = useState<Record<string, ScrapeRun>>({})
  const [runningMap, setRunningMap] = useState<Record<string, boolean>>({})
  const [runErrors, setRunErrors] = useState<Record<string, string>>({})
  const [totalProps, setTotalProps] = useState(0)
  const [totalRegions, setTotalRegions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [runningAll, setRunningAll] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const siteAccessToken = sessionStorage.getItem("site_access_token")
    if (!session?.access_token && !siteAccessToken) throw new Error("No autenticado")
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(siteAccessToken ? { "X-Site-Access-Token": siteAccessToken } : {}),
    }
  }, [supabase])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const [{ count }, { data: perSource }, { data: runs }] = await Promise.all([
        supabase.from("properties_external").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("properties_external").select("source, region, scraped_at").eq("is_active", true).order("scraped_at", { ascending: false }),
        supabase.from("scrape_runs").select("*").order("created_at", { ascending: false }).limit(100),
      ])

      setTotalProps(count ?? 0)
      const grouped: Record<string, SourceStat> = {}
      const regionSet = new Set<string>()
      for (const row of perSource || []) {
        grouped[row.source] ||= { source: row.source, total: 0, last_scraped: null, regions: [] }
        grouped[row.source].total += 1
        if (row.region && !grouped[row.source].regions.includes(row.region)) grouped[row.source].regions.push(row.region)
        if (row.region) regionSet.add(row.region)
        if (!grouped[row.source].last_scraped) grouped[row.source].last_scraped = row.scraped_at
      }
      setSourceStats(Object.values(grouped))
      setTotalRegions(regionSet.size)

      const bySource: Record<string, ScrapeRun> = {}
      for (const run of runs || []) if (!bySource[run.source]) bySource[run.source] = run
      setLastRuns(bySource)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void fetchStats() }, [fetchStats])

  const runScraper = useCallback(async (sourceKey: string) => {
    setRunningMap((current) => ({ ...current, [sourceKey]: true }))
    setRunErrors((current) => ({ ...current, [sourceKey]: "" }))
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/scrape/${sourceKey}`, { method: "POST", headers })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      await fetchStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      setRunErrors((current) => ({ ...current, [sourceKey]: message }))
    } finally {
      setRunningMap((current) => ({ ...current, [sourceKey]: false }))
    }
  }, [fetchStats, getAuthHeaders])

  const runGroup = useCallback(async (group: "south" | "all", pages = 1) => {
    setRunningAll(true)
    try {
      const headers = await getAuthHeaders()
      if (group === "south" && pages > 1) {
        const response = await fetch("/api/scrape/execute-south", { method: "POST", headers, body: JSON.stringify({ pages }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      } else {
        const targets = SOURCES.filter((source) => source.enabled && (group === "all" || source.group === "south"))
        for (const source of targets) await runScraper(source.key)
      }
      await fetchStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      setRunErrors((current) => ({ ...current, group: message }))
    } finally {
      setRunningAll(false)
    }
  }, [fetchStats, getAuthHeaders, runScraper])

  const southSources = SOURCES.filter((source) => source.group === "south")
  const generalSources = SOURCES.filter((source) => source.group === "general")
  const enabledSouthKeys = new Set(southSources.filter((source) => source.enabled).map((source) => source.key))
  const southTotal = sourceStats.filter((stat) => enabledSouthKeys.has(stat.source)).reduce((total, stat) => total + stat.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Scrapers de Mercado</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Cargando datos..." : `${totalProps.toLocaleString("es-CL")} propiedades en ${totalRegions} regiones`}
            {lastRefresh && <span className="ml-2 opacity-60">· actualizado {formatRelative(lastRefresh.toISOString())}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchStats()} disabled={loading}><RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Actualizar</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void runGroup("south", 3)} disabled={runningAll}>{runningAll ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="mr-2 h-3.5 w-3.5" />}Sur Completo</Button>
          <Button variant="outline" size="sm" onClick={() => void runGroup("south")} disabled={runningAll}>Ejecutar Sur</Button>
          <Button size="sm" onClick={() => void runGroup("all")} disabled={runningAll}>Ejecutar Todos</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBadge label="Total propiedades" value={totalProps} highlight />
        <StatBadge label="Fuentes activas" value={SOURCES.filter((source) => source.enabled).length} />
        <StatBadge label="Propiedades sur" value={southTotal} highlight />
        <StatBadge label="Regiones cubiertas" value={totalRegions} />
      </div>

      {[{ title: "Sur de Chile — Prioridad", sources: southSources, color: "emerald" }, { title: "Portales Nacionales", sources: generalSources, color: "blue" }].map((section) => (
        <section key={section.title}>
          <div className="mb-3 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${section.color === "emerald" ? "bg-emerald-500" : "bg-blue-500"}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
            <Badge variant="outline" className="text-xs">{section.sources.filter((source) => source.enabled).length} activas</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.sources.map((source) => <SourceCard key={source.key} source={source} stat={sourceStats.find((stat) => stat.source === source.key) || null} lastRun={lastRuns[source.key] || null} onRun={runScraper} running={Boolean(runningMap[source.key])} />)}
          </div>
        </section>
      ))}

      {Object.values(runErrors).some(Boolean) && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-red-600"><XCircle className="h-4 w-4" />Errores recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">{Object.entries(runErrors).filter(([, error]) => error).map(([key, error]) => <div key={key} className="flex gap-2 text-xs"><strong>{key}:</strong><span className="text-red-600">{error}</span></div>)}</CardContent>
        </Card>
      )}
    </div>
  )
}
