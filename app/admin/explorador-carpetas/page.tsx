"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Folder, File, Loader2, ChevronRight } from "lucide-react"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webViewLink?: string
}

export default function ExploradorCarpetasPage() {
  const [loading, setLoading] = useState(false)
  const [folderId, setFolderId] = useState("1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F")
  const [currentPath, setCurrentPath] = useState<string[]>(["Root"])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const loadFolder = async (id: string, folderName?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/drive/folders/${id}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setFiles(data.files || [])

      if (folderName) {
        setCurrentPath([...currentPath, folderName])
      }

      console.log(`[v0] Loaded ${data.files?.length || 0} items from folder ${id}`)
    } catch (error) {
      console.error("[v0] Error loading folder:", error)
      alert("Error al cargar la carpeta. Verifica la conexión con Google Drive.")
    } finally {
      setLoading(false)
    }
  }

  const openFolder = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      loadFolder(file.id, file.name)
      setFolderId(file.id)
    }
  }

  const goBack = () => {
    if (currentPath.length > 1) {
      // This is simplified - in production you'd track folder IDs in the path
      setCurrentPath(currentPath.slice(0, -1))
    }
  }

  const folders = files.filter((f) => f.mimeType === "application/vnd.google-apps.folder")
  const regularFiles = files.filter((f) => f.mimeType !== "application/vnd.google-apps.folder")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Explorador de Carpetas Google Drive</h1>
        <p className="text-gray-600">Navega por la estructura de carpetas y archivos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navegación</CardTitle>
          <CardDescription>Ruta actual: {currentPath.join(" / ")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="ID de carpeta de Google Drive"
              className="flex-1"
            />
            <Button onClick={() => loadFolder(folderId)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar Carpeta"
              )}
            </Button>
          </div>

          {currentPath.length > 1 && (
            <Button variant="outline" onClick={goBack}>
              ← Volver
            </Button>
          )}

          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">📁 Carpetas ({folders.length})</h3>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border"
                    onClick={() => openFolder(folder)}
                  >
                    <Folder className="h-5 w-5 text-blue-500" />
                    <span className="flex-1 font-medium">{folder.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {regularFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">📄 Archivos ({regularFiles.length})</h3>
              <div className="space-y-1">
                {regularFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <File className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {file.size ? `${(Number.parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : "N/A"} •
                        {new Date(file.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                    {file.webViewLink && (
                      <Button variant="outline" size="sm" onClick={() => window.open(file.webViewLink, "_blank")}>
                        Abrir
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No hay archivos en esta carpeta o aún no has cargado ninguna carpeta.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. El ID de carpeta por defecto es la carpeta raíz de Sur-Realista</p>
          <p>2. Haz clic en "Cargar Carpeta" para ver su contenido</p>
          <p>3. Haz clic en cualquier carpeta para navegar dentro de ella</p>
          <p>4. Para buscar "Campos 2024", navega por las carpetas hasta encontrarla</p>
        </CardContent>
      </Card>
    </div>
  )
}
