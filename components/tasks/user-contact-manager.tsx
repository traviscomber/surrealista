"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createBrowserClient } from "@/lib/supabase/client"
import { Phone, Mail, MessageCircle, Bell, Save, UserPlus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  notification_preferences?: {
    email: boolean
    whatsapp: boolean
    sms: boolean
  }
}

export function UserContactManager() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("name")

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setIsNewUser(false)
    setName(user.name || "")
    setEmail(user.email || "")
    setPhone(user.phone || "")
    setWhatsapp(user.whatsapp || "")
    setEmailNotif(user.notification_preferences?.email ?? true)
    setWhatsappNotif(user.notification_preferences?.whatsapp ?? false)
    setSmsNotif(user.notification_preferences?.sms ?? false)
    setIsDialogOpen(true)
  }

  const openNewUserDialog = () => {
    setSelectedUser(null)
    setIsNewUser(true)
    setName("")
    setEmail("")
    setPhone("")
    setWhatsapp("")
    setEmailNotif(true)
    setWhatsappNotif(false)
    setSmsNotif(false)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const userData = {
        name,
        email,
        phone: phone || null,
        whatsapp: whatsapp || null,
        notification_preferences: {
          email: emailNotif,
          whatsapp: whatsappNotif,
          sms: smsNotif,
        },
        updated_at: new Date().toISOString(),
      }

      if (isNewUser) {
        const { error } = await supabase.from("users").insert([{ ...userData, created_at: new Date().toISOString() }])
        if (error) throw error
      } else if (selectedUser) {
        const { error } = await supabase.from("users").update(userData).eq("id", selectedUser.id)
        if (error) throw error
      }

      await loadUsers()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("[v0] Error saving user:", error)
      alert(`Error al guardar usuario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setLoading(true)
    try {
      const { error } = await supabase.from("users").delete().eq("id", userToDelete.id)

      if (error) throw error

      await loadUsers()
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error("[v0] Error deleting user:", error)
      alert(`Error al eliminar usuario: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (user: User, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening edit dialog
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [emailNotif, setEmailNotif] = useState(true)
  const [whatsappNotif, setWhatsappNotif] = useState(false)
  const [smsNotif, setSmsNotif] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Gestión de Contactos y Alertas
              </CardTitle>
              <CardDescription>Administra usuarios y sus preferencias de notificación</CardDescription>
            </div>
            <Button onClick={openNewUserDialog}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios registrados. Agrega el primer usuario.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => openEditDialog(user)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      )}
                      {user.whatsapp && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {user.whatsapp}
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.notification_preferences?.email && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Email</span>
                    )}
                    {user.notification_preferences?.whatsapp && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">WhatsApp</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => openDeleteDialog(user, e)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isNewUser ? "Nuevo Usuario" : "Editar Usuario"}</DialogTitle>
            <DialogDescription>
              {isNewUser ? "Agrega un nuevo usuario al sistema" : "Actualiza la información de contacto y preferencias"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
              <p className="text-xs text-muted-foreground">
                Número de WhatsApp para notificaciones (incluye código de país)
              </p>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base mb-3 block">Preferencias de Notificación</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email-notif" className="font-normal">
                      Notificaciones por Email
                    </Label>
                  </div>
                  <Switch id="email-notif" checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="whatsapp-notif" className="font-normal">
                      Notificaciones por WhatsApp
                    </Label>
                  </div>
                  <Switch id="whatsapp-notif" checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="sms-notif" className="font-normal">
                      Notificaciones por SMS
                    </Label>
                  </div>
                  <Switch id="sms-notif" checked={smsNotif} onCheckedChange={setSmsNotif} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !name || !email}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.name}</strong>? Esta acción no se puede
              deshacer. Se eliminarán todas las asignaciones de tareas y notificaciones asociadas a este usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
