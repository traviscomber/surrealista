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
import { FileText, Download, Trash2, ExternalLink, Edit, FolderPlus } from "lucide-react"

const DocumentsManager = () => {
  const [docs, setDocs] = useState([])
  const [editingDoc, setEditingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data } = await supabase.from("documents").select("*")
      setDocs(data || [])
    }
    fetchDocuments()
  }, [])

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
      const { data, error } = await supabase.from("documents").update(editingDoc).eq("id", editingDoc.id)
      if (!error) {
        setDocs(docs.map((doc) => (doc.id === editingDoc.id ? editingDoc : doc)))
        setEditingDoc(null)
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingDoc) {
      const { error } = await supabase.from("documents").delete().eq("id", deletingDoc.id)
      if (!error) {
        setDocs(docs.filter((doc) => doc.id !== deletingDoc.id))
        setDeletingDoc(null)
      }
    }
  }

  const filteredDocs = docs.filter((doc) => {
    if (filterStatus !== "all" && doc.status !== filterStatus) return false
    if (!searchQuery) return true
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          type="text"
          placeholder="Buscar documento..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
        <Select value={filterStatus} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => console.log("Open upload dialog")}>
          <FolderPlus className="h-4 w-4 mr-2" />
          Subir documento
        </Button>
      </div>
      <div className="space-y-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-grow">
              <div className="text-sm font-medium">{doc.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <Badge variant={doc.status === "vigente" ? "default" : "secondary"} className="text-xs">
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </Badge>
              {doc.file_url && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Opening file URL:", doc.file_url)
                      window.open(doc.file_url, "_blank")
                    }}
                    className="h-8 w-8 p-0"
                    title="Ver archivo"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Downloading file:", doc.file_url)
                      const link = document.createElement("a")
                      link.href = doc.file_url
                      link.download = doc.title || "document"
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="h-8 w-8 p-0"
                    title="Descargar archivo"
                  >
                    <Download className="h-4 w-4" />
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
                className="h-8 w-8 p-0"
                title="Editar documento"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeletingDocument(doc)
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Eliminar documento"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
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
                  value={editingDoc.description}
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
