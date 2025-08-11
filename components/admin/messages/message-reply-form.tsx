"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import { Send, Loader2 } from "lucide-react"

type MessageReplyFormProps = {
  messageId: string
  recipientEmail: string
}

export function MessageReplyForm({ messageId, recipientEmail }: MessageReplyFormProps) {
  const [subject, setSubject] = useState("Re: Consulta sobre propiedad")
  const [message, setMessage] = useState("")
  const [markAsResolved, setMarkAsResolved] = useState(true)
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

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

    setLoading(true)

    try {
      // Aquí iría la lógica para enviar el email
      // Por ahora, solo registramos la respuesta en la base de datos

      // Registrar la respuesta
      const { error: replyError } = await supabase.from("message_replies").insert({
        message_id: messageId,
        subject,
        content: message,
        sent_to: recipientEmail,
        sent_by: "admin", // Idealmente, aquí iría el ID o email del admin actual
      })

      if (replyError) throw replyError

      // Si se marca como resuelto, actualizar el estado del mensaje
      if (markAsResolved) {
        const { error: updateError } = await supabase
          .from("messages")
          .update({ status: "resolved" })
          .eq("id", messageId)

        if (updateError) throw updateError
      }

      toast({
        title: "Respuesta enviada",
        description: "La respuesta ha sido enviada correctamente",
      })

      // Limpiar el formulario
      setMessage("")
    } catch (error) {
      console.error("Error al enviar la respuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Responder</CardTitle>
        <CardDescription>Envía una respuesta a {recipientEmail}</CardDescription>
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
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="markAsResolved"
              checked={markAsResolved}
              onCheckedChange={(checked) => setMarkAsResolved(checked as boolean)}
            />
            <Label htmlFor="markAsResolved" className="text-sm font-normal">
              Marcar mensaje como resuelto al enviar
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
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar respuesta
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
