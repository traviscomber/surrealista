"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, FolderOpen, FileText, Download } from "lucide-react"
import { realDriveService, type FolderStructure } from "@/lib/google-drive/real-drive-service"

export default function RealDriveConnector() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      console.log("[v0] Starting real Google Drive connection...")
      const success = await realDriveService.authenticate()

      if (success) {
        setIsConnected(true)
        console.log("[v0] Successfully connected to Google Drive")
        await loadRealFolders()
      } else {
        throw new Error("Authentication failed")
      }
    } catch (err) {
      console.error("[v0] Connection error:", err)
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setIsConnecting(false)
    }
  }

  const loadRealFolders = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading real folders from Google Drive...")
      const realFolders = await realDriveService.listSuccessCases()
      setFolders(realFolders)
      console.log("[v0] Loaded folders:", realFolders)
    } catch (err) {
      console.error("[v0] Error loading folders:", err)
      setError("Failed to load folders")
    } finally {
      setLoading(false)
    }
  }

  const handleExtractRols = async (folderId: string) => {
    try {
      console.log("[v0] Extracting rol numbers from folder:", folderId)
      const rolNumbers = await realDriveService.extractRolNumbers(folderId)
      console.log("[v0] Extracted rol numbers:", rolNumbers)

      // Update folder with extracted rol numbers
      setFolders((prev) =>
        prev.map((folder) => (folder.id === folderId ? { ...folder, extractedRols: rolNumbers } : folder)),
      )
    } catch (err) {
      console.error("[v0] Error extracting rol numbers:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500"
      case "incomplete":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Completo"
      case "incomplete":
        return "Incompleto"
      default:
        return "Pendiente"
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Conexión Real Google Drive
          </CardTitle>
          <CardDescription>Conectar con las credenciales reales de Sur-Realista</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Client ID:</strong>
                  <p className="text-muted-foreground font-mono text-xs">
                    873991779919-dold9vq3nsl8qoeqfuibmjj5kjctqah1.apps.googleusercontent.com
                  </p>
                </div>
                <div>
                  <strong>API Key:</strong>
                  <p className="text-muted-foreground font-mono text-xs">AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU</p>
                </div>
              </div>

              <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Conectar con Google Drive Real
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Conectado exitosamente a Google Drive</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Real Folders Display */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Casos de Éxito Reales</CardTitle>
            <CardDescription>
              Carpetas encontradas en: https://drive.google.com/drive/folders/11JY7ME6h72wrjud9bYwduqYSbFRcH7i5
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando carpetas reales...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {folders.map((folder) => (
                  <Card key={folder.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{folder.name}</h3>
                            <Badge className={getStatusColor(folder.completionStatus)}>
                              {getStatusText(folder.completionStatus)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <FileText className="inline h-4 w-4 mr-1" />
                              {folder.totalFiles} archivos
                            </div>
                            <div>
                              <Download className="inline h-4 w-4 mr-1" />
                              {(folder.totalSize / 1024 / 1024).toFixed(1)} MB
                            </div>
                            <div>ID: {folder.id}</div>
                          </div>

                          {(folder as any).extractedRols && (
                            <div className="mt-2">
                              <strong>Números de Rol Extraídos:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(folder as any).extractedRols.map((rol: string, idx: number) => (
                                  <Badge key={idx} variant="outline">
                                    {rol}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button size="sm" onClick={() => handleExtractRols(folder.id)} disabled={loading}>
                          Extraer Roles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {folders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron carpetas. Verifica los permisos de acceso.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
