"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Save, Loader2 } from "lucide-react"

type MessageReplyFormProps = {
  messageId: string
  recipientEmail: string
}

export function MessageReplyForm({ messageId, recipientEmail }: MessageReplyFormProps) {
  const [subject, setSubject] = useState("Re: Consulta")
  const [message, setMessage] = useState("")
  const [markAsResolved, setMarkAsResolved] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    const numericMessageId = Number(messageId)
    if (!Number.isInteger(numericMessageId)) {
      toast({
        title: "Error",
        description: "El identificador del mensaje no es válido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error: replyError } = await supabase.from("message_replies").insert({
        message_id: messageId,
        subject,
        content: message,
        sent_to: recipientEmail,
        sent_by: "equipo-interno",
      })

      if (replyError) throw replyError

      if (markAsResolved) {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ status: "resolved" })
          .eq("id", numericMessageId)

        if (updateError) throw updateError
      }

      toast({
        title: "Respuesta registrada",
        description: "La respuesta quedó registrada internamente. Este formulario no envía correo electrónico.",
      })

      setMessage("")
    } catch (error) {
      console.error("Error al registrar la respuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la respuesta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar respuesta</CardTitle>
        <CardDescription>
          Guarda una respuesta interna asociada a {recipientEmail}. El envío de correo se realiza por el flujo SMTP separado.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe la respuesta que quieres dejar registrada..."
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="markAsResolved"
              checked={markAsResolved}
              onCheckedChange={(checked) => setMarkAsResolved(checked === true)}
            />
            <Label htmlFor="markAsResolved" className="text-sm font-normal">
              Marcar mensaje como resuelto al registrar
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setMessage("")} disabled={loading || !message.trim()}>
            Descartar
          </Button>
          <Button type="submit" disabled={loading || !message.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Registrar respuesta
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
