"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Filter, Edit, Trash2, ExternalLink, Calendar, Tag, MapPin, Lightbulb, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { FileUploader } from "./file-uploader"

interface Document {
  id: string
  title: string
  document_type: string
  description?: string
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  property_ids: string[]
  kmz_references: string[]
  tags: string[]
  related_client_id?: string
  document_date?: string
  expiry_date?: string
  version: number
  status: string
  metadata?: any
  created_by: string
  created_at: string
  updated_at: string
}

const DOCUMENT_TYPES = [
  { value: "orden_venta", label: "Orden de Venta", icon: "📋" },
  { value: "documento_comercial", label: "Documento Comercial", icon: "💼" },
  { value: "tasacion", label: "Tasación & Info del Campo", icon: "📊" },
  { value: "info_campo", label: "Información del Campo", icon: "🌾" },
  { value: "antecedentes_titulo", label: "Antecedentes de Título", icon: "📜" },
  { value: "escritura", label: "Escritura", icon: "✍️" },
  { value: "plano", label: "Plano", icon: "📐" },
  { value: "certificado", label: "Certificado", icon: "🏆" },
  { value: "contrato", label: "Contrato", icon: "📝" },
  { value: "otro", label: "Otro", icon: "📄" },
]

const STATUS_OPTIONS = [
  { value: "vigente", label: "Vigente", color: "bg-sage" },
  { value: "borrador", label: "Borrador", color: "bg-gray-500" },
  { value: "archivado", label: "Archivado", color: "bg-sage-dark" },
  { value: "vencido", label: "Vencido", color: "bg-red-500" },
]

export function DocumentsManager({ showDemoData = true }: { showDemoData?: boolean }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [deletingDocument, setDeleteingDocument] = useState<Document | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<
    { url: string; fileName: string; fileSize: number; fileType: string }[]
  >([])

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    document_type: "orden_venta",
    description: "",
    file_url: "",
    file_name: "",
    kmz_references: "",
    tags: "",
    document_date: "",
    status: "vigente",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading documents from database...")
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading documents:", error)
        throw error
      }

      console.log("[v0] Documents loaded:", data?.length || 0, "documents")
      console.log("[v0] Documents data:", data)
      setDocuments(data || [])
    } catch (error: any) {
      console.error("Error loading documents:", error)
      toast.error("Error al cargar documentos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = async () => {
    try {
      if (uploadedFiles.length > 0) {
        const promises = uploadedFiles.map((file) => {
          const documentData = {
            title: file.fileName.replace(/\.[^/.]+$/, ""), // Remove extension for title
            document_type: formData.document_type,
            description: formData.description || null,
            file_url: file.url,
            file_name: file.fileName,
            file_size: file.fileSize,
            file_type: file.fileType,
            kmz_references: formData.kmz_references ? formData.kmz_references.split(",").map((k) => k.trim()) : [],
            tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
            document_date: formData.document_date || null,
            status: formData.status,
            created_by: "system",
          }

          return supabase.from("documents").insert([documentData])
        })

        const results = await Promise.all(promises)
        const errors = results.filter((r) => r.error)

        if (errors.length > 0) {
          throw new Error(`${errors.length} documentos fallaron al crearse`)
        }

        toast.success(`${uploadedFiles.length} documento(s) creado(s) exitosamente`)
      } else {
        // Single document without file upload
        const documentData = {
          title: formData.title,
          document_type: formData.document_type,
          description: formData.description || null,
          file_url: formData.file_url || null,
          file_name: formData.file_name || null,
          kmz_references: formData.kmz_references ? formData.kmz_references.split(",").map((k) => k.trim()) : [],
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
          document_date: formData.document_date || null,
          status: formData.status,
          created_by: "system",
        }

        const { error } = await supabase.from("documents").insert([documentData])
        if (error) throw error

        toast.success("Documento creado exitosamente")
      }

      setIsCreateDialogOpen(false)
      resetForm()
      setUploadedFiles([])
      loadDocuments()
    } catch (error: any) {
      console.error("Error creating document:", error)
      toast.error(`Error al crear documento: ${error.message}`)
    }
  }

  const handleUpdateDocument = async () => {
    if (!editingDocument) return

    try {
      const documentData = {
        title: formData.title,
        document_type: formData.document_type,
        description: formData.description || null,
        file_url: formData.file_url || null,
        file_name: formData.file_name || null,
        kmz_references: formData.kmz_references ? formData.kmz_references.split(",").map((k) => k.trim()) : [],
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        document_date: formData.document_date || null,
        status: formData.status,
      }

      const { error } = await supabase.from("documents").update(documentData).eq("id", editingDocument.id)

      if (error) throw error

      toast.success("Documento actualizado exitosamente")
      setEditingDocument(null)
      resetForm()
      loadDocuments()
    } catch (error: any) {
      console.error("Error updating document:", error)
      toast.error(`Error al actualizar documento: ${error.message}`)
    }
  }

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return

    try {
      const { error } = await supabase.from("documents").delete().eq("id", deletingDocument.id)

      if (error) throw error

      toast.success("Documento eliminado exitosamente")
      setDeleteingDocument(null)
      loadDocuments()
    } catch (error: any) {
      console.error("Error deleting document:", error)
      toast.error(`Error al eliminar documento: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      document_type: "orden_venta",
      description: "",
      file_url: "",
      file_name: "",
      kmz_references: "",
      tags: "",
      document_date: "",
      status: "vigente",
    })
    setUploadedFiles([])
  }

  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc)
    setFormData({
      title: doc.title,
      document_type: doc.document_type,
      description: doc.description || "",
      file_url: doc.file_url || "",
      file_name: doc.file_name || "",
      kmz_references: doc.kmz_references.join(", "),
      tags: doc.tags.join(", "),
      document_date: doc.document_date || "",
      status: doc.status,
    })
  }

  const handleFileUpload = (files: { url: string; fileName: string; fileSize: number; fileType: string }[]) => {
    setUploadedFiles(files)

    // If only one file, auto-populate form fields
    if (files.length === 1) {
      setFormData({
        ...formData,
        file_url: files[0].url,
        file_name: files[0].fileName,
        title: formData.title || files[0].fileName.replace(/\.[^/.]+$/, ""),
      })
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.kmz_references.some((kmz) => kmz.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "todos" || doc.document_type === typeFilter
    const matchesStatus = statusFilter === "todos" || doc.status === statusFilter

    const isDemo =
      doc.tags?.includes("demo") ||
      doc.tags?.includes("ejemplo") ||
      doc.kmz_references.some((kmz) => kmz.toLowerCase().includes("ranco")) ||
      doc.title.toLowerCase().includes("ranco")
    const matchesDemoFilter = showDemoData || !isDemo

    return matchesSearch && matchesType && matchesStatus && matchesDemoFilter
  })

  // Statistics
  const stats = {
    total: documents.length,
    active: documents.filter((d) => d.status === "vigente").length,
    archived: documents.filter((d) => d.status === "archivado").length,
    draft: documents.filter((d) => d.status === "borrador").length,
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sage-dark">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Archivados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sage">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (!open) {
                  resetForm()
                  setUploadedFiles([])
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Documento</DialogTitle>
                  <DialogDescription>
                    Sube múltiples archivos (PDF, DOC, KMZ/KML) y vincúlalos con propiedades
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Subir Archivos</Label>
                    <FileUploader onUploadComplete={handleFileUpload} multiple={true} />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="p-4 bg-sage/5 border border-sage/30 rounded-md">
                      <p className="text-sm font-medium text-sage-dark mb-2">
                        {uploadedFiles.length} archivo(s) subido(s):
                      </p>
                      <ul className="text-sm text-sage-dark space-y-1">
                        {uploadedFiles.map((file, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            {file.fileName}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-sage mt-2">
                        Los campos a continuación se aplicarán a todos los documentos
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="title">Título {uploadedFiles.length === 0 && "*"}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={
                        uploadedFiles.length > 0 ? "Opcional - Se usará el nombre del archivo" : "Título del documento"
                      }
                    />
                    {uploadedFiles.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Opcional: Cada documento usará su nombre de archivo como título si se deja vacío
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="document_type">Tipo de Documento *</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalles del documento..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kmz_references">Referencias KMZ/KML (separadas por coma)</Label>
                    <Input
                      id="kmz_references"
                      value={formData.kmz_references}
                      onChange={(e) => setFormData({ ...formData, kmz_references: e.target.value })}
                      placeholder="ej: CAMPO_001.kmz, CAMPO_002.kml, LOTE_A.kmz"
                    />
                    <p className="text-xs text-gray-500">
                      Vincula {uploadedFiles.length > 1 ? "estos documentos" : "este documento"} con archivos KMZ/KML de
                      propiedades
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="ej: urgente, comercial, 2025"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="document_date">Fecha del Documento</Label>
                    <Input
                      id="document_date"
                      type="date"
                      value={formData.document_date}
                      onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {uploadedFiles.length === 0 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="file_url">URL del Archivo</Label>
                        <Input
                          id="file_url"
                          value={formData.file_url}
                          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="file_name">Nombre del Archivo</Label>
                        <Input
                          id="file_name"
                          value={formData.file_name}
                          onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                          placeholder="documento.pdf"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      resetForm()
                      setUploadedFiles([])
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateDocument}>
                    {uploadedFiles.length > 1 ? `Crear ${uploadedFiles.length} Documentos` : "Crear Documento"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">Cargando documentos...</CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron documentos</p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => {
            const docType = DOCUMENT_TYPES.find((t) => t.value === doc.document_type)
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status)
            const isDemo =
              doc.tags?.includes("demo") ||
              doc.tags?.includes("ejemplo") ||
              doc.kmz_references.some((kmz) => kmz.toLowerCase().includes("ranco")) ||
              doc.title.toLowerCase().includes("ranco")

            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{docType?.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{doc.title}</h3>
                            <Badge className={`${statusInfo?.color} text-white`} variant="secondary">
                              {statusInfo?.label}
                            </Badge>
                            {isDemo && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                DEMO
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{docType?.label}</p>
                          {doc.description && <p className="text-sm text-gray-700 mb-3">{doc.description}</p>}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {doc.kmz_references.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span className="font-medium">KMZ/KML: {doc.kmz_references.join(", ")}</span>
                              </div>
                            )}
                            {doc.document_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(doc.document_date).toLocaleDateString("es-CL")}
                              </div>
                            )}
                          </div>

                          {doc.tags.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Tag className="h-3 w-3 text-gray-400" />
                              {doc.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.file_url && (
                        <Button size="sm" variant="outline" onClick={() => window.open(doc.file_url, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteingDocument(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingDocument}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDocument(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>Modifica la información del documento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-document_type">Tipo de Documento *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-kmz_references">Referencias KMZ/KML (separadas por coma)</Label>
              <Input
                id="edit-kmz_references"
                value={formData.kmz_references}
                onChange={(e) => setFormData({ ...formData, kmz_references: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-file_url">URL del Archivo</Label>
              <Input
                id="edit-file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-file_name">Nombre del Archivo</Label>
              <Input
                id="edit-file_name"
                value={formData.file_name}
                onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-document_date">Fecha del Documento</Label>
              <Input
                id="edit-document_date"
                type="date"
                value={formData.document_date}
                onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingDocument(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateDocument}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDocument} onOpenChange={(open) => !open && setDeleteingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
              {deletingDocument && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{deletingDocument.title}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
