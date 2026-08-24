"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Mail, Phone } from "lucide-react"

type MessageDetailProps = {
  messageId: string
}

type MessageStatus = "pending" | "in_progress" | "resolved" | "spam"
type MessagePriority = "low" | "medium" | "high"

type Message = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  created_at: string | null
  status: MessageStatus
  priority: MessagePriority
}

function normalizeStatus(value: unknown): MessageStatus {
  return value === "in_progress" || value === "resolved" || value === "spam" ? value : "pending"
}

function normalizePriority(value: unknown): MessagePriority {
  return value === "low" || value === "high" ? value : "medium"
}

function normalizeMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>

  if (
    typeof row.id !== "number" ||
    typeof row.name !== "string" ||
    typeof row.email !== "string" ||
    typeof row.subject !== "string" ||
    typeof row.message !== "string"
  ) {
    return null
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: typeof row.phone === "string" ? row.phone : null,
    subject: row.subject,
    message: row.message,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
  }
}

export function MessageDetail({ messageId }: MessageDetailProps) {
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchMessage()
  }, [messageId])

  async function fetchMessage() {
    setLoading(true)
    const numericMessageId = Number(messageId)
    if (!Number.isInteger(numericMessageId)) {
      setMessage(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, name, email, phone, subject, message, created_at, status, priority")
      .eq("id", numericMessageId)
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el mensaje",
        variant: "destructive",
      })
      setMessage(null)
    } else {
      setMessage(normalizeMessage(data))
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="h-6 bg-muted animate-pulse rounded" />
          <CardDescription className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mensaje no encontrado</CardTitle>
          <CardDescription>No se pudo encontrar el mensaje solicitado</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Proceso</Badge>
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resuelto</Badge>
      case "spam":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Spam</Badge>
    }
  }

  const getPriorityBadge = (priority: MessagePriority) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Baja</Badge>
      case "medium":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Media</Badge>
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Alta</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>{message.subject || "Sin asunto"}</CardTitle>
            <CardDescription>
              De {message.name}
              {message.created_at ? ` • ${format(new Date(message.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}` : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(message.status)}
            {getPriorityBadge(message.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
              {message.email}
            </a>
          </div>

          {message.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${message.phone}`} className="text-blue-600 hover:underline">
                {message.phone}
              </a>
            </div>
          )}
        </div>

        <Separator />

        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-line">{message.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
