"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Send, AlertCircle, CheckCircle, Copy } from "lucide-react"

interface ClientEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientEmail: string
  clientId: string
}

const EMAIL_TEMPLATES = [
  {
    id: "greeting",
    name: "Saludo inicial",
    subject: "Seguimiento de consulta",
    body: "Estimado/a {clientName},\n\nEspero se encuentre bien. Me dirijo a usted para hacer seguimiento de su consulta anterior.\n\nQuedamos atento a cualquier pregunta que pueda tener.\n\nSaludos cordiales,\nSur-Realista",
  },
  {
    id: "property_info",
    name: "Información de propiedad",
    subject: "Detalles de la propiedad",
    body: "Estimado/a {clientName},\n\nLe adjuntamos los detalles completos de la propiedad que le interesó:\n\n[Inserte información de la propiedad aquí]\n\nNo dude en contactarnos si desea agendar una visita.\n\nSaludos cordiales,\nSur-Realista",
  },
  {
    id: "quotation",
    name: "Cotización",
    subject: "Cotización de propiedad",
    body: "Estimado/a {clientName},\n\nComo se conversó, le envío la cotización solicitada:\n\n[Inserte cotización aquí]\n\nQuedamos atentos a sus comentarios.\n\nSaludos cordiales,\nSur-Realista",
  },
  {
    id: "appointment",
    name: "Cita/Visita",
    subject: "Confirmación de cita",
    body: "Estimado/a {clientName},\n\nLe confirmo la cita agendada para:\n\nFecha: [Fecha]\nHora: [Hora]\nUbicación: [Ubicación]\n\nQuedamos atentos. En caso de no poder asistir, por favor avísenos con anticipación.\n\nSaludos cordiales,\nSur-Realista",
  },
  {
    id: "followup",
    name: "Seguimiento",
    subject: "Seguimiento post-consulta",
    body: "Estimado/a {clientName},\n\nLe escribo para hacer un seguimiento respecto a nuestra última conversación y preguntarle si tiene alguna pregunta adicional o si requiere más información.\n\nQuedamos a su disposición.\n\nSaludos cordiales,\nSur-Realista",
  },
]

export function ClientEmailDialog({ open, onOpenChange, clientName, clientEmail, clientId }: ClientEmailDialogProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setBody(template.body.replace("{clientName}", clientName))
    }
  }

  const handleCopyEmail = async () => {
    const emailContent = `Para: ${clientEmail}\nAsunto: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(emailContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Error al copiar" })
    }
  }

  const handleSendEmail = async () => {
    if (!subject || !body) {
      setMessage({ type: "error", text: "Por favor completa asunto y mensaje" })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: clientEmail,
          subject,
          body,
          clientId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Email enviado exitosamente" })
        setTimeout(() => {
          setSubject("")
          setBody("")
          setMessage(null)
          onOpenChange(false)
        }, 2000)
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar email" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al enviar email" })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enviar Email a {clientName}
          </DialogTitle>
          <DialogDescription>{clientEmail}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Usar plantilla:</label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Asunto:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email"
              disabled={isSending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensaje:</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={8}
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCopyEmail} disabled={isSending || !subject || !body}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copiado!" : "Copiar"}
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !subject || !body}>
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "Enviando..." : "Enviar Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
