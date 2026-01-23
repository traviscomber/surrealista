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
        location: location.trim().substring(0, 255) || null,
        status: task?.status || "pending",
        related_to: relatedTo?.substring(0, 255) || null,
        related_id: relatedId || null,
        notes: locationName ? `Ubicación: ${locationName}`.substring(0, 1000) : null,
        updated_at: new Date().toISOString(),
        ...(isEditMode ? {} : { created_at: new Date().toISOString(), created_by: createdBy }),
        assigned_to: task?.assigned_to || null,
        tags: tags.length > 0 ? tags : [],
      }

      let taskId: string

      if (isEditMode) {
        console.log("[v0] Updating task:", task.id, taskData)
        const { error } = await supabase.from("tasks").update(taskData).eq("id", task.id)
        if (error) throw error
        taskId = task.id
        console.log("[v0] Task updated successfully")
      } else {
        console.log("[v0] Creating task with data:", taskData)
        const { data, error } = await supabase.from("tasks").insert([taskData]).select()
        if (error) throw error
        taskId = data[0].id
        console.log("[v0] Task created successfully:", data)
      }

      if (selectedUsers.length > 0) {
        // Delete existing assignments if editing
        if (isEditMode) {
          await supabase.from("task_assignments").delete().eq("task_id", taskId)
        }

        // Create new assignments
        const assignments = selectedUsers.map((userId) => ({
          task_id: taskId,
          user_id: userId,
          assigned_by: createdBy,
          assigned_at: new Date().toISOString(),
        }))

        const { error: assignError } = await supabase.from("task_assignments").insert(assignments)
        if (assignError) {
          console.error("[v0] Error creating task assignments:", assignError)
        } else {
          console.log("[v0] Task assignments created successfully")

          // Send WhatsApp notifications automatically
          await sendWhatsAppNotifications(taskId, selectedUsers, taskData)
        }
      }

      setTitle("")
      setDescription("")
      setPriority("medium")
      setDueDate("")
      setLocation("")
      setLocationName("")
      setSelectedUsers([])

      onOpenChange(false)
      onTaskCreated?.()
    } catch (error: any) {
      console.error(`[v0] Exception ${isEditMode ? "updating" : "creating"} task:`, error.message)
      alert(`Error al ${isEditMode ? "actualizar" : "crear"} la tarea: ${error.message || "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsAppNotifications = async (taskId: string, userIds: string[], taskData: any) => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, whatsapp, phone, notification_preferences")
        .in("id", userIds)

      if (usersError) {
        console.error("[v0] Error fetching users:", usersError)
        throw usersError
      }

      console.log("[v0] Fetched users for notifications:", usersData)

      const usersWithWhatsApp = usersData?.filter((user) => {
        const hasWhatsApp = user.whatsapp || user.phone
        const notifyEnabled = !user.notification_preferences || user.notification_preferences?.whatsapp !== false
        console.log(`[v0] User ${user.name}: hasWhatsApp=${!!hasWhatsApp}, notifyEnabled=${notifyEnabled}`)
        return hasWhatsApp && notifyEnabled
      })

      if (!usersWithWhatsApp || usersWithWhatsApp.length === 0) {
        console.log("[v0] No users with WhatsApp enabled for notifications")
        alert("⚠️ Tarea creada, pero ningún usuario tiene WhatsApp configurado para recibir notificaciones.")
        return
      }

      console.log(`[v0] Sending WhatsApp notifications to ${usersWithWhatsApp.length} users`)

      const priorityText =
        {
          urgent: "URGENTE",
          high: "ALTA",
          medium: "MEDIA",
          low: "BAJA",
        }[taskData.priority] || "MEDIA"

      const dueText = taskData.due_date
        ? new Date(taskData.due_date).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Sin fecha límite"

      const locationText = taskData.notes || "Sin ubicación especificada"

      const message =
        `NUEVA TAREA ASIGNADA\n\n` +
        `Titulo: ${taskData.title}\n\n` +
        `Descripcion:\n${taskData.description || "Sin descripción"}\n\n` +
        `Prioridad: ${priorityText}\n` +
        `Fecha limite: ${dueText}\n` +
        `Ubicacion: ${locationText}\n\n` +
        `Enviado desde Sur-Realista`

      console.log("[v0] WhatsApp message:", message)

      // Open WhatsApp Web for each user with a delay
      for (let i = 0; i < usersWithWhatsApp.length; i++) {
        const user = usersWithWhatsApp[i]
        const rawPhone = user.whatsapp || user.phone

        // Clean phone number: remove spaces, dashes, parentheses, plus sign
        let phoneNumber = rawPhone.replace(/[\s\-()]/g, "").replace(/^\+/, "")

        console.log(`[v0] User ${user.name}: raw="${rawPhone}", cleaned="${phoneNumber}"`)

        // Validate Chilean phone format
        if (phoneNumber.startsWith("56")) {
          const afterCountryCode = phoneNumber.substring(2)
          console.log(`[v0] After country code (56): "${afterCountryCode}"`)

          if (afterCountryCode.startsWith("99")) {
            phoneNumber = "56" + afterCountryCode.substring(1)
            console.log(`[v0] Removed duplicate 9: "${phoneNumber}"`)
          }

          if (phoneNumber.length !== 11) {
            console.error(
              `[v0] Invalid Chilean phone length for ${user.name}: ${phoneNumber.length} digits (expected 11)`,
            )
            alert(`⚠️ Número inválido para ${user.name}: ${rawPhone}\nFormato esperado: +56 9 XXXX XXXX`)
            continue
          }

          if (!phoneNumber.startsWith("569")) {
            console.error(`[v0] Invalid Chilean mobile prefix for ${user.name}: ${phoneNumber}`)
            alert(`⚠️ Número inválido para ${user.name}: ${rawPhone}\nLos móviles chilenos deben empezar con +56 9`)
            continue
          }
        } else if (phoneNumber.startsWith("9")) {
          phoneNumber = "56" + phoneNumber
          console.log(`[v0] Added country code: "${phoneNumber}"`)

          if (phoneNumber.length !== 11) {
            console.error(`[v0] Invalid phone length after adding country code: ${phoneNumber.length}`)
            alert(`⚠️ Número inválido para ${user.name}: ${rawPhone}`)
            continue
          }
        } else {
          console.error(`[v0] Invalid phone format for ${user.name}: ${phoneNumber}`)
          alert(`⚠️ Número inválido para ${user.name}: ${rawPhone}\nFormato esperado: +56 9 XXXX XXXX`)
          continue
        }

        console.log(`[v0] Final phone number for ${user.name}: "${phoneNumber}" (${phoneNumber.length} digits)`)
        console.log(
          `[v0] Breakdown: Country=${phoneNumber.substring(0, 2)}, Mobile=${phoneNumber.substring(2, 3)}, Number=${phoneNumber.substring(3)}`,
        )

        const encodedMessage = encodeURIComponent(message)
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`

        console.log(`[v0] WhatsApp URL for ${user.name}: ${whatsappUrl}`)

        setTimeout(() => {
          window.open(whatsappUrl, "_blank")
          console.log(`[v0] Opened WhatsApp for ${user.name}`)
        }, i * 1500)

        await supabase.from("task_notifications").insert({
          task_id: taskId,
          user_id: user.id,
          notification_type: "whatsapp",
          status: "sent",
          sent_at: new Date().toISOString(),
          message: message,
        })
      }

      alert(`✅ Tarea creada! Se abrirán ${usersWithWhatsApp.length} ventanas de WhatsApp para enviar notificaciones.`)
    } catch (error) {
      console.error("[v0] Error sending WhatsApp notifications:", error)
      alert("⚠️ Tarea creada, pero hubo un error al enviar las notificaciones de WhatsApp.")
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
