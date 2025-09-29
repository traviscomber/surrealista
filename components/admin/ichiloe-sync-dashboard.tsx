"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, RefreshCw, MapPin, Home, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface SyncResult {
  success: boolean
  imported: number
  properties: Array<{
    title: string
    price: string
    area: string
    location: string
    propertyType: string
  }>
}

export default function IChiloeSyncDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const handleSync = async () => {
    setIsLoading(true)

    try {
      console.log("[v0] Starting iChiloe sync...")

      const response = await fetch("/api/sync-ichiloe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error("[v0] Failed to parse response as JSON:", parseError)
        const text = await response.text()
        console.error("[v0] Response text:", text)
        throw new Error("Invalid response from server")
      }

      console.log("[v0] Sync result:", result)

      if (result.success) {
        setSyncResult(result)
        setLastSync(new Date())
        toast.success(`¡Sincronización exitosa! ${result.imported} propiedades importadas desde iChiloe.cl`)
      } else {
        const errorMessage = result.error || "Error desconocido"
        console.error("[v0] Sync failed:", errorMessage)
        toast.error(`Error en la sincronización: ${errorMessage}`)

        setSyncResult({ success: false, imported: 0, properties: [] })
        setLastSync(new Date())
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al conectar con iChiloe.cl"
      toast.error(`Error de conexión: ${errorMessage}`)

      setSyncResult({ success: false, imported: 0, properties: [] })
      setLastSync(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sincronización iChiloe.cl</h2>
          <p className="text-muted-foreground">Importa propiedades reales desde iChiloe.cl a tu base de datos</p>
        </div>

        <Button
          onClick={handleSync}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Ahora
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronización</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastSync ? lastSync.toLocaleDateString("es-CL") : "Nunca"}</div>
            <p className="text-xs text-muted-foreground">
              {lastSync ? lastSync.toLocaleTimeString("es-CL") : "No hay sincronizaciones previas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades Importadas</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncResult?.imported || 0}</div>
            <p className="text-xs text-muted-foreground">En la última sincronización</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Badge variant={syncResult?.success ? "default" : "secondary"}>
              {isLoading ? "Sincronizando" : syncResult?.success ? "Exitoso" : "Inactivo"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "En Proceso" : syncResult?.success ? "Completado" : "Esperando"}
            </div>
            <p className="text-xs text-muted-foreground">Estado de la sincronización</p>
          </CardContent>
        </Card>
      </div>

      {syncResult && syncResult.properties && (
        <Card>
          <CardHeader>
            <CardTitle>Propiedades Importadas</CardTitle>
            <CardDescription>Últimas propiedades sincronizadas desde iChiloe.cl</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncResult.properties.slice(0, 5).map((property, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{property.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {property.propertyType}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {property.price}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{property.area}</Badge>
                </div>
              ))}

              {syncResult.properties.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Y {syncResult.properties.length - 5} propiedades más...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
