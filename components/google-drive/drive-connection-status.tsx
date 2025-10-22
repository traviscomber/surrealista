"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Loader2, RefreshCw, FolderOpen, FileText } from "lucide-react"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import { useState } from "react"

export default function DriveConnectionStatus() {
  const { isConnected, isLoading, error, testConnection } = useGoogleDrive()
  const [testProgress, setTestProgress] = useState(0)
  const [isTesting, setIsTesting] = useState(false)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    await testConnection()

    clearInterval(progressInterval)
    setTestProgress(100)

    setTimeout(() => {
      setIsTesting(false)
      setTestProgress(0)
    }, 500)
  }

  const getLastConnectionTime = () => {
    const timestamp = localStorage.getItem("gdrive_connected_at")
    if (timestamp) {
      return new Date(timestamp).toLocaleString("es-CL")
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Estado de Conexión Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de Conexión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading || isTesting ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}

            <span className="font-medium">
              {isLoading || isTesting ? "Probando conexión..." : isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Activo" : error ? "Error" : "Inactivo"}
          </Badge>
        </div>

        {/* Progreso de Conexión */}
        {isTesting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Probando API...</span>
              <span>{testProgress}%</span>
            </div>
            <Progress value={testProgress} className="h-2" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Información de API */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="font-medium">API Key:</span>
            <code className="bg-white px-2 py-1 rounded text-xs">AIzaSyB6...XyjHTU</code>
          </div>

          {getLastConnectionTime() && (
            <div className="text-xs text-gray-600">Última conexión: {getLastConnectionTime()}</div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} disabled={isLoading || isTesting} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`} />
            Probar Conexión
          </Button>

          {isConnected && (
            <Button size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Explorar Carpetas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
