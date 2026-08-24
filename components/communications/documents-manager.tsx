"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, Download, Edit, ExternalLink, FileText, Folder, FolderPlus, Trash2 } from "lucide-react"

import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FolderDragDrop } from "./folder-drag-drop"

const DOCUMENT_TYPES = [
  { value: "orden_venta", label: "Orden de Venta" },
  { value: "documento_comercial", label: "Documento Comercial" },
  { value: "tasacion", label: "Tasación" },
  { value: "info_campo", label: "Información de Campo" },
  { value: "antecedentes_titulo", label: "Antecedentes de Título" },
  { value: "escritura", label: "Escritura" },
  { value: "certificado", label: "Certificado" },
  { value: "informe_tecnico", label: "Informe Técnico" },
  { value: "contrato", label: "Contrato" },
  { value: "presentacion", label: "Presentación" },
  { value: "kmz", label: "KMZ" },
  { value: "otro", label: "Otro" },
] as const

type DocumentRecord = {
  id: string
  title: string
  description: string | null
  status: string | null
  document_type: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  created_by?: string | null
}

type FolderRecord = {
  id: string
  name: string
  parent_id?: string | null
  created_by?: string | null
  created_at?: string | null
}

type EditableDocument = Omit<DocumentRecord, "id"> & {
  id?: string
  is_new?: boolean
}

function asDocuments(value: unknown): DocumentRecord[] {
  return Array.isArray(value) ? (value as DocumentRecord[]) : []
}

function asFolders(value: unknown): FolderRecord[] {
  return Array.isArray(value) ? (value as FolderRecord[]) : []
}

function extractFolderName(title: string) {
  const campo = title.match(/^Campo\s+([^-]+?)(?:\s*-|$)/i)
  if (campo?.[1]) return `Campo ${campo[1].trim()}`

  const prefix = title.match(/^([^-]+?)(?:\s*-|$)/)
  const name = prefix?.[1]?.trim()
  if (name && !["KMZ", "PDF", "DOC", "DOCX", "XLS", "XLSX"].includes(name.toUpperCase())) return name
  return "Otros"
}

function documentTypeForFile(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""
  if (["kmz", "kml"].includes(extension)) return "kmz"
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return "info_campo"
  return "documento_comercial"
}

export default function DocumentsManager() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [editingDoc, setEditingDoc] = useState<EditableDocument | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [deletingFolder, setDeletingFolder] = useState<FolderRecord | null>(null)
  const [viewingFolder, setViewingFolder] = useState<FolderRecord | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setErrorMessage("")

    const [documentsResult, foldersResult] = await Promise.all([
      supabase.from("property_documents").select("*").order("title"),
      supabase.from("folders").select("*").order("created_at"),
    ])

    if (documentsResult.error) setErrorMessage(documentsResult.error.message)
    if (foldersResult.error) setErrorMessage((current) => current || foldersResult.error?.message || "Error al cargar carpetas")

    setDocs(asDocuments(documentsResult.data))
    setFolders(asFolders(foldersResult.data))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let active = true

    async function initialize() {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      setUserId(data.user?.id || "00000000-0000-0000-0000-000000000000")
      await refresh()
    }

    void initialize()
    return () => {
      active = false
    }
  }, [refresh, supabase])

  const groupedDocuments = useMemo(() => {
    const grouped: Record<string, DocumentRecord[]> = {}
    for (const doc of docs) {
      const folderName = extractFolderName(doc.title)
      if (!grouped[folderName]) grouped[folderName] = []
      grouped[folderName].push(doc)
    }
    return grouped
  }, [docs])

  const visibleFolders = useMemo(() => {
    const names = new Set<string>([...Object.keys(groupedDocuments), ...folders.map((folder) => folder.name)])
    const query = searchQuery.trim().toLowerCase()

    return Array.from(names)
      .sort((left, right) => left.localeCompare(right, "es"))
      .map((name) => {
        const records = (groupedDocuments[name] || []).filter((doc) => {
          if (filterStatus !== "all" && (doc.status || "active") !== filterStatus) return false
          if (!query) return true
          return `${doc.title} ${doc.description || ""}`.toLowerCase().includes(query)
        })
        return { name, records, databaseFolder: folders.find((folder) => folder.name === name) || null }
      })
      .filter((folder) => folder.records.length > 0 || (!query && filterStatus === "all"))
  }, [filterStatus, folders, groupedDocuments, searchQuery])

  async function createFolder() {
    const cleanName = newFolderName.trim()
    if (!cleanName || !userId) return
    const name = cleanName.toLowerCase().startsWith("campo ") ? cleanName : `Campo ${cleanName}`

    const { error } = await supabase.from("folders").insert({ name, parent_id: null, created_by: userId })
    if (error) {
      setErrorMessage(error.message)
      return
    }

    setNewFolderName("")
    setShowNewFolderDialog(false)
    await refresh()
  }

  function createDocument(folderName?: string) {
    setEditingDoc({
      title: folderName ? `${folderName} - ` : "",
      description: "",
      status: "active",
      document_type: "otro",
      file_url: "",
      file_type: "",
      file_size: 0,
      created_by: userId,
      is_new: true,
    })
  }

  async function saveDocument() {
    if (!editingDoc?.title.trim() || !editingDoc.document_type) return

    const payload = {
      title: editingDoc.title.trim(),
      description: editingDoc.description || "",
      status: editingDoc.status || "active",
      document_type: editingDoc.document_type,
      file_url: editingDoc.file_url || "",
      file_type: editingDoc.file_type || "",
      file_size: editingDoc.file_size || 0,
    }

    const result = editingDoc.is_new
      ? await supabase.from("property_documents").insert({ ...payload, created_by: userId })
      : await supabase.from("property_documents").update(payload).eq("id", editingDoc.id as string)

    if (result.error) {
      setErrorMessage(result.error.message)
      return
    }

    setEditingDoc(null)
    await refresh()
  }

  async function deleteDocument() {
    if (!deletingDoc) return
    const { error } = await supabase.from("property_documents").delete().eq("id", deletingDoc.id)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setDeletingDoc(null)
    await refresh()
  }

  async function deleteFolder() {
    if (!deletingFolder) return
    const { error } = await supabase.from("folders").delete().eq("id", deletingFolder.id)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setDeletingFolder(null)
    if (viewingFolder?.id === deletingFolder.id) setViewingFolder(null)
    await refresh()
  }

  async function uploadFile(file: File) {
    if (!editingDoc) return
    setUploading(true)
    setErrorMessage("")

    try {
      const form = new FormData()
      form.append("file", file)
      form.append("filename", `${editingDoc.title || file.name}-${Date.now()}`)
      const response = await fetch("/api/upload", { method: "POST", body: form })
      const body = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !body.url) throw new Error(body.error || "No se pudo cargar el archivo")

      setEditingDoc((current) =>
        current
          ? {
              ...current,
              file_url: body.url || "",
              file_type: file.type,
              file_size: file.size,
              document_type: documentTypeForFile(file.name),
            }
          : current,
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el archivo")
    } finally {
      setUploading(false)
    }
  }

  if (viewingFolder) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setViewingFolder(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <div>
              <p className="sr-meta">Carpeta documental</p>
              <h3 className="text-lg font-semibold">{viewingFolder.name}</h3>
            </div>
          </div>
          <Button size="sm" onClick={() => createDocument(viewingFolder.name)}>
            <FileText className="mr-2 h-4 w-4" /> Nuevo documento
          </Button>
        </div>
        <FolderDragDrop folderName={viewingFolder.name} folderId={viewingFolder.id} onFilesUpdated={() => void refresh()} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documentación real</h3>
          <p className="text-sm text-muted-foreground">Documentos y carpetas persistidos en Supabase. Sin registros demo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="mr-2 h-4 w-4" /> Nueva carpeta
          </Button>
          <Button size="sm" onClick={() => createDocument()}>
            <FileText className="mr-2 h-4 w-4" /> Nuevo documento
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar documentos..." />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="archived">Archivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorMessage && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}
      {loading && <p className="text-sm text-muted-foreground">Cargando documentos...</p>}

      {!loading && visibleFolders.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No hay documentos que coincidan con la búsqueda.
        </div>
      )}

      <div className="space-y-4">
        {visibleFolders.map(({ name, records, databaseFolder }) => (
          <section key={name} className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                <span className="font-medium">{name}</span>
                <Badge variant="secondary">{records.length}</Badge>
              </div>
              <div className="flex gap-2">
                {databaseFolder && (
                  <Button variant="outline" size="sm" onClick={() => setViewingFolder(databaseFolder)}>Abrir carpeta</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => createDocument(name)}>Agregar</Button>
                {databaseFolder && (
                  <Button variant="ghost" size="icon" aria-label={`Eliminar ${name}`} onClick={() => setDeletingFolder(databaseFolder)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {records.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Carpeta vacía.</p>
            ) : (
              <div className="divide-y divide-border">
                {records.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{doc.title}</p>
                        <Badge variant="outline">{doc.document_type || "otro"}</Badge>
                        <Badge variant="secondary">{doc.status || "active"}</Badge>
                      </div>
                      {doc.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {doc.file_url && (
                        <>
                          <Button variant="ghost" size="icon" asChild aria-label="Abrir documento">
                            <a href={doc.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild aria-label="Descargar documento">
                            <a href={doc.file_url} download><Download className="h-4 w-4" /></a>
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" aria-label="Editar documento" onClick={() => setEditingDoc({ ...doc })}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Eliminar documento" onClick={() => setDeletingDoc(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <Dialog open={Boolean(editingDoc)} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDoc?.is_new ? "Nuevo documento" : "Editar documento"}</DialogTitle>
            <DialogDescription>Los cambios se guardan en property_documents.</DialogDescription>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label htmlFor="doc-title">Título</Label><Input id="doc-title" value={editingDoc.title} onChange={(event) => setEditingDoc({ ...editingDoc, title: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="doc-description">Descripción</Label><Textarea id="doc-description" value={editingDoc.description || ""} onChange={(event) => setEditingDoc({ ...editingDoc, description: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editingDoc.document_type || "otro"} onValueChange={(value) => setEditingDoc({ ...editingDoc, document_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={editingDoc.status || "active"} onValueChange={(value) => setEditingDoc({ ...editingDoc, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="archived">Archivado</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file">Archivo</Label>
                <Input id="doc-file" type="file" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file) }} />
                {editingDoc.file_url && <p className="truncate text-xs text-muted-foreground">{editingDoc.file_url}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancelar</Button>
            <Button disabled={!editingDoc?.title.trim() || uploading} onClick={() => void saveDocument()}>{uploading ? "Cargando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva carpeta</DialogTitle><DialogDescription>Crea una carpeta persistente para organizar documentación.</DialogDescription></DialogHeader>
          <div className="space-y-2 py-2"><Label htmlFor="folder-name">Nombre</Label><Input id="folder-name" value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Los Laureles" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancelar</Button><Button disabled={!newFolderName.trim()} onClick={() => void createFolder()}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingDoc)} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar documento</AlertDialogTitle><AlertDialogDescription>Se eliminará “{deletingDoc?.title}” de Supabase. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void deleteDocument()}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletingFolder)} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar carpeta</AlertDialogTitle><AlertDialogDescription>Se eliminará “{deletingFolder?.name}”. Los documentos existentes no se borrarán.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void deleteFolder()}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
