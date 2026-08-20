"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ExternalLink, Loader2, PlayCircle, RefreshCw, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const DEFAULT_ARTICLE = "https://www.inciti.com/cl/prensa/2026-03-30-elmercurio-iva-vivienda-entrega-inmediata"

type MetricRow = {
  id?: string
  article_url: string
  article_title: string | null
  published_at: string | null
  region: string | null
  commune: string | null
  dataset: string
  metric: string
  period: string | null
  value: number | null
  unit: string | null
  raw_label: string | null
  scraped_at: string
}

type ScrapeResponse = {
  success: boolean
  persisted?: boolean
  articlesFound?: number
  articlesProcessed?: number
  metricsFound?: number
  inserted?: number
  updated?: number
  skipped?: number
  errors?: string[]
  articles?: Array<{ metrics: MetricRow[] }>
  error?: string
}

export function IncitiMarketPanel() {
  const supabase = useMemo(() => createClient(), [])
  const [articleUrl, setArticleUrl] = useState(DEFAULT_ARTICLE)
  const [storedRows, setStoredRows] = useState<MetricRow[]>([])
  const [previewRows, setPreviewRows] = useState<MetricRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const loadStored = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch("/api/admin/scrapers/inciti-public?limit=100", { headers })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      setStoredRows(data.rows || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la data guardada")
    } finally {
      setRefreshing(false)
    }
  }, [getAuthHeaders])

  useEffect(() => { void loadStored() }, [loadStored])

  const run = useCallback(async (persist: boolean) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch("/api/admin/scrapers/inciti-public", {
        method: "POST",
        headers,
        body: JSON.stringify({ articleUrl: articleUrl.trim() || undefined, persist }),
      })
      const data = (await response.json().catch(() => ({}))) as ScrapeResponse
      if (!response.ok && response.status !== 207) throw new Error(data.error || `HTTP ${response.status}`)
      if (data.error) throw new Error(data.error)

      const metrics = (data.articles || []).flatMap((article) => article.metrics || [])
      setPreviewRows(metrics)
      setMessage(
        persist
          ? `Persistencia completada: ${data.inserted || 0} nuevas, ${data.updated || 0} actualizadas, ${data.skipped || 0} omitidas.`
          : `Dry-run completado: ${data.metricsFound || metrics.length} métricas detectadas sin escribir en la base.`,
      )
      if (persist) await loadStored()
      if (data.errors?.length) setError(data.errors.join(" · "))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falló el scraper")
    } finally {
      setLoading(false)
    }
  }, [articleUrl, getAuthHeaders, loadStored])

  const visibleRows = previewRows.length ? previewRows : storedRows

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inciti · inteligencia pública de mercado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input value={articleUrl} onChange={(event) => setArticleUrl(event.target.value)} placeholder="URL pública /cl/prensa/..." />
            <Button variant="outline" onClick={() => void run(false)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
              Probar sin guardar
            </Button>
            <Button onClick={() => void run(true)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Extraer y guardar
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{total.toLocaleString("es-CL")} métricas guardadas</Badge>
            <span>La tabla está cerrada a anon/authenticated y se escribe solo con service role.</span>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => void loadStored()} disabled={refreshing}>
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />Actualizar
            </Button>
          </div>
          {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{previewRows.length ? "Resultado de la última prueba" : "Métricas guardadas"}</CardTitle>
          {previewRows.length > 0 && <Button variant="ghost" size="sm" onClick={() => setPreviewRows([])}>Ver guardadas</Button>}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Comuna</th>
                  <th className="py-2 pr-4">Métrica</th>
                  <th className="py-2 pr-4">Periodo</th>
                  <th className="py-2 pr-4 text-right">Valor</th>
                  <th className="py-2 pr-4">Unidad</th>
                  <th className="py-2 pr-4">Dataset</th>
                  <th className="py-2">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.slice(0, 100).map((row, index) => (
                  <tr key={row.id || `${row.article_url}-${row.metric}-${row.commune}-${row.period}-${index}`} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.commune || row.raw_label || "—"}</td>
                    <td className="py-2 pr-4 font-medium">{row.metric}</td>
                    <td className="py-2 pr-4">{row.period || "—"}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.value == null ? "—" : Number(row.value).toLocaleString("es-CL")}</td>
                    <td className="py-2 pr-4">{row.unit || "—"}</td>
                    <td className="py-2 pr-4">{row.dataset}</td>
                    <td className="py-2">
                      <a href={row.article_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Inciti <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Todavía no hay métricas para mostrar.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
