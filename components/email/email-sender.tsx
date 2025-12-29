"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, AlertCircle, CheckCircle } from "lucide-react"

interface EmailSenderProps {
  clientId?: string
  recipientEmail?: string
}

export function EmailSender({ clientId, recipientEmail }: EmailSenderProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [to, setTo] = useState(recipientEmail || "")
  const [selectedClients, setSelectedClients] = useState<string[]>(clientId ? [clientId] : [])
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  const sendEmail = async () => {
    if (!to || !subject || !body) {
      setMessage({ type: "error", text: "Por favor completa todos los campos" })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          clientId: selectedClients[0] || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Email enviado exitosamente" })
        setSubject("")
        setBody("")
        setTo("")
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar email" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al enviar email" })
    } finally {
      setIsSending(false)
    }
  }

  const sendBulk = async () => {
    if (selectedClients.length === 0 || !subject || !body) {
      setMessage({ type: "error", text: "Selecciona al menos un cliente y completa el contenido" })
      return
    }

    setIsSending(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const clientId of selectedClients) {
        const client = clients.find((c) => c.id === clientId)
        if (client?.email) {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: client.email,
              subject,
              body,
              clientId,
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `${successCount} emails enviados, ${failCount} fallos`,
      })

      if (successCount > 0) {
        setSubject("")
        setBody("")
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Enviar Email</h2>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Para:</label>
        <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="correo@ejemplo.com" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Asunto:</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del email" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mensaje:</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Contenido del email" rows={6} />
      </div>

      <div className="flex gap-2">
        <Button onClick={sendEmail} disabled={isSending} className="flex-1">
          <Send className="w-4 h-4 mr-2" />
          {isSending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </Card>
  )
}
