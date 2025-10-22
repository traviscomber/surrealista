"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import { DocumentOrchestrator } from "@/lib/agents/orchestrator"
import { Loader2, FolderOpen, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProcessingResult {
  folderId: string
  folderName: string
  status: "pending" | "processing" | "completed" | "failed"
  result?: any
  error?: string
}

export function AgentDriveProcessor() {
  const { driveService, isConnected } = useGoogleDrive()
  const { toast } = useToast()
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [orchestrator] = useState(() => new DocumentOrchestrator())

  useEffect(() => {
    if (isConnected && driveService) {
      loadFolders()
    }
  }, [isConnected, driveService])

  const loadFolders = async () => {
    if (!driveService) return

    setLoading(true)
    try {
      console.log("[v0] Loading folders from Google Drive for agent processing...")
      const kmzFiles = await driveService.searchKMZFiles()

      const folderMap = new Map<string, any[]>()

      for (const file of kmzFiles) {
        const parentId = file.parents?.[0] || "root"
        if (!folderMap.has(parentId)) {
          folderMap.set(parentId, [])
        }
        folderMap.get(parentId)?.push(file)
      }

      const foldersData = []
      for (const [folderId, files] of folderMap.entries()) {
        let folderName = "Carpeta sin nombre"

        if (folderId !== "root") {
          try {
            const apiKey = driveService.apiKey
            if (apiKey) {
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=name`,
              )
              if (response.ok) {
                const data = await response.json()
                folderName = data.name
              }
            }
          } catch (error) {
            console.error("[v0] Error getting folder name:", error)
          }
        }

        foldersData.push({
          id: folderId,
          name: folderName,
          fileCount: files.length,
          files,
        })
      }

      console.log("[v0] Loaded folders for processing:", foldersData.length)
      setFolders(foldersData)
    } catch (error) {
      console.error("[v0] Error loading folders:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las carpetas de Google Drive",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processFolder = async (folder: any) => {
    setProcessing(true)

    setResults((prev) => [
      ...prev,
      {
        folderId: folder.id,
        folderName: folder.name,
        status: "pending",
      },
    ])

    try {
      console.log("[v0] Processing folder with agents:", folder.name)

      setResults((prev) => prev.map((r) => (r.folderId === folder.id ? { ...r, status: "processing" } : r)))

      const result = await orchestrator.processGoogleDriveFolder(folder.id)

      console.log("[v0] Folder processing result:", result)

      setResults((prev) =>
        prev.map((r) =>
          r.folderId === folder.id
            ? {
                ...r,
                status: result.success ? "completed" : "failed",
                result: result.data,
                error: result.error,
              }
            : r,
        ),
      )

      toast({
        title: result.success ? "Procesamiento Exitoso" : "Error en Procesamiento",
        description: result.success
          ? `Carpeta "${folder.name}" procesada correctamente`
          : `Error al procesar "${folder.name}": ${result.error}`,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("[v0] Error processing folder:", error)

      setResults((prev) =>
        prev.map((r) =>
          r.folderId === folder.id
            ? {
                ...r,
                status: "failed",
                error: error instanceof Error ? error.message : "Error desconocido",
              }
            : r,
        ),
      )

      toast({
        title: "Error",
        description: `Error al procesar carpeta: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const processAllFolders = async () => {
    for (const folder of folders) {
      await processFolder(folder)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Procesador de Carpetas Google Drive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Google Drive No Conectado</h3>
            <p className="text-sm text-gray-600 mb-4">
              El procesador de carpetas requiere conexión activa a Google Drive.
            </p>
            <p className="text-xs text-gray-500">
              Verifique la configuración de OAuth 2.0 o contacte al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Folders to Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carpetas CAMPOS Disponibles</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadFolders} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
              </Button>
              <Button size="sm" onClick={processAllFolders} disabled={processing || folders.length === 0}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Procesar Todas
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : folders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron carpetas</p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-sm text-gray-500">{folder.fileCount} archivos</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => processFolder(folder)} disabled={processing}>
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Procesar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {result.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {result.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                      {result.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                      {result.status === "pending" && <AlertCircle className="h-5 w-5 text-gray-400" />}
                      <div>
                        <p className="font-medium">{result.folderName}</p>
                        <Badge
                          variant={
                            result.status === "completed"
                              ? "default"
                              : result.status === "failed"
                                ? "destructive"
                                : result.status === "processing"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="mt-1"
                        >
                          {result.status === "completed"
                            ? "Completado"
                            : result.status === "failed"
                              ? "Fallido"
                              : result.status === "processing"
                                ? "Procesando"
                                : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {result.status === "processing" && <Progress value={50} className="mb-2" />}

                  {result.result && (
                    <div className="mt-3 space-y-2 text-sm">
                      {result.result.folderAnalysis && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="font-medium text-blue-900 mb-1">Análisis de Estructura:</p>
                          <p className="text-blue-700">
                            Cumplimiento: {result.result.folderAnalysis.compliance?.score || 0}%
                          </p>
                          {result.result.folderAnalysis.compliance?.missingFolders?.length > 0 && (
                            <p className="text-blue-600 text-xs mt-1">
                              Carpetas faltantes: {result.result.folderAnalysis.compliance.missingFolders.join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {result.result.validation && (
                        <div className="bg-yellow-50 p-3 rounded">
                          <p className="font-medium text-yellow-900 mb-1">Validación:</p>
                          <p className="text-yellow-700">
                            {result.result.validation.isValid ? "✓ Estructura válida" : "✗ Requiere ajustes"}
                          </p>
                        </div>
                      )}

                      {result.result.extraction && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="font-medium text-green-900 mb-1">Extracción de Datos:</p>
                          <p className="text-green-700">
                            {result.result.extraction.extractedCount || 0} elementos extraídos
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-3 bg-red-50 p-3 rounded">
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
