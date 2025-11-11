"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      case "social_media":
        return <Instagram className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="social_media">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
              <p className="text-gray-500">Crea comunicaciones desde la biblioteca de templates</p>
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
                            {/* Status Actions */}
                            <div className="flex items-center gap-2">
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
    </div>
  )
}
