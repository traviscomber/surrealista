"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import { Mail, Phone, MapPin, Home } from "lucide-react"
import Link from "next/link"

type MessageDetailProps = {
  messageId: string
}

type Message = {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  property_id?: string
  property_title?: string
  created_at: string
  read: boolean
  read_at?: string
  status: "pending" | "in_progress" | "resolved" | "spam"
  priority: "low" | "medium" | "high"
  location?: string
}

export function MessageDetail({ messageId }: MessageDetailProps) {
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMessage()
  }, [messageId])

  async function fetchMessage() {
    setLoading(true)
    const { data, error } = await supabase.from("messages").select("*").eq("id", messageId).single()

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el mensaje",
        variant: "destructive",
      })
    } else {
      setMessage(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="h-6 bg-muted animate-pulse rounded"></CardTitle>
          <CardDescription className="h-4 bg-muted animate-pulse rounded w-1/2"></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>{message.subject || "Sin asunto"}</CardTitle>
            <CardDescription>
              De {message.name} • {format(new Date(message.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}
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

          {message.property_id && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <Link href={`/admin/propiedades/editar/${message.property_id}`} className="text-blue-600 hover:underline">
                {message.property_title || "Ver propiedad"}
              </Link>
            </div>
          )}

          {message.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{message.location}</span>
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
