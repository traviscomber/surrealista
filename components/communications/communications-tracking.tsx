"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  MessageSquare,
  Instagram,
  Mail,
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Communication {
  id: string
  client_id?: string
  communication_type: string
  subject: string
  content: string
  communication_date: string
  direction: string
  created_by: string
  attachments?: any
}

interface CommunicationsTrackingProps {
  refreshTrigger?: number
}

export function CommunicationsTracking({ refreshTrigger }: CommunicationsTrackingProps) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [editingComm, setEditingComm] = useState<Communication | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingCommId, setDeletingCommId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    communication_type: "email",
    communication_date: new Date().toISOString().split("T")[0],
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    loadCommunications()
  }, [refreshTrigger])

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from("client_communications")
        .select("*")
        .order("communication_date", { ascending: false })
        .limit(100)

      if (error) throw error
      setCommunications(data || [])
    } catch (error) {
      console.error("Error loading communications:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (comm: Communication) => {
    return comm.attachments?.status || "sent"
  }

  const updateStatus = async (commId: string, newStatus: string) => {
    try {
      const comm = communications.find((c) => c.id === commId)
      if (!comm) return

      const updatedAttachments = {
        ...comm.attachments,
        status: newStatus,
        status_updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("client_communications")
        .update({ attachments: updatedAttachments })
        .eq("id", commId)

      if (error) throw error
      loadCommunications()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleCreateCommunication = async () => {
    try {
      const { error } = await supabase.from("client_communications").insert({
        subject: formData.subject,
        content: formData.content,
        communication_type: formData.communication_type,
        communication_date: formData.communication_date,
        direction: "outbound",
        created_by: "system",
        attachments: { status: "draft" },
      })

      if (error) throw error
      setIsCreateDialogOpen(false)
      setFormData({
        subject: "",
        content: "",
        communication_type: "email",
        communication_date: new Date().toISOString().split("T")[0],
      })
      loadCommunications()
    } catch (error) {
      console.error("Error creating communication:", error)
      alert("Error al crear comunicación")
    }
  }

  const handleEditCommunication = async () => {
    if (!editingComm) return

    try {
      const { error } = await supabase
        .from("client_communications")
        .update({
          subject: formData.subject,
          content: formData.content,
          communication_type: formData.communication_type,
          communication_date: formData.communication_date,
        })
        .eq("id", editingComm.id)

      if (error) throw error
      setIsEditDialogOpen(false)
      setEditingComm(null)
      loadCommunications()
    } catch (error) {
      console.error("Error updating communication:", error)
      alert("Error al actualizar comunicación")
    }
  }

  const handleDeleteCommunication = async () => {
    if (!deletingCommId) return

    try {
      const { error } = await supabase.from("client_communications").delete().eq("id", deletingCommId)

      if (error) throw error
      setIsDeleteDialogOpen(false)
      setDeletingCommId(null)
      loadCommunications()
    } catch (error) {
      console.error("Error deleting communication:", error)
      alert("Error al eliminar comunicación")
    }
  }

  const openEditDialog = (comm: Communication) => {
    setEditingComm(comm)
    setFormData({
      subject: comm.subject,
      content: comm.content,
      communication_type: comm.communication_type,
      communication_date: comm.communication_date.split("T")[0],
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (commId: string) => {
    setDeletingCommId(commId)
    setIsDeleteDialogOpen(true)
  }

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || comm.communication_type === filterType
    const matchesStatus = filterStatus === "all" || getStatus(comm) === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const configs = {
      draft: { label: "Borrador", className: "bg-gray-100 text-gray-700", icon: Clock },
      in_progress: { label: "En Progreso", className: "bg-blue-100 text-blue-700", icon: AlertCircle },
      scheduled: { label: "Programado", className: "bg-purple-100 text-purple-700", icon: Calendar },
      sent: { label: "Enviado", className: "bg-green-100 text-green-700", icon: Send },
      viewed: { label: "Visto", className: "bg-teal-100 text-teal-700", icon: Eye },
      responded: { label: "Respondido", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    }
    const config = configs[status as keyof typeof configs] || configs.sent
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      case "portal":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Stats calculation
  const stats = {
    total: communications.length,
    draft: communications.filter((c) => getStatus(c) === "draft").length,
    in_progress: communications.filter((c) => getStatus(c) === "in_progress").length,
    sent: communications.filter((c) => getStatus(c) === "sent").length,
    responded: communications.filter((c) => getStatus(c) === "responded").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
            <div className="text-sm text-gray-600">Borradores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-sm text-gray-600">En Progreso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Enviados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.responded}</div>
            <div className="text-sm text-gray-600">Respondidos</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar comunicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Comunicación
            </Button>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="portal">Portal Inmobiliario</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="viewed">Visto</SelectItem>
                <SelectItem value="responded">Respondido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Communications List */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando comunicaciones...</p>
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay comunicaciones</h3>
              <p className="text-gray-500">Crea una nueva comunicación o usa templates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCommunications.map((comm) => {
                const currentStatus = getStatus(comm)
                return (
                  <Card key={comm.id} className="hover:bg-gray-50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-purple-50">{getTypeIcon(comm.communication_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{comm.subject}</h4>
                                {getStatusBadge(currentStatus)}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comm.content}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(comm.communication_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {comm.created_by}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {comm.communication_type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(comm)} className="gap-1">
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDeleteDialog(comm.id)}
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                              {currentStatus === "draft" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatus(comm.id, "in_progress")}
                                >
                                  Iniciar
                                </Button>
                              )}
                              {currentStatus === "in_progress" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(comm.id, "scheduled")}
                                  >
                                    Programar
                                  </Button>
                                  <Button size="sm" onClick={() => updateStatus(comm.id, "sent")}>
                                    Marcar Enviado
                                  </Button>
                                </>
                              )}
                              {currentStatus === "scheduled" && (
                                <Button size="sm" onClick={() => updateStatus(comm.id, "sent")}>
                                  Marcar Enviado
                                </Button>
                              )}
                              {currentStatus === "sent" && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus(comm.id, "viewed")}>
                                  Marcar Visto
                                </Button>
                              )}
                              {currentStatus === "viewed" && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus(comm.id, "responded")}>
                                  Marcar Respondido
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingComm(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingComm ? "Editar Comunicación" : "Nueva Comunicación"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asunto / Título</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ej: Post Instagram - Propiedad en Valdivia"
              />
            </div>
            <div>
              <Label>Contenido</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribe el contenido de la comunicación..."
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Comunicación</Label>
                <Select
                  value={formData.communication_type}
                  onValueChange={(value) => setFormData({ ...formData, communication_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="portal">Portal Inmobiliario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.communication_date}
                  onChange={(e) => setFormData({ ...formData, communication_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setEditingComm(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingComm ? handleEditCommunication : handleCreateCommunication}>
              {editingComm ? "Guardar Cambios" : "Crear Comunicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Comunicación?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta comunicación?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCommunication}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
