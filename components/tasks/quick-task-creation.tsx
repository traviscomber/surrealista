"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Mic, MicOff, Zap, MoreHorizontal } from 'lucide-react'
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text"
import { Badge } from "@/components/ui/badge"

interface QuickTaskCreationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: () => void
  onOpenCompleteDialog: () => void
}

export function QuickTaskCreation({
  open,
  onOpenChange,
  onTaskCreated,
  onOpenCompleteDialog,
}: QuickTaskCreationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
  })

  const [titleSTTError, setTitleSTTError] = useState<string | null>(null)
  const [descriptionSTTError, setDescriptionSTTError] = useState<string | null>(null)

  const titleSTT = useSpeechToText({
    continuous: false,
    lang: "es-CL",
    onResult: (text) => {
      setFormData((prev) => ({ ...prev, title: prev.title + " " + text }))
      setTitleSTTError(null)
    },
    onError: (error) => {
      console.error("[v0] Title STT error:", error)
      setTitleSTTError(error)
    },
  })

  const descriptionSTT = useSpeechToText({
    continuous: true,
    lang: "es-CL",
    onResult: (text) => {
      setFormData((prev) => ({ ...prev, description: prev.description + " " + text }))
      setDescriptionSTTError(null)
    },
    onError: (error) => {
      console.error("[v0] Description STT error:", error)
      setDescriptionSTTError(error)
    },
  })

  const toggleTitleSTT = () => {
    if (titleSTT.isListening) {
      titleSTT.stopListening()
      setTitleSTTError(null)
    } else {
      descriptionSTT.stopListening()
      titleSTT.startListening()
      setTitleSTTError(null)
    }
  }

  const toggleDescriptionSTT = () => {
    if (descriptionSTT.isListening) {
      descriptionSTT.stopListening()
      setDescriptionSTTError(null)
    } else {
      titleSTT.stopListening()
      descriptionSTT.startListening()
      setDescriptionSTTError(null)
    }
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Por favor ingresa un título para la tarea")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/tasks/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          priority: formData.priority,
          status: "pending",
          selectedUserIds: [],
          tags: [],
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || "No se pudo crear la tarea")

      toast.success("Tarea rápida creada")
      setFormData({ title: "", description: "", priority: "medium" })
      onTaskCreated()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      console.error("[quick-task] create failed", error)
      toast.error("Error al crear la tarea: " + message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      titleSTT.stopListening()
      descriptionSTT.stopListening()
      setFormData({ title: "", description: "", priority: "medium" })
      setTitleSTTError(null)
      setDescriptionSTTError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sage-dark" />
            Crear Tarea Rápida
          </DialogTitle>
          <DialogDescription>
            Crea una tarea rápida sin asignar usuarios. Usa STT para dictar el contenido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-title" className="flex items-center justify-between">
              <span>Título de la Tarea *</span>
              {!titleSTT.isSupported && (
                <Badge variant="outline" className="text-xs">
                  STT no disponible
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="quick-title"
                placeholder="ej: Visitar Campo Ranco para inspección"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
                className="bg-white pr-12"
              />
              {titleSTT.isSupported && (
                <Button
                  type="button"
                  variant={titleSTT.isListening ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleTitleSTT}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  title={titleSTT.isListening ? "Detener grabación" : "Grabar con voz"}
                >
                  {titleSTT.isListening ? (
                    <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {titleSTT.isListening && !titleSTTError && (
              <p className="text-xs text-blue-600 font-medium animate-pulse">🎤 Escuchando... Habla ahora</p>
            )}
            {titleSTT.isListening && titleSTT.interimTranscript && (
              <p className="text-xs text-green-600 italic">Capturando: "{titleSTT.interimTranscript}"</p>
            )}
            {titleSTTError && <p className="text-xs text-orange-600">{titleSTTError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-description" className="flex items-center justify-between">
              <span>Descripción (opcional)</span>
              {descriptionSTT.isListening && (
                <Badge variant="default" className="text-xs animate-pulse">
                  🎤 Grabando...
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Textarea
                id="quick-description"
                placeholder="Detalles adicionales de la tarea..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
                className="bg-white pr-12"
              />
              {descriptionSTT.isSupported && (
                <Button
                  type="button"
                  variant={descriptionSTT.isListening ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleDescriptionSTT}
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                  title={descriptionSTT.isListening ? "Detener grabación" : "Grabar con voz"}
                >
                  {descriptionSTT.isListening ? (
                    <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {descriptionSTT.isListening && !descriptionSTTError && (
              <p className="text-xs text-blue-600 font-medium animate-pulse">
                🎤 Escuchando... Habla ahora (modo continuo)
              </p>
            )}
            {descriptionSTT.isListening && descriptionSTT.interimTranscript && (
              <p className="text-xs text-green-600 italic">Capturando: "{descriptionSTT.interimTranscript}"</p>
            )}
            {descriptionSTTError && <p className="text-xs text-orange-600">{descriptionSTTError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-priority">Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="quick-priority" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-sage hover:bg-sage-dark">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Crear Tarea Rápida
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onOpenCompleteDialog}
              disabled={isSubmitting}
              className="w-full bg-transparent"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Agregar Más Información
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
