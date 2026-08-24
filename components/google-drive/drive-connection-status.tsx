"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, RefreshCw, FolderOpen } from "lucide-react"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"

export default function DriveConnectionStatus() {
  const { isConnected, isLoading, error, testConnection } = useGoogleDrive()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Estado de Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">
              {isLoading ? "Verificando OAuth..." : isConnected ? "Conectado por OAuth" : "No conectado"}
            </span>
          </div>

          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Activo" : error ? "No disponible" : "Inactivo"}
          </Badge>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          El estado se valida contra la API protegida del servidor. No se usan API keys del navegador ni estados cacheados como evidencia de conexión.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={() => void testConnection()} disabled={isLoading} size="sm" variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Verificar conexión
        </Button>
      </CardContent>
    </Card>
  )
}
