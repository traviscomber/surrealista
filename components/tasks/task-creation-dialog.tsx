"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { MapPin } from "lucide-react"

interface TaskCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
  prefilledLocation?: { lat: number; lng: number; name?: string }
  relatedTo?: string
  relatedId?: string
  currentUser?: any // Added currentUser prop to pass authenticated user
}

export function TaskCreationDialog({
  open,
  onOpenChange,
  onTaskCreated,
  prefilledLocation,
  relatedTo,
  relatedId,
  currentUser, // Destructure currentUser prop
}: TaskCreationDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [location, setLocation] = useState(prefilledLocation ? `${prefilledLocation.lat},${prefilledLocation.lng}` : "")
  const [locationName, setLocationName] = useState(prefilledLocation?.name || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      if (!title.trim()) {
        alert("El título es requerido")
        setLoading(false)
        return
      }

      const createdBy = currentUser?.email || currentUser?.id || "system"

      const taskData = {
        title: title.trim().substring(0, 255),
        description: description.trim() || null,
        priority: priority || "medium",
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        location: location.trim().substring(0, 255) || null, // Limit location to 255 chars
        status: "pending",
        related_to: relatedTo?.substring(0, 255) || null, // Limit to 255 chars
        related_id: relatedId || null,
        notes: locationName ? `Ubicación: ${locationName}`.substring(0, 1000) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: createdBy, // Use actual user email/id instead of null
        assigned_to: null,
        tags: [],
      }

      console.log("[v0] Creating task with data:", taskData)

      const { data, error } = await supabase.from("tasks").insert([taskData]).select()

      if (error) {
        console.error("[v0] Error creating task:", error.message)
        throw error
      }

      console.log("[v0] Task created successfully:", data)

      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setDueDate("")
      setLocation("")
      setLocationName("")

      onOpenChange(false)
      onTaskCreated?.()
    } catch (error: any) {
      console.error("[v0] Exception creating task:", error.message)
      alert(`Error al crear la tarea: ${error.message || "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[9999] bg-background">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
          <DialogDescription>Crea una tarea y vincúlala a una ubicación en el mapa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Llamar para cotizar campo Cholchol"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles de la tarea..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
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

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="locationName">Nombre de ubicación</Label>
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="ej: Campo Cholchol, Lote 45"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">
                <MapPin className="inline w-4 h-4 mr-1" />
                Coordenadas (lat,lng)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="-38.5,-72.3"
              />
              {prefilledLocation && <p className="text-xs text-muted-foreground">Ubicación prellenada desde el mapa</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? "Creando..." : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
