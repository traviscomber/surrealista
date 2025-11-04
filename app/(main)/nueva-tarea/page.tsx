"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mic, MicOff, CheckCircle2, AlertCircle } from "lucide-react"
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NuevaTareaPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)
  const [showAssignUsers, setShowAssignUsers] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isHttps, setIsHttps] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:" || window.location.hostname === "localhost")
    }
    checkMicrophonePermission()
  }, [])

  const titleSTT = useSpeechToText({
    onResult: (text) => setTitle((prev) => prev + " " + text),
    onError: (error) => console.error("[v0] Title STT error:", error),
    continuous: false,
  })

  const descriptionSTT = useSpeechToText({
    onResult: (text) => setDescription((prev) => prev + " " + text),
    onError: (error) => console.error("[v0] Description STT error:", error),
    continuous: true,
  })

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName })
      setMicPermission(result.state)

      result.addEventListener("change", () => {
        setMicPermission(result.state)
      })
    } catch (error) {
      console.error("[v0] Error checking microphone permission:", error)
    }
  }

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission("granted")
      return true
    } catch (error) {
      console.error("[v0] Microphone access denied:", error)
      setMicPermission("denied")
      return false
    }
  }

  const handleStartRecording = async (type: "title" | "description") => {
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      alert("La grabación de voz requiere una conexión HTTPS segura. Por favor, accede desde un dominio con HTTPS.")
      return
    }

    if (type === "title") {
      titleSTT.startListening()
    } else {
      descriptionSTT.startListening()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    console.log("[v0] Creating task with title:", title.trim())
    console.log("[v0] Creating task with description:", description.trim())

    try {
      const supabase = createClient()

      let createdBy = "system"
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (user) {
          createdBy = user.email || user.id || "system"
          console.log("[v0] Creating task as user:", createdBy)
        } else {
          console.log("[v0] No user logged in, creating task as system")
        }
      } catch (authError) {
        console.log("[v0] Auth check failed, using system as creator:", authError)
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: title.trim(),
          description: description.trim(),
          status: "pending",
          created_by: createdBy,
        })
        .select()

      console.log("[v0] Supabase response - data:", data)
      console.log("[v0] Supabase response - error:", error)

      if (error) {
        console.error("[v0] Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("[v0] Task created successfully:", data)
      setSubmitStatus("success")
      if (data && data[0]) {
        setCreatedTaskId(data[0].id)
      }
      setTitle("")
      setDescription("")

      setTimeout(() => setSubmitStatus(null), 5000)
    } catch (error: any) {
      console.error("[v0] Error creating task:", error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error details:", error?.details)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("users").select("id, name, email").order("name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAssignUsers = async () => {
    if (!createdTaskId || selectedUsers.length === 0) return

    try {
      const supabase = createClient()
      const assignments = selectedUsers.map((userId) => ({
        task_id: createdTaskId,
        user_id: userId,
        assigned_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("task_assignments").insert(assignments)

      if (error) throw error

      alert(`Tarea asignada exitosamente a ${selectedUsers.length} usuario(s)`)
      setShowAssignUsers(false)
      setSelectedUsers([])
      setCreatedTaskId(null)
    } catch (error) {
      console.error("[v0] Error assigning users:", error)
      alert("Error al asignar usuarios a la tarea")
    }
  }

  if (!isMounted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Nueva Tarea</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Nueva Tarea</h1>
        <p className="text-muted-foreground">Crea una nueva tarea usando texto o voz</p>
      </div>

      {!isHttps && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La grabación de voz requiere HTTPS. Si tienes problemas, intenta escribir manualmente o accede desde un
            dispositivo móvil.
          </AlertDescription>
        </Alert>
      )}

      {micPermission === "denied" && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración de tu navegador para
            usar la grabación de voz.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Tarea</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Llamar al cliente sobre propiedad..."
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant={titleSTT.isListening ? "destructive" : "outline"}
                size="icon"
                onClick={() => (titleSTT.isListening ? titleSTT.stopListening() : handleStartRecording("title"))}
                title={titleSTT.isListening ? "Detener grabación" : "Grabar con voz"}
              >
                {titleSTT.isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            {titleSTT.isListening && (
              <p className="text-xs text-blue-600 animate-pulse">🎤 Escuchando... Habla ahora</p>
            )}
            {titleSTT.error && <p className="text-xs text-red-600">{titleSTT.error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <div className="relative">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los detalles de la tarea..."
                rows={4}
                className="resize-none pr-12"
              />
              <Button
                type="button"
                variant={descriptionSTT.isListening ? "destructive" : "outline"}
                size="icon"
                onClick={() =>
                  descriptionSTT.isListening ? descriptionSTT.stopListening() : handleStartRecording("description")
                }
                className="absolute top-2 right-2"
                title={descriptionSTT.isListening ? "Detener grabación" : "Grabar con voz"}
              >
                {descriptionSTT.isListening ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            {descriptionSTT.isListening && (
              <p className="text-xs text-blue-600 animate-pulse">🎤 Escuchando... Habla ahora (modo continuo)</p>
            )}
            {descriptionSTT.error && <p className="text-xs text-red-600">{descriptionSTT.error}</p>}
          </div>

          {submitStatus === "success" && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Tarea creada exitosamente</span>
                {createdTaskId && !showAssignUsers && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAssignUsers(true)
                      loadUsers()
                    }}
                  >
                    Asignar Usuarios
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error al crear la tarea. Por favor, intenta nuevamente.</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Creando..." : "Crear Tarea"}
          </Button>
        </form>
      </Card>

      {showAssignUsers && createdTaskId && (
        <Card className="p-4 border-blue-200 bg-blue-50 mt-6">
          <h3 className="font-semibold mb-3">Asignar Usuarios a la Tarea</h3>
          {loadingUsers ? (
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios disponibles</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => {
                      setSelectedUsers((prev) =>
                        prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id],
                      )
                    }}
                    className="rounded"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer">
                    {user.name} ({user.email})
                  </label>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAssignUsers}
              disabled={selectedUsers.length === 0}
              className="flex-1"
            >
              Asignar ({selectedUsers.length})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAssignUsers(false)
                setSelectedUsers([])
                setCreatedTaskId(null)
              }}
            >
              Omitir
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-900">Cómo usar la grabación de voz:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Haz clic en el ícono del micrófono</li>
          <li>2. Permite el acceso al micrófono si se solicita</li>
          <li>3. Habla claramente cerca del micrófono</li>
          <li>4. El texto aparecerá automáticamente</li>
          <li>5. Haz clic nuevamente para detener</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          <strong>Nota:</strong> La grabación de voz funciona mejor en dispositivos móviles y en conexiones HTTPS
          seguras.
        </p>
      </Card>
    </div>
  )
}
