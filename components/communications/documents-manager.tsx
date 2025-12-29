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
  MoreVertical,
} from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const DocumentsManager = () => {
  const [docs, setDocs] = useState([])
  const [folders, setFolders] = useState([])
  const [editingDoc, setEditingDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [editingFolder, setEditingFolder] = useState(null)
  const [deletingFolder, setDeletingFolder] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedFolders, setExpandedFolders] = useState({})
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [userId, setUserId] = useState(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchUserAndDocuments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        console.log("[v0] User authenticated:", user.id)
      } else {
        setUserId("00000000-0000-0000-0000-000000000000")
        console.log("[v0] No user authenticated, using system UUID")
      }

      const { data: foldersData } = await supabase.from("folders").select("*").order("created_at")

      if (foldersData) {
        console.log("[v0] Loaded folders from database:", foldersData)
        setFolders(foldersData)
      }

      const { data } = await supabase.from("property_documents").select("*").order("title")
      setDocs(data || [])
    }
    fetchUserAndDocuments()
  }, [])

  const extractFolderName = (title) => {
    const match = title.match(/^(Campo\s+[^-]+?)(?:\s*-|$)/)
    return match ? match[1].trim() : "Otros"
  }

  const groupedDocs = docs.reduce((acc, doc) => {
    const folder = extractFolderName(doc.title)
    if (!acc[folder]) {
      acc[folder] = []
    }
    acc[folder].push(doc)
    return acc
  }, {})

  const allFolders = {}

  // Add folders from documents
  Object.assign(allFolders, groupedDocs)

  // Add folders from database
  folders.forEach((folder) => {
    if (!allFolders[folder.name]) {
      allFolders[folder.name] = []
    }
  })

  const handleToggleFolder = (folderName) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }))
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      console.log("[v0] Folder name is empty")
      return
    }

    if (!userId) {
      console.error("[v0] No authenticated user, cannot create folder")
      return
    }

    const folderName = newFolderName.trim()
    const folderKey = `Campo ${folderName}`

    try {
      const { data, error } = await supabase
        .from("folders")
        .insert([
          {
            name: folderKey,
            parent_id: null,
            created_by: userId,
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error creating folder:", error)
        return
      }

      console.log("[v0] Folder created in database:", data)

      if (data && data.length > 0) {
        setFolders((prev) => [...prev, data[0]])
      }

      // Clear form and close dialog
      setNewFolderName("")
      setShowNewFolderDialog(false)

      // Expand the new folder
      setExpandedFolders((prev) => ({
        ...prev,
        [folderKey]: true,
      }))
    } catch (err) {
      console.error("[v0] Unexpected error creating folder:", err)
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
      console.log("[v0] Saving document:", { id: editingDoc.id, title: editingDoc.title, status: editingDoc.status })

      const updateData = {
        title: editingDoc.title,
        description: editingDoc.description || "",
        status: editingDoc.status?.toLowerCase() || "active",
      }

      const { data, error } = await supabase.from("property_documents").update(updateData).eq("id", editingDoc.id)

      if (error) {
        console.log("[v0] Error saving document:", error.message)
        alert(`Error al guardar: ${error.message}`)
      } else {
        console.log("[v0] Document saved successfully")
        setDocs(docs.map((doc) => (doc.id === editingDoc.id ? { ...doc, ...updateData } : doc)))
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
      status: "active",
      file_url: "",
      is_new: true,
    })
  }

  const handleDeleteFolder = async (folderId) => {
    try {
      const { error } = await supabase.from("folders").delete().eq("id", folderId)
      if (error) {
        console.error("[v0] Error deleting folder:", error)
        return
      }
      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      setDeletingFolder(null)
      console.log("[v0] Folder deleted successfully")
    } catch (err) {
      console.error("[v0] Unexpected error deleting folder:", err)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder?.name?.trim()) {
      console.log("[v0] Folder name is empty")
      return
    }

    try {
      const oldName = editingFolder.oldName || editingFolder.name
      const newName = editingFolder.name.trim()
      console.log("[v0] Renaming folder from:", oldName, "to:", newName)

      if (!editingFolder.id) {
        const docsToUpdate = docs.filter((doc) => {
          const docFolderName = extractFolderName(doc.title)
          return docFolderName === oldName
        })

        console.log("[v0] Found", docsToUpdate.length, "documents to update")

        // Update all docs in database
        for (const doc of docsToUpdate) {
          const docNameWithoutFolder = doc.title.replace(/^[^-]+-\s*/, "")
          const newTitle = `${newName} - ${docNameWithoutFolder}`
          console.log("[v0] Updating doc:", doc.title, "to:", newTitle)
          await supabase.from("property_documents").update({ title: newTitle }).eq("id", doc.id)
        }

        const { data: updatedData } = await supabase.from("property_documents").select("*").order("title")
        if (updatedData) {
          setDocs([...updatedData])
          console.log("[v0] Docs reloaded, new data:", updatedData.length, "items")
        }

        setEditingFolder(null)
        console.log("[v0] Document folder renamed successfully")
        return
      }

      // For database folders, use normal update
      const { error } = await supabase.from("folders").update({ name: newName }).eq("id", editingFolder.id)

      if (error) {
        console.error("[v0] Error updating folder:", error)
        return
      }

      setFolders((prev) => prev.map((f) => (f.id === editingFolder.id ? { ...f, name: newName } : f)))
      setEditingFolder(null)
      console.log("[v0] Folder updated successfully")
    } catch (err) {
      console.error("[v0] Unexpected error updating folder:", err)
    }
  }

  const filteredFolders = Object.entries(allFolders).reduce((acc, [folderName, folderDocs]) => {
    const filtered = folderDocs.filter((doc) => {
      if (filterStatus !== "all" && doc.status !== filterStatus) return false
      if (!searchQuery) return true
      return doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    })
    if (filtered.length > 0 || searchQuery === "") {
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
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNewFolderDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <FolderPlus className="h-4 w-4 mr-2" />
          Nueva Carpeta
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(filteredFolders).map(([folderName, folderDocs]) => {
          const folderObj = folders.find((f) => f.name === folderName)

          return (
            <div key={folderName} className="border rounded-lg">
              <div className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors group">
                <button onClick={() => handleToggleFolder(folderName)} className="flex items-center gap-2 flex-1">
                  {expandedFolders[folderName] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Folder className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{folderName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{folderDocs.length} documento(s)</span>
                </button>

                {folderObj && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Opciones de carpeta"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingFolder(folderObj)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingFolder(folderObj)}
                        className="text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {!folderObj && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Opciones de carpeta"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingFolder({ name: folderName, oldName: folderName })}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Renombrar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {expandedFolders[folderName] && (
                <div className="border-t divide-y bg-muted/20 p-2 space-y-1">
                  {folderDocs.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2">No hay documentos en esta carpeta</div>
                  ) : (
                    folderDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-medium truncate">{doc.title}</div>
                          <div className="text-xs text-muted-foreground">{doc.description || ""}</div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant={doc.status === "active" ? "default" : "secondary"} className="text-xs">
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
                    ))
                  )}
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
          )
        })}
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

      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renombrar Carpeta</DialogTitle>
              <DialogDescription>Cambiar el nombre de la carpeta "{editingFolder.name}"</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-edit-name">Nuevo Nombre</Label>
                <Input
                  id="folder-edit-name"
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                  placeholder="Ingresa el nuevo nombre"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFolder(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateFolder} className="bg-emerald-600 hover:bg-emerald-700">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingFolder && (
        <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Carpeta</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar la carpeta "{deletingFolder.name}"? Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteFolder(deletingFolder.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
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
