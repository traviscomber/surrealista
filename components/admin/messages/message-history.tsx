"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { MessageSquare, User, ArrowUpRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type MessageHistoryProps = {
  messageId: string
}

type Reply = {
  id: string
  message_id: string
  subject: string
  content: string
  sent_to: string
  sent_by: string
  created_at: string | null
}

function normalizeReply(value: unknown): Reply | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>

  if (
    typeof row.id !== "string" ||
    typeof row.message_id !== "string" ||
    typeof row.subject !== "string" ||
    typeof row.content !== "string" ||
    typeof row.sent_to !== "string" ||
    typeof row.sent_by !== "string"
  ) {
    return null
  }

  return {
    id: row.id,
    message_id: row.message_id,
    subject: row.subject,
    content: row.content,
    sent_to: row.sent_to,
    sent_by: row.sent_by,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  }
}

export function MessageHistory({ messageId }: MessageHistoryProps) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchReplies()
  }, [messageId])

  async function fetchReplies() {
    setLoading(true)
    const { data, error } = await supabase
      .from("message_replies")
      .select("id, message_id, subject, content, sent_to, sent_by, created_at")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true })

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas",
        variant: "destructive",
      })
    } else {
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeReply)
        .filter((reply): reply is Reply => reply !== null)
      setReplies(normalized)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de respuestas</CardTitle>
        <CardDescription>
          {replies.length === 0
            ? "Aún no hay respuestas a este mensaje"
            : `${replies.length} respuesta${replies.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-2">No hay respuestas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {replies.map((reply, index) => (
              <div key={reply.id} className="space-y-2">
                {index > 0 && <Separator className="my-4" />}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{reply.sent_by}</p>
                      <p className="text-xs text-muted-foreground">
                        {reply.created_at
                          ? format(new Date(reply.created_at), "dd MMM yyyy, HH:mm", { locale: es })
                          : "Sin fecha"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Enviado a {reply.sent_to}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{reply.subject}</p>
                  <p className="text-sm mt-2 whitespace-pre-line">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
