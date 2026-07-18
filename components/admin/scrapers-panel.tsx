"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  MapPin,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Types ───────────────────────────────────────────────────────────────────

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

type RunningSource = {
  source: string
  loading: boolean
  error: string | null
}

// ─── Source metadata ─────────────────────────────────────────────────────────

const SOURCES = [
  {
    key: "ichiloe",
    label: "iChiloe",
    url: "ichiloe.cl",
    focus: "Archipiélago Chiloé",
    type: "south",
    color: "emerald",
  },
  {
    key: "camposchile",
    label: "CamposChile",
    url: "camposchile.cl",
    focus: "Campos y fundos rurales sur",
    type: "south",
    color: "emerald",
  },
  {
    key: "terrachiloe",
    label: "TerraChiloe",
    url: "terrachiloe.cl",
    focus: "Terrenos Chiloé",
    type: "south",
    color: "emerald",
  },
  {
    key: "portalterreno",
    label: "PortalTerreno",
    url: "portalterreno.cl",
    focus: "Terrenos sur Chile",
    type: "south",
    color: "emerald",
  },
  {
    key: "portal_inmobiliario",
    label: "Portal Inmobiliario",
    url: "portalinmobiliario.com",
    focus: "Nacional",
    type: "general",
    color: "blue",
  },
  {
    key: "yapo",
    label: "Yapo",
    url: "yapo.cl",
    focus: "Nacional",
    type: "general",
    color: "blue",
  },
  {
    key: "toctoc",
    label: "TocToc",
    url: "toctoc.com",
    focus: "Nacional",
    type: "general",
    color: "blue",
  },
  {
    key: "icasas",
    label: "iCasas",
    url: "icasas.cl",
    focus: "Terrenos Biobío → Magallanes",
    type: "south",
    color: "emerald",
  },
  {
    key: "rura",
    label: "Rura.cl",
    url: "rura.cl",
    focus: "Parcelas y terrenos especializado",
    type: "south",
    color: "emerald",
  },
  {
    key: "goplaceit",
    label: "GoPlaceIt",
    url: "goplaceit.com",
    focus: "Terrenos Biobío → Magallanes",
    type: "south",
    color: "emerald",
  },
]

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950", label: "Completado" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", label: "Fallido" },
  running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950", label: "Corriendo" },
  partial: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950", label: "Parcial" },
  pending: { icon: Clock, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-900", label: "Pendiente" },
}

function formatDuration(sec: number | null) {
  if (!sec) return "—"
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function formatRelative(iso: string | null) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `hace ${Math.floor(h / 24)}d`
  if (h > 0) return `hace ${h}h`
  if (m > 0) return `hace ${m}m`
  return "ahora"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`text-center px-3 py-2 rounded-lg ${highlight ? "bg-emerald-50 dark:bg-emerald-950" : "bg-muted"}`}>
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
  source: typeof SOURCES[0]
  stat: SourceStat | null
  lastRun: ScrapeRun | null
  onRun: (key: string) => void
  running: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = lastRun ? STATUS_CONFIG[lastRun.status] : null
  const StatusIcon = statusCfg?.icon

  return (
    <Card className="overflow-hidden border border-border hover:border-border/80 transition-all">
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                source.type === "south" ? "bg-emerald-500" : "bg-blue-500"
              }`}
            />
            <div className="min-w-0">
              <div className="font-medium text-sm">{source.label}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{source.focus}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Last run status */}
            {statusCfg && StatusIcon && (
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${statusCfg.bg}`}>
                <StatusIcon
                  className={`h-3 w-3 flex-shrink-0 ${statusCfg.color} ${
                    lastRun?.status === "running" ? "animate-spin" : ""
                  }`}
                />
                <span className={`${statusCfg.color} font-medium`}>{statusCfg.label}</span>
              </div>
            )}

            {/* Run button */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => onRun(source.key)}
              disabled={running}
            >
              {running ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <PlayCircle className="h-3 w-3" />
              )}
              Ejecutar
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        {stat && (
          <div className="grid grid-cols-3 gap-px bg-border mx-4 mb-4 rounded-lg overflow-hidden text-center">
            <div className="bg-background px-3 py-2">
              <div className="text-sm font-semibold text-foreground">{stat.total.toLocaleString("es-CL")}</div>
              <div className="text-xs text-muted-foreground">propiedades</div>
            </div>
            <div className="bg-background px-3 py-2">
              <div className="text-sm font-semibold text-foreground">{stat.regions.length}</div>
              <div className="text-xs text-muted-foreground">regiones</div>
            </div>
            <div className="bg-background px-3 py-2">
              <div className="text-sm font-semibold text-foreground">{formatRelative(stat.last_scraped)}</div>
              <div className="text-xs text-muted-foreground">última vez</div>
            </div>
          </div>
        )}

        {!stat && (
          <div className="mx-4 mb-4 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            Sin datos aún — ejecuta para poblar
          </div>
        )}

        {/* Expanded: last run detail */}
        {expanded && lastRun && (
          <div className="border-t border-border bg-muted/40 px-4 py-3 space-y-2 text-xs">
            <div className="flex flex-wrap gap-4">
              <span className="text-muted-foreground">
                Encontradas: <strong className="text-foreground">{lastRun.properties_found}</strong>
              </span>
              <span className="text-muted-foreground">
                Insertadas: <strong className="text-emerald-600">{lastRun.properties_inserted}</strong>
              </span>
              <span className="text-muted-foreground">
                Actualizadas: <strong className="text-blue-600">{lastRun.properties_updated}</strong>
              </span>
              <span className="text-muted-foreground">
                Omitidas: <strong className="text-foreground">{lastRun.properties_skipped}</strong>
              </span>
              <span className="text-muted-foreground">
                Duración: <strong className="text-foreground">{formatDuration(lastRun.duration_seconds)}</strong>
              </span>
              {lastRun.region && (
                <span className="text-muted-foreground">
                  Región: <strong className="text-foreground">{lastRun.region}</strong>
                </span>
              )}
            </div>
            {lastRun.error_message && (
              <div className="text-red-600 bg-red-50 dark:bg-red-950 rounded px-2 py-1">
                {lastRun.error_message}
              </div>
            )}
            <div className="text-muted-foreground">
              Iniciado: {lastRun.started_at ? new Date(lastRun.started_at).toLocaleString("es-CL") : "—"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ScrapersPanel() {
  const supabase = createClient()

  const [sourceStats, setSourceStats] = useState<SourceStat[]>([])
  const [lastRuns, setLastRuns] = useState<Record<string, ScrapeRun>>({})
  const [runningMap, setRunningMap] = useState<Record<string, boolean>>({})
  const [runErrors, setRunErrors] = useState<Record<string, string>>({})
  const [totalProps, setTotalProps] = useState(0)
  const [totalRegions, setTotalRegions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [runningAll, setRunningAll] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // Totals
      const { count } = await supabase
        .from("properties_external")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
      setTotalProps(count ?? 0)

      // Per-source stats
      const { data: perSource } = await supabase
        .from("properties_external")
        .select("source, region, scraped_at")
        .eq("is_active", true)
        .order("scraped_at", { ascending: false })

      if (perSource) {
        const grouped: Record<string, SourceStat> = {}
        const regionSet = new Set<string>()
        for (const row of perSource) {
          if (!grouped[row.source]) {
            grouped[row.source] = { source: row.source, total: 0, last_scraped: null, regions: [] }
          }
          grouped[row.source].total++
          if (row.region) {
            if (!grouped[row.source].regions.includes(row.region)) {
              grouped[row.source].regions.push(row.region)
            }
            regionSet.add(row.region)
          }
          if (!grouped[row.source].last_scraped) {
            grouped[row.source].last_scraped = row.scraped_at
          }
        }
        setSourceStats(Object.values(grouped))
        setTotalRegions(regionSet.size)
      }

      // Last run per source
      const { data: runs } = await supabase
        .from("scrape_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (runs) {
        const bySource: Record<string, ScrapeRun> = {}
        for (const run of runs) {
          if (!bySource[run.source]) bySource[run.source] = run
        }
        setLastRuns(bySource)
      }

      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const runScraper = async (sourceKey: string) => {
    setRunningMap((p) => ({ ...p, [sourceKey]: true }))
    setRunErrors((p) => ({ ...p, [sourceKey]: "" }))
    try {
  const { data: { session } } = await supabase.auth.getSession()
  const siteAccessToken = sessionStorage.getItem("site_access_token")
  if (!session?.access_token && !siteAccessToken) throw new Error("Not authenticated")

  const res = await fetch(`/api/scrape/${sourceKey}`, {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
  ...(siteAccessToken ? { "X-Site-Access-Token": siteAccessToken } : {}),
  },
  })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      // Refetch after a short delay to show new results
      setTimeout(fetchStats, 1500)
    } catch (err: any) {
      setRunErrors((p) => ({ ...p, [sourceKey]: err.message }))
    } finally {
      setRunningMap((p) => ({ ...p, [sourceKey]: false }))
    }
  }

  const runAll = async (group: "south" | "all") => {
    setRunningAll(true)
    const targets = group === "south"
      ? SOURCES.filter((s) => s.type === "south").map((s) => s.key)
      : SOURCES.map((s) => s.key)
    for (const key of targets) {
      await runScraper(key)
    }
    setRunningAll(false)
    fetchStats()
  }

  const southSources = SOURCES.filter((s) => s.type === "south")
  const generalSources = SOURCES.filter((s) => s.type === "general")
  const southSourceKeys = new Set(southSources.map((source) => source.key))
  const southTotal = sourceStats
    .filter((stat) => southSourceKeys.has(stat.source))
    .reduce((total, stat) => total + stat.total, 0)

  return (
    <div className="space-y-6">
      {/* Header + global actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Scrapers de Mercado</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Cargando datos..." : `${totalProps.toLocaleString("es-CL")} propiedades en ${totalRegions} regiones`}
            {lastRefresh && (
              <span className="ml-2 text-muted-foreground/60">· actualizado {formatRelative(lastRefresh.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => runAll("south")}
            disabled={runningAll}
          >
            <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
            Ejecutar Sur
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => runAll("all")}
            disabled={runningAll}
          >
            {runningAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" />
            )}
            Ejecutar Todos
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="Total propiedades" value={totalProps} highlight />
        <StatBadge label="Portales sur Chile" value={southSources.length} />
        <StatBadge label="Propiedades sur" value={southTotal} highlight />
        <StatBadge label="Regiones cubiertas" value={totalRegions} />
      </div>

      {/* Sur Chile section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sur de Chile — Prioridad
          </h3>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 text-xs">
            {southSources.length} fuentes
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {southSources.map((src) => (
            <SourceCard
              key={src.key}
              source={src}
              stat={sourceStats.find((s) => s.source === src.key) ?? null}
              lastRun={lastRuns[src.key] ?? null}
              onRun={runScraper}
              running={!!runningMap[src.key]}
            />
          ))}
        </div>
      </div>

      {/* General section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Portales Nacionales
          </h3>
          <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800 text-xs">
            {generalSources.length} fuentes
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {generalSources.map((src) => (
            <SourceCard
              key={src.key}
              source={src}
              stat={sourceStats.find((s) => s.source === src.key) ?? null}
              lastRun={lastRuns[src.key] ?? null}
              onRun={runScraper}
              running={!!runningMap[src.key]}
            />
          ))}
        </div>
      </div>

      {/* Error summary */}
      {Object.entries(runErrors).filter(([, v]) => v).length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Errores recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(runErrors)
              .filter(([, v]) => v)
              .map(([key, err]) => (
                <div key={key} className="text-xs flex gap-2">
                  <span className="font-medium text-foreground">{key}:</span>
                  <span className="text-red-600">{err}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
