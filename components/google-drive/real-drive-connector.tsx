"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, FolderOpen, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { realDriveService, type FolderStructure } from "@/lib/google-drive/real-drive-service"

export default function RealDriveConnector() {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadFolders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await realDriveService.listSuccessCases()
      setFolders(data)
    } catch (loadError) {
      setFolders([])
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las carpetas")
    } finally {
      setLoading(false)
    }
  }

  const connect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const ok = await realDriveService.authenticate()
      setConnected(ok)
      if (!ok) throw new Error("Google Drive no está conectado o configurado")
      await loadFolders()
    } catch (connectError) {
      setConnected(false)
      setError(connectError instanceof Error ? connectError.message : "No se pudo conectar Google Drive")
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Google Drive
          </CardTitle>
          <CardDescription>
            Acceso mediante OAuth del lado servidor. Las credenciales no se incluyen en el navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Conexión verificada
              </div>
              <Button variant="outline" onClick={() => void loadFolders()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          ) : (
            <Button onClick={() => void connect()} disabled={connecting}>
              {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
              Conectar Google Drive
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {connected && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Carpetas disponibles</CardTitle>
            <CardDescription>
              Se muestran únicamente carpetas devueltas por la integración OAuth configurada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando carpetas…
              </div>
            ) : folders.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">La fuente conectada no devolvió carpetas visibles.</p>
            ) : (
              <div className="divide-y divide-border rounded-md border">
                {folders.map((folder) => (
                  <div key={folder.id} className="flex items-center gap-3 px-4 py-3">
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-sm font-medium">{folder.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
