"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sync-properties")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startSync = async () => {
    try {
      setIsSyncing(true)
      setProgress(0)
      setSyncResult(null)

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch("/api/sync-properties", {
        method: "POST",
        headers: {
          Authorization: "Bearer sync-token", // En producción usar token real
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      clearInterval(progressInterval)
      setProgress(100)
      setSyncResult(result)

      setTimeout(() => {
        loadStats()
      }, 1000)
    } catch (error) {
      console.error("[v0] Sync error:", error)
      setSyncResult({
        success: false,
        message: "Error de conexión durante la sincronización",
        count: 0,
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      })
    } finally {
      setIsSyncing(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleString("es-CL")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sincronización de Propiedades</h2>
          <p className="text-muted-foreground">Gestiona la importación de propiedades desde sitios externos</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas de iChiloe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <img src="/placeholder.svg?height=24&width=24" alt="iChiloe" className="h-6 w-6 rounded" />
                iChiloe.cl
              </CardTitle>
              <CardDescription>Propiedades inmobiliarias de Chiloé</CardDescription>
            </div>
            <Badge variant="secondary">{stats?.totalProperties || 0} propiedades</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última sincronización</p>
              <p className="text-sm">{formatDate(stats?.lastSync)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
              <p className="text-sm">{formatDate(stats?.lastUpdate)}</p>
            </div>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sincronizando propiedades...</span>
              </div>
              <Progress value={progress} className="w-full" />
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
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={startSync} disabled={isSyncing} className="flex-1">
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Sincronizar Ahora
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.open("https://www.ichiloe.cl/propiedades/", "_blank")}>
              Ver Sitio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de sincronización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuración de Sincronización
          </CardTitle>
          <CardDescription>Configura la frecuencia y parámetros de sincronización</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sincronización automática</p>
                <p className="text-sm text-muted-foreground">Sincronizar propiedades cada 24 horas</p>
              </div>
              <Badge variant="outline">Próximamente</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Filtros de importación</p>
                <p className="text-sm text-muted-foreground">Solo importar propiedades que cumplan ciertos criterios</p>
              </div>
              <Badge variant="outline">Próximamente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
