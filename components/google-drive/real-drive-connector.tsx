"use client"

import { useRef, useState } from "react"
import { AlertCircle, CheckCircle2, File, FolderOpen, FolderPlus, Loader2, Pencil, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { realDriveService, type DriveFile, type FolderStructure } from "@/lib/google-drive/real-drive-service"

export default function RealDriveConnector() {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null)
  const [items, setItems] = useState<DriveFile[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [writing, setWriting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFolders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await realDriveService.listSuccessCases()
      setFolders(data)
      if (currentFolder) {
        setItems(await realDriveService.listFolderContents(currentFolder.id))
      }
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

  const openFolder = async (folder: { id: string; name: string }) => {
    setLoading(true)
    setError(null)
    try {
      setCurrentFolder(folder)
      setItems(await realDriveService.listFolderContents(folder.id))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo abrir la carpeta")
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async () => {
    if (!currentFolder || !newFolderName.trim()) return
    setWriting(true)
    setError(null)
    try {
      await realDriveService.createFolder(currentFolder.id, newFolderName.trim())
      setNewFolderName("")
      setItems(await realDriveService.listFolderContents(currentFolder.id))
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "No se pudo crear la carpeta")
    } finally {
      setWriting(false)
    }
  }

  const uploadFile = async (file: File) => {
    if (!currentFolder) return
    setWriting(true)
    setError(null)
    try {
      await realDriveService.uploadFile(currentFolder.id, file)
      setItems(await realDriveService.listFolderContents(currentFolder.id))
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "No se pudo subir el archivo")
    } finally {
      setWriting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const renameItem = async (item: DriveFile) => {
    const name = window.prompt("Nuevo nombre", item.name)?.trim()
    if (!name || name === item.name) return
    setWriting(true)
    setError(null)
    try {
      await realDriveService.renameFile(item.id, name)
      if (currentFolder) setItems(await realDriveService.listFolderContents(currentFolder.id))
      else await loadFolders()
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "No se pudo renombrar")
    } finally {
      setWriting(false)
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
            Explorador conectado por OAuth server-side. Permite navegar, crear carpetas, subir y renombrar archivos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Conexión con escritura habilitada
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void realDriveService.reauthorizeForEditing().then((ok) => ok && loadFolders())}
                  disabled={loading || writing}
                >
                  Autorizar edición
                </Button>
                <Button variant="outline" onClick={() => void loadFolders()} disabled={loading || writing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </div>
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
            <CardTitle className="text-lg">{currentFolder ? currentFolder.name : "Carpetas disponibles"}</CardTitle>
            <CardDescription>
              {currentFolder ? "Edita directamente esta carpeta de Google Drive." : "Selecciona una carpeta para navegar su contenido."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentFolder ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => { setCurrentFolder(null); setItems([]) }}>Volver</Button>
                  <div className="flex min-w-[260px] flex-1 gap-2">
                    <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Nueva carpeta" />
                    <Button variant="outline" onClick={() => void createFolder()} disabled={writing || !newFolderName.trim()}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Crear
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadFile(file)
                    }}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={writing}>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir archivo
                  </Button>
                </div>

                <div className="divide-y divide-border rounded-md border">
                  {loading ? (
                    <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                    </div>
                  ) : items.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-muted-foreground">Carpeta vacía.</div>
                  ) : items.map((item) => {
                    const isFolder = item.mimeType === "application/vnd.google-apps.folder"
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        {isFolder ? <FolderOpen className="h-4 w-4 text-primary" /> : <File className="h-4 w-4 text-muted-foreground" />}
                        <button
                          type="button"
                          className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
                          onClick={() => isFolder ? void openFolder({ id: item.id, name: item.name }) : item.webViewLink && window.open(item.webViewLink, "_blank", "noopener,noreferrer")}
                        >
                          {item.name}
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => void renameItem(item)} disabled={writing} aria-label="Renombrar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando carpetas…
              </div>
            ) : folders.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">La fuente conectada no devolvió carpetas visibles.</p>
            ) : (
              <div className="divide-y divide-border rounded-md border">
                {folders.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => void openFolder({ id: folder.id, name: folder.name })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 truncate text-sm font-medium">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
