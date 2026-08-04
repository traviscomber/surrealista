"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, File, Folder, Loader2, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { realDriveService, type DriveFile, type FolderStructure } from "@/lib/google-drive/real-drive-service"

interface SimpleDriveFolderViewProps {
  rootFolderId?: string
}

export function SimpleDriveFolderView({ rootFolderId }: SimpleDriveFolderViewProps) {
  const [folders, setFolders] = useState<FolderStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    void loadFolders()
  }, [rootFolderId])

  const totalFiles = useMemo(() => folders.reduce((sum, folder) => sum + (folder.totalFiles || 0), 0), [folders])

  const loadFolders = async () => {
    setLoading(true)
    setError(null)

    try {
      const authenticated = await realDriveService.authenticate()
      if (!authenticated) throw new Error("La integración documental no está disponible.")

      const folderData = await realDriveService.listSuccessCases()
      setFolders(folderData)
    } catch (err: any) {
      console.error("[document-explorer] No se pudieron cargar los archivos", err)
      setError("No se pudo acceder a la fuente documental configurada.")
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  const matches = (value: string) => !searchTerm.trim() || value.toLowerCase().includes(searchTerm.trim().toLowerCase())

  const renderFile = (file: DriveFile, depth: number) => {
    if (!matches(file.name)) return null
    const isFolder = file.mimeType === "application/vnd.google-apps.folder"
    const Icon = isFolder ? Folder : File

    return (
      <div
        key={file.id}
        className="flex min-h-10 items-center gap-3 border-b border-border/50 px-3 py-2 transition-colors hover:bg-secondary/35"
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
        {file.size && <span className="sr-meta shrink-0">{formatFileSize(Number.parseInt(file.size, 10))}</span>}
      </div>
    )
  }

  const renderFolder = (folder: FolderStructure, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const hasChildren = folder.files.length > 0 || folder.subfolders.length > 0
    const folderMatches = matches(folder.name)
    const childMatches =
      folder.files.some((file) => matches(file.name)) || folder.subfolders.some((subfolder) => matches(subfolder.name))

    if (searchTerm.trim() && !folderMatches && !childMatches) return null

    return (
      <div key={folder.id} className="w-full">
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left transition-colors hover:bg-secondary/40"
          style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          onClick={() => hasChildren && toggleFolder(folder.id)}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )
          ) : (
            <span className="w-4" />
          )}
          <Folder className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{folder.name}</span>
          <span className="sr-meta shrink-0">{folder.totalFiles} archivos</span>
        </button>

        {(isExpanded || Boolean(searchTerm.trim())) && (
          <div>
            {folder.subfolders.map((subfolder) => renderFolder(subfolder, depth + 1))}
            {folder.files.map((file) => renderFile(file, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center border-y border-border bg-card" role="status">
        <Loader2 className="mr-3 h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Cargando fuente documental…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-y border-border bg-card px-6 text-center">
        <Folder className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 className="sr-panel-title">Fuente documental no disponible</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => void loadFolders()}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <section className="overflow-hidden border-y border-border bg-card">
      <header className="flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="sr-meta uppercase tracking-[0.18em]">Fuente documental</p>
          <h2 className="mt-1 sr-section-title">Archivos y carpetas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {folders.length} carpetas principales · {totalFiles} archivos registrados
          </p>
        </div>
        <div className="flex w-full gap-2 lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => void loadFolders()} aria-label="Actualizar archivos">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {folders.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
          <Folder className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 sr-panel-title">No hay carpetas disponibles</h3>
          <p className="mt-2 text-sm text-muted-foreground">La fuente conectada no devolvió contenido visible.</p>
        </div>
      ) : (
        <div className="max-h-[640px] overflow-y-auto">{folders.map((folder) => renderFolder(folder))}</div>
      )}
    </section>
  )
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${(bytes / Math.pow(k, index)).toFixed(1)} ${sizes[index]}`
}
