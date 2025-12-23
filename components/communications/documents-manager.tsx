"use client"

import { useState, useEffect } from "react"
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
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Edit,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react"

const DocumentsManager = () => {
  const [docs, setDocs] = useState([])
  const [editingDoc, setEditingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedFolders, setExpandedFolders] = useState({})
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data } = await supabase.from("property_documents").select("*").order("title")
      setDocs(data || [])
    }
    fetchDocuments()
  }, [])

  const extractFolderName = (title) => {
    const match = title.match(/^(Campo\s+\w+)/)
    return match ? match[1] : "Otros"
  }

  const groupedDocs = docs.reduce((acc, doc) => {
    const folder = extractFolderName(doc.title)
    if (!acc[folder]) {
      acc[folder] = []
    }
    acc[folder].push(doc)
    return acc
  }, {})

  const handleToggleFolder = (folderName) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }))
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    const placeholderDoc = {
      title: `Campo ${newFolderName} - Carpeta`,
      description: `Carpeta: ${newFolderName}`,
      folder: `Campo ${newFolderName}`,
      status: "vigente",
      is_folder: true,
    }

    const { error } = await supabase.from("property_documents").insert([placeholderDoc])
    if (!error) {
      const { data } = await supabase.from("property_documents").select("*").order("title")
      setDocs(data || [])
      setNewFolderName("")
      setShowNewFolderDialog(false)
      handleToggleFolder(`Campo ${newFolderName}`)
    }
  }

  const openEditDialog = (document) => {
    setEditingDoc(document)
  }

  const setDeletingDocument = (document) => {
    setDeletingDoc(document)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
  }

  const handleEditSave = async () => {
    if (editingDoc) {
      const { error } = await supabase.from("property_documents").update(editingDoc).eq("id", editingDoc.id)
      if (!error) {
        setDocs(docs.map((doc) => (doc.id === editingDoc.id ? editingDoc : doc)))
        setEditingDoc(null)
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingDoc) {
      const { error } = await supabase.from("property_documents").delete().eq("id", deletingDoc.id)
      if (!error) {
        setDocs(docs.filter((doc) => doc.id !== deletingDoc.id))
        setDeletingDoc(null)
      }
    }
  }

  const handleAddDocumentToFolder = (folderName) => {
    setEditingDoc({
      title: `${folderName} - `,
      description: "",
      folder: folderName,
      status: "vigente",
      file_url: "",
      is_new: true,
    })
  }

  const filteredFolders = Object.entries(groupedDocs).reduce((acc, [folderName, folderDocs]) => {
    const filtered = folderDocs.filter((doc) => {
      if (filterStatus !== "all" && doc.status !== filterStatus) return false
      if (!searchQuery) return true
      return doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    })
    if (filtered.length > 0) {
      acc[folderName] = filtered
    }
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input
          type="text"
          placeholder="Buscar documentos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 min-w-[200px]"
        />
        <Select value={filterStatus} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
            <SelectItem value="archivo">Archivado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNewFolderDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <FolderPlus className="h-4 w-4 mr-2" />
          Nueva Carpeta
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(filteredFolders).map(([folderName, folderDocs]) => (
          <div key={folderName} className="border rounded-lg">
            {/* Folder header */}
            <button
              onClick={() => handleToggleFolder(folderName)}
              className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
            >
              {expandedFolders[folderName] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{folderName}</span>
              <span className="text-xs text-muted-foreground ml-auto">{folderDocs.length} documento(s)</span>
            </button>

            {/* Folder contents */}
            {expandedFolders[folderName] && (
              <div className="border-t divide-y bg-muted/20 p-2 space-y-1">
                {folderDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <div className="text-sm font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">{doc.description || ""}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={doc.status === "vigente" ? "default" : "secondary"} className="text-xs">
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </Badge>
                      {doc.file_url && !doc.is_folder && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(doc.file_url, "_blank")
                            }}
                            className="h-7 w-7 p-0"
                            title="Ver archivo"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              const link = document.createElement("a")
                              link.href = doc.file_url
                              link.download = doc.title || "document"
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                            className="h-7 w-7 p-0"
                            title="Descargar"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(doc)
                        }}
                        className="h-7 w-7 p-0"
                        title="Editar"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingDocument(doc)
                        }}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Add document to folder button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddDocumentToFolder(folderName)}
                  className="w-full text-xs mt-2"
                >
                  + Agregar documento
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNewFolderDialog && (
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Carpeta</DialogTitle>
              <DialogDescription>Crea una nueva carpeta para organizar documentos</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Nombre de la Carpeta</Label>
                <Input
                  id="folder-name"
                  placeholder="Ej: Iñipulli, Ranco, etc."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFolder}>Crear Carpeta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingDoc && (
        <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Documento</DialogTitle>
              <DialogDescription>Modifica los detalles del documento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Título</Label>
                <Input
                  id="name"
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="col-span-4"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={editingDoc.description || ""}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="col-span-4"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={editingDoc.status} onValueChange={(status) => setEditingDoc({ ...editingDoc, status })}>
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="archivo">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDoc(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingDoc && (
        <AlertDialog open={!!deletingDoc} onOpenChange={() => setDeletingDoc(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
              <AlertDialogDescription>¿Estás seguro de que quieres eliminar este documento?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

export default DocumentsManager
