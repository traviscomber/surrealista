'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, MessageCircle, Phone, FileText, X } from 'lucide-react'

interface QuickContactPanelProps {
  isOpen: boolean
  onClose: () => void
  client: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    mobile?: string
    company_name?: string
  }
}

export function QuickContactPanel({ isOpen, onClose, client }: QuickContactPanelProps) {
  const [emailOpen, setEmailOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [noteContent, setNoteContent] = useState('')

  const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim()
  const clientPhone = client.mobile || client.phone || ''

  // Send email
  const handleEmail = () => {
    if (!client.email) {
      alert('El cliente no tiene email registrado')
      return
    }
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.location.href = mailtoLink
    handleEmailClose()
  }

  // Open WhatsApp Web with predefined message
  const handleWhatsApp = () => {
    if (!clientPhone) {
      alert('El cliente no tiene teléfono registrado')
      return
    }
    const phone = clientPhone.replace(/\D/g, '')
    const message = `Hola ${clientName}, te contacto en relación a una propiedad que podría ser de tu interés. ¿Tienes disponibilidad para conversar?`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
    onClose()
  }

  // Register call interaction
  const handleCall = () => {
    if (!clientPhone) {
      alert('El cliente no tiene teléfono registrado')
      return
    }
    // Open phone dialer
    window.location.href = `tel:${clientPhone}`
    
    // Register call interaction in background
    fetch('/api/crm/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        type: 'call',
        description: `Llamada realizada a ${clientName}`,
        date: new Date().toISOString(),
      }),
    }).catch(err => console.error('[v0] Error registering call:', err))
    
    onClose()
  }

  // Add quick note
  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      alert('La nota no puede estar vacía')
      return
    }

    try {
      const response = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          content: noteContent,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setNoteContent('')
        setNoteOpen(false)
        alert('Nota agregada exitosamente')
      }
    } catch (error) {
      console.error('[v0] Error adding note:', error)
      alert('Error al agregar la nota')
    }
  }

  const handleEmailClose = () => {
    setEmailOpen(false)
    setEmailSubject('')
    setEmailBody('')
  }

  return (
    <>
      {/* Main Contact Panel Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contactar a {clientName}</DialogTitle>
            <DialogDescription>{client.company_name && `${client.company_name}`}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Email Button */}
            <Button
              onClick={() => setEmailOpen(true)}
              variant="outline"
              className="w-full justify-start h-12"
              disabled={!client.email}
            >
              <Mail className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-sm">Enviar Email</div>
                <div className="text-xs text-gray-500">{client.email || 'Sin email'}</div>
              </div>
            </Button>

            {/* WhatsApp Button */}
            <Button
              onClick={handleWhatsApp}
              className="w-full justify-start h-12 bg-green-600 hover:bg-green-700"
              disabled={!clientPhone}
            >
              <MessageCircle className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-sm">WhatsApp Web</div>
                <div className="text-xs text-green-100">{clientPhone || 'Sin teléfono'}</div>
              </div>
            </Button>

            {/* Call Button */}
            <Button
              onClick={handleCall}
              variant="outline"
              className="w-full justify-start h-12"
              disabled={!clientPhone}
            >
              <Phone className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-sm">Llamar</div>
                <div className="text-xs text-gray-500">{clientPhone || 'Sin teléfono'}</div>
              </div>
            </Button>

            {/* Add Note Button */}
            <Button
              onClick={() => setNoteOpen(true)}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <FileText className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-semibold text-sm">Agregar Nota</div>
                <div className="text-xs text-gray-500">Guardar nota rápida</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailOpen} onOpenChange={handleEmailClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Email a {clientName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asunto</label>
              <Input
                placeholder="Asunto del email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEmail} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
              <Button onClick={handleEmailClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Modal */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nota para {clientName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Escribe tu nota aquí..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
              className="resize-none"
            />

            <div className="flex gap-2">
              <Button onClick={handleAddNote} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Guardar Nota
              </Button>
              <Button onClick={() => setNoteOpen(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
