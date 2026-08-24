import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MessageDetail } from "@/components/admin/messages/message-detail"
import { MessageDetailSkeleton } from "@/components/admin/messages/message-detail-skeleton"
import { MessageReplyForm } from "@/components/admin/messages/message-reply-form"
import { MessageHistory } from "@/components/admin/messages/message-history"
import { MessageActions } from "@/components/admin/messages/message-actions"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Detalle de Mensaje | Sur-Realista Admin",
  description: "Ver y responder a mensajes de usuarios",
}

type MessageStatus = "pending" | "in_progress" | "resolved" | "spam"

function normalizeMessageStatus(value: unknown): MessageStatus {
  return value === "in_progress" || value === "resolved" || value === "spam" ? value : "pending"
}

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.from("messages").select("id, email, status").eq("id", id).single()

  if (error || !data || typeof data !== "object") {
    notFound()
  }

  const message = data as Record<string, unknown>
  const email = typeof message.email === "string" ? message.email : null
  if (!email) {
    notFound()
  }

  const status = normalizeMessageStatus(message.status)

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalle del Mensaje</h1>
          <p className="text-muted-foreground">Ver y responder a la consulta del usuario</p>
        </div>

        <MessageActions messageId={id} status={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Suspense fallback={<MessageDetailSkeleton />}>
            <MessageDetail messageId={id} />
          </Suspense>

          <MessageReplyForm messageId={id} recipientEmail={email} />
        </div>

        <div className="space-y-8">
          <MessageHistory messageId={id} />
        </div>
      </div>
    </div>
  )
}
