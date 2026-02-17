"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, FileText } from "lucide-react"
import { toast } from "sonner"

interface IndexingStatus {
  status: "idle" | "indexing" | "completed" | "error"
  totalKmzFiles: number
  processedFiles: number
  indexedLocations: number
  errorMessage?: string
  lastIndexed?: string
}

export default function KmzAdminDashboard() {
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus>({
    status: "idle",
    totalKmzFiles: 0,
    processedFiles: 0,
    indexedLocations: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/kmz/mass-index?action=status")
      const data = await response.json()
      setIndexingStatus(data)
    } catch (error) {
      console.error("[v0] Error fetching status:", error)
      toast.error("Error al obtener el estado")
    }
  }

  const startIndexing = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Starting KMZ mass indexing...")
      toast.loading("Iniciando indexación de todos los KMZ...")

      const response = await fetch("/api/admin/kmz/mass-index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al iniciar indexación")
      }

      const data = await response.json()
      setIndexingStatus(data)
      console.log("[v0] Indexing started:", data)
      toast.success(`Indexando ${data.totalKmzFiles} archivos KMZ...`)

      // Poll for updates every 2 seconds
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch("/api/admin/kmz/mass-index?action=status")
        const statusData = await statusResponse.json()
        setIndexingStatus(statusData)

        if (statusData.status === "completed" || statusData.status === "error") {
          clearInterval(pollInterval)
          if (statusData.status === "completed") {
            toast.success(
              `Indexación completada: ${statusData.indexedLocations} ubicaciones indexadas`
            )
          } else {
            toast.error(`Error: ${statusData.errorMessage}`)
          }
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] Error starting indexing:", error)
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
      setIndexingStatus((prev) => ({
        ...prev,
        status: "error",
        errorMessage: message,
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (indexingStatus.status) {
      case "completed":
        return "bg-green-50"
      case "indexing":
        return "bg-blue-50"
      case "error":
        return "bg-red-50"
      default:
        return "bg-gray-50"
    }
  }

  const getStatusBadge = () => {
    switch (indexingStatus.status) {
      case "completed":
        return (
          <Badge className="bg-green-500 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Completado
          </Badge>
        )
      case "indexing":
        return (
          <Badge className="bg-blue-500 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Indexando
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">Inactivo</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel de Administración KMZ</h1>
          <p className="text-slate-600">Gestiona la indexación de ubicaciones en archivos KMZ</p>
        </div>

        {/* Main Status Card */}
        <Card className={`mb-6 ${getStatusColor()} border-2`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estado de Indexación
                </CardTitle>
                <CardDescription>
                  Monitorea el proceso de indexación de ubicaciones KMZ
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Archivos KMZ Detectados</p>
                <p className="text-3xl font-bold text-slate-900">{indexingStatus.totalKmzFiles}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Archivos Procesados</p>
                <p className="text-3xl font-bold text-slate-900">
                  {indexingStatus.processedFiles}/{indexingStatus.totalKmzFiles}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Ubicaciones Indexadas</p>
                <p className="text-3xl font-bold text-slate-900">{indexingStatus.indexedLocations}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {indexingStatus.totalKmzFiles > 0 && (
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(indexingStatus.processedFiles / indexingStatus.totalKmzFiles) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {indexingStatus.status === "error" && indexingStatus.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Error:</span> {indexingStatus.errorMessage}
                </p>
              </div>
            )}

            {/* Last Indexed */}
            {indexingStatus.lastIndexed && (
              <p className="text-xs text-slate-500">
                Última indexación: {new Date(indexingStatus.lastIndexed).toLocaleString("es-ES")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>Ejecuta operaciones de indexación y mantenimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={startIndexing}
              disabled={
                isLoading ||
                indexingStatus.status === "indexing" ||
                indexingStatus.totalKmzFiles === 0
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              {isLoading || indexingStatus.status === "indexing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Indexando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Iniciar Indexación de KMZ
                </>
              )}
            </Button>

            <Button
              onClick={fetchStatus}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Estado
            </Button>

            <Button
              onClick={() => (window.location.href = "/kmz-search")}
              variant="secondary"
              className="w-full"
            >
              Ir a Búsqueda de KMZ
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>
              • Este panel indexa todos los archivos KMZ existentes y extrae sus ubicaciones
            </p>
            <p>• Los resultados se almacenan en la tabla de búsqueda para acceso rápido</p>
            <p>• Una vez indexados, puedes buscar ubicaciones en la sección de Búsqueda de KMZ</p>
            <p>• El proceso se ejecuta en segundo plano y puede tardar varios minutos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
