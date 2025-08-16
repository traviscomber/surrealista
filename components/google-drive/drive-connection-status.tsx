"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Loader2, RefreshCw, FolderOpen, FileText, AlertTriangle } from "lucide-react"
import { driveService } from "@/lib/google-drive/drive-service"

export default function DriveConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [lastTest, setLastTest] = useState<Date | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionProgress(0)

    try {
      // Simular progreso de conexión
      const progressInterval = setInterval(() => {
        setConnectionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const connected = await driveService.testConnection()

      clearInterval(progressInterval)
      setConnectionProgress(100)

      setTimeout(() => {
        setIsConnected(connected)
        setLastTest(new Date())
        setIsLoading(false)
        setConnectionProgress(0)
      }, 500)
    } catch (error) {
      setIsConnected(false)
      setLastTest(new Date())
      setIsLoading(false)
      setConnectionProgress(0)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

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
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : isConnected === true ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isConnected === false ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}

            <span className="font-medium">
              {isLoading
                ? "Probando conexión..."
                : isConnected === true
                  ? "Conectado"
                  : isConnected === false
                    ? "Error de conexión"
                    : "Sin probar"}
            </span>
          </div>

          <Badge variant={isConnected === true ? "default" : isConnected === false ? "destructive" : "secondary"}>
            {isConnected === true ? "Activo" : isConnected === false ? "Error" : "Pendiente"}
          </Badge>
        </div>

        {/* Progreso de Conexión */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Probando API...</span>
              <span>{connectionProgress}%</span>
            </div>
            <Progress value={connectionProgress} className="h-2" />
          </div>
        )}

        {/* Información de API */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="font-medium">API Key:</span>
            <code className="bg-white px-2 py-1 rounded text-xs">AIzaSyB6...XyjHTU</code>
          </div>

          {lastTest && <div className="text-xs text-gray-600">Última prueba: {lastTest.toLocaleString("es-CL")}</div>}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
