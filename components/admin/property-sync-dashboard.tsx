"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface SyncStats {
  source: string
  totalProperties: number
  lastSync: string | null
  lastUpdate: string | null
}

interface SyncResult {
  success: boolean
  message: string
  count: number
  errors: string[]
}

export function PropertySyncDashboard() {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    void loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sync-properties", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el estado de sincronización")
      setStats(data as SyncStats)
    } catch (error) {
      console.error("[property-sync] Error loading stats", error)
      setSyncResult({
        success: false,
        message: "No se pudo cargar el estado de iChiloe",
        count: 0,
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startSync = async () => {
    try {
      setIsSyncing(true)
      setSyncResult(null)

      const response = await fetch("/api/sync-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = (await response.json().catch(() => ({}))) as Partial<SyncResult> & { error?: string }
      if (!response.ok) throw new Error(result.error || result.message || "La sincronización falló")

      setSyncResult({
        success: Boolean(result.success),
        message: result.message || "Sincronización finalizada",
        count: result.count || 0,
        errors: Array.isArray(result.errors) ? result.errors : [],
      })
      await loadStats()
    } catch (error) {
      console.error("[property-sync] Sync error", error)
      setSyncResult({
        success: false,
        message: "Error durante la sincronización",
        count: 0,
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Sin registro"
    const date = new Date(dateString)
    return Number.isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleString("es-CL")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sincronización de Propiedades</h2>
          <p className="text-muted-foreground">Importación controlada desde la fuente iChiloe</p>
        </div>
        <Button onClick={() => void loadStats()} variant="outline" size="sm" disabled={isLoading || isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>iChiloe.cl</CardTitle>
              <CardDescription>Registros persistidos con source = ichiloe</CardDescription>
            </div>
            <Badge variant="secondary">{stats?.totalProperties ?? 0} propiedades</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Último registro importado</p>
              <p className="text-sm">{formatDate(stats?.lastSync)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
              <p className="text-sm">{formatDate(stats?.lastUpdate)}</p>
            </div>
          </div>

          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sincronizando con la fuente…
            </div>
          )}

          {syncResult && (
            <Alert className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={syncResult.success ? "text-green-800" : "text-red-800"}>
                  {syncResult.message}
                  {syncResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs">
                      {syncResult.errors.map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={() => void startSync()} disabled={isSyncing} className="flex-1">
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Sincronizar ahora
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.open("https://www.ichiloe.cl/propiedades/", "_blank", "noopener,noreferrer") }>
              Ver fuente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automatización
          </CardTitle>
          <CardDescription>La programación automática se administra en los cron jobs versionados del proyecto.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta vista no simula una frecuencia ni una próxima ejecución. Usa el estado persistido y las tareas programadas reales como fuente de verdad.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
