import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MessageDetail } from "@/components/admin/messages/message-detail"
import { MessageDetailSkeleton } from "@/components/admin/messages/message-detail-skeleton"
import { MessageReplyForm } from "@/components/admin/messages/message-reply-form"
import { MessageHistory } from "@/components/admin/messages/message-history"
import { MessageActions } from "@/components/admin/messages/message-actions"
import { createServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Detalle de Mensaje | Sur-Realista Admin",
  description: "Ver y responder a mensajes de usuarios",
}

export default async function MessageDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Verificar si el mensaje existe
  const { data: message, error } = await supabase.from("messages").select("*").eq("id", params.id).single()

  if (error || !message) {
    notFound()
  }

  // Marcar como leído si no lo está
  if (!message.read) {
    await supabase.from("messages").update({ read: true, read_at: new Date().toISOString() }).eq("id", params.id)
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalle del Mensaje</h1>
          <p className="text-muted-foreground">Ver y responder a la consulta del usuario</p>
        </div>

        <MessageActions messageId={params.id} status={message.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Suspense fallback={<MessageDetailSkeleton />}>
            <MessageDetail messageId={params.id} />
          </Suspense>

          <MessageReplyForm messageId={params.id} recipientEmail={message.email} />
        </div>

        <div className="space-y-8">
          <MessageHistory messageId={params.id} />
        </div>
      </div>
    </div>
  )
}
