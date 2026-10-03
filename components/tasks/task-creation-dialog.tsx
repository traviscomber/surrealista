"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { MapPin, UserPlus, Mic, MicOff } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  title: string
  description: string
  location: string
  priority: string
  status: string
  due_date: string
  created_at: string
  created_by?: string
  assigned_to?: string
  notes?: string
}

interface User {
  id: string
  name: string
  email: string
  whatsapp?: string
  phone?: string
  notification_preferences?: any
}

interface TaskCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
  prefilledLocation?: { lat: number; lng: number; name?: string }
  relatedTo?: string
  relatedId?: string
  currentUser?: any
  task?: Task
}

function getTaskId(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const id = (value as Record<string, unknown>).id
  return typeof id === "string" && id.length > 0 ? id : null
}

export function TaskCreationDialog({
  open,
  onOpenChange,
  onTaskCreated,
  prefilledLocation,
  relatedTo,
  relatedId,
  currentUser,
  task,
}: TaskCreationDialogProps) {
  const isEditMode = !!task

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [location, setLocation] = useState(prefilledLocation ? `${prefilledLocation.lat},${prefilledLocation.lng}` : "")
  const [locationName, setLocationName] = useState(prefilledLocation?.name || "")
  const [loading, setLoading] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [activeSTTField, setActiveSTTField] = useState<"title" | "description" | null>(null)
  const [titleSTTError, setTitleSTTError] = useState<string | null>(null)
  const [descriptionSTTError, setDescriptionSTTError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const titleSTT = useSpeechToText({
    continuous: false,
    lang: "es-CL",
    onResult: (text) => {
      setTitle((prev) => prev + " " + text)
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
      setDescription((prev) => prev + " " + text)
      setDescriptionSTTError(null)
    },
    onError: (error) => {
      console.error("[v0] Description STT error:", error)
      setDescriptionSTTError(error)
    },
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase.from("users").select("id, name, email").order("name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (task && open) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setPriority(task.priority || "medium")
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "")
      setLocation(task.location || "")
      const notesMatch = task.notes?.match(/Ubicación: (.+)/)
      setLocationName(notesMatch ? notesMatch[1] : "")

      loadTaskAssignments(task.id)
    } else if (!open) {
      setTitle("")
      setDescription("")
      setPriority("medium")
      setDueDate("")
      setLocation("")
      setLocationName("")
      setSelectedUsers([])
    }
  }, [task, open])

  const loadTaskAssignments = async (taskId: string) => {
    try {
      const { data, error } = await supabase.from("task_assignments").select("user_id").eq("task_id", taskId)

      if (error) throw error
      setSelectedUsers(data?.map((a) => a.user_id) || [])
    } catch (error) {
      console.error("[v0] Error loading task assignments:", error)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const toggleTitleSTT = () => {
    if (titleSTT.isListening) {
      titleSTT.stopListening()
      setActiveSTTField(null)
      setTitleSTTError(null)
    } else {
      descriptionSTT.stopListening()
      titleSTT.startListening()
      setActiveSTTField("title")
      setTitleSTTError(null)
    }
  }

  const toggleDescriptionSTT = () => {
    if (descriptionSTT.isListening) {
      descriptionSTT.stopListening()
      setActiveSTTField(null)
      setDescriptionSTTError(null)
    } else {
      titleSTT.stopListening()
      descriptionSTT.startListening()
      setActiveSTTField("description")
      setDescriptionSTTError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!title.trim()) throw new Error("El título es requerido")

      const response = await fetch("/api/tasks/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task?.id || null,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          location: location.trim() || null,
          status: task?.status || "pending",
          relatedTo: relatedTo || null,
          relatedId: relatedId || null,
          notes: locationName ? `Ubicación: ${locationName}` : null,
          tags,
          selectedUserIds: selectedUsers,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la tarea")

      const whatsappActions = Array.isArray(data.whatsappActions) ? data.whatsappActions : []
      whatsappActions.forEach((action: { url?: string }, index: number) => {
        if (!action?.url) return
        window.setTimeout(() => window.open(action.url, "_blank"), index * 900)
      })

      setTitle("")
      setDescription("")
      setPriority("medium")
      setDueDate("")
      setLocation("")
      setLocationName("")
      setSelectedUsers([])
      setTags([])
      onOpenChange(false)
      onTaskCreated?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      console.error("[tasks] save failed", error)
      alert(`Error al ${isEditMode ? "actualizar" : "crear"} la tarea: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Tarea" : "Crear Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modifica los detalles de la tarea" : "Crea una tarea y vincúlala a una ubicación en el mapa"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center justify-between">
                <span>Título *</span>
                {!titleSTT.isSupported && (
                  <Badge variant="outline" className="text-xs">
                    STT no disponible en este navegador
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej: Llamar para cotizar campo Cholchol"
                  required
                  className="pr-12"
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

            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center justify-between">
                <span>Descripción</span>
                {descriptionSTT.isListening && (
                  <Badge variant="default" className="text-xs animate-pulse">
                    🎤 Grabando...
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles de la tarea..."
                  rows={3}
                  className="pr-12"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]" position="popper" sideOffset={5}>
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

            <div className="grid gap-2 border-t pt-4">
              <Label className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Asignar a Usuarios
              </Label>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios disponibles. Agrega usuarios en la sección de gestión de contactos.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedUsers.length} usuario(s) seleccionado(s) - Recibirán notificaciones según sus preferencias
                </p>
              )}
            </div>

            <div className="grid gap-2 border-t pt-4">
              <Label htmlFor="tags">Tags / Etiquetas</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Ingresa un tag y presiona Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                    className="px-3 bg-transparent"
                  >
                    +
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-gray-300"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <span className="text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Haz clic en un tag para eliminarlo</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading
                ? isEditMode
                  ? "Actualizando..."
                  : "Creando..."
                : isEditMode
                  ? "Actualizar Tarea"
                  : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
