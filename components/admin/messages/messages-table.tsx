"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Star, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

type Message = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  property_id?: string
  property_title?: string
  created_at: string
  read: boolean
  read_at?: string
  status: "pending" | "in_progress" | "resolved" | "spam"
  priority: "low" | "medium" | "high"
}

export function MessagesTable() {
  return (
    <Suspense fallback={<div className="h-96 bg-muted/30 rounded-lg animate-pulse"></div>}>
      <MessagesTableContent />
    </Suspense>
  )
}

function MessagesTableContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      })
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  const toggleSelectMessage = (id: string) => {
    setSelectedMessages((prev) => (prev.includes(id) ? prev.filter((messageId) => messageId !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([])
    } else {
      setSelectedMessages(messages.map((message) => message.id))
    }
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar el mensaje como leído",
        variant: "destructive",
      })
    } else {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, read: true, read_at: new Date().toISOString() } : message,
        ),
      )
      toast({
        title: "Éxito",
        description: "Mensaje marcado como leído",
      })
    }
  }

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      })
    } else {
      setMessages((prev) => prev.filter((message) => message.id !== id))
      setSelectedMessages((prev) => prev.filter((messageId) => messageId !== id))
      toast({
        title: "Éxito",
        description: "Mensaje eliminado correctamente",
      })
    }
  }

  const updateStatus = async (id: string, status: Message["status"]) => {
    const { error } = await supabase.from("messages").update({ status }).eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje",
        variant: "destructive",
      })
    } else {
      setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, status } : message)))
      toast({
        title: "Éxito",
        description: `Estado actualizado a ${getStatusText(status)}`,
      })
    }
  }

  const bulkDelete = async () => {
    if (!selectedMessages.length) return

    const { error } = await supabase.from("messages").delete().in("id", selectedMessages)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los mensajes seleccionados",
        variant: "destructive",
      })
    } else {
      setMessages((prev) => prev.filter((message) => !selectedMessages.includes(message.id)))
      setSelectedMessages([])
      toast({
        title: "Éxito",
        description: `${selectedMessages.length} mensajes eliminados correctamente`,
      })
    }
  }

  const getStatusBadge = (status: Message["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendiente
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En Proceso
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Resuelto
          </Badge>
        )
      case "spam":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Spam
          </Badge>
        )
    }
  }

  const getStatusText = (status: Message["status"]) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_progress":
        return "En Proceso"
      case "resolved":
        return "Resuelto"
      case "spam":
        return "Spam"
    }
  }

  const getPriorityBadge = (priority: Message["priority"]) => {
    switch (priority) {
      case "low":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Baja
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Media
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Alta
          </Badge>
        )
    }
  }

  if (loading) {
    return <p>Cargando mensajes...</p>
  }

  return (
    <div className="space-y-4">
      {selectedMessages.length > 0 && (
        <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
          <p>{selectedMessages.length} mensajes seleccionados</p>
          <Button variant="destructive" size="sm" onClick={bulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar seleccionados
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedMessages.length === messages.length && messages.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead className="w-[180px]">Remitente</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead className="w-[150px]">Propiedad</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[100px]">Prioridad</TableHead>
              <TableHead className="w-[150px]">Fecha</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay mensajes para mostrar
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message.id} className={!message.read ? "bg-muted/30 font-medium" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={() => toggleSelectMessage(message.id)}
                      aria-label={`Seleccionar mensaje de ${message.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{message.name}</div>
                    <div className="text-sm text-muted-foreground">{message.email}</div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/mensajes/${message.id}`} className="hover:underline">
                      {message.subject || "Sin asunto"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {message.property_id ? (
                      <Link
                        href={`/admin/propiedades/editar/${message.property_id}`}
                        className="text-sm hover:underline text-blue-600"
                      >
                        {message.property_title || "Ver propiedad"}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(message.status)}</TableCell>
                  <TableCell>{getPriorityBadge(message.priority)}</TableCell>
                  <TableCell>
                    {format(new Date(message.created_at), "dd MMM yyyy", { locale: es })}
                    <div className="text-xs text-muted-foreground">{format(new Date(message.created_at), "HH:mm")}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/mensajes/${message.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        {!message.read && (
                          <DropdownMenuItem onClick={() => markAsRead(message.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como leído
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateStatus(message.id, "pending")}>
                          <Clock className="h-4 w-4 mr-2" />
                          Marcar como pendiente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(message.id, "in_progress")}>
                          <Star className="h-4 w-4 mr-2" />
                          Marcar en proceso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(message.id, "resolved")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como resuelto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(message.id, "spam")}>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Marcar como spam
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
