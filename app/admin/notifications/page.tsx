"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationList } from "@/components/notifications/notification-list"
import { AppHeader } from "@/components/layout/app-header"
import { useNotificationSettings } from "@/lib/hooks/use-notifications"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, Smartphone } from "lucide-react"

export default function NotificationsPage() {
  const { settings, updateSettings, loading } = useNotificationSettings()

  const handleToggleEmail = async (enabled: boolean) => {
    await updateSettings({ email_enabled: enabled })
  }

  const handleTogglePush = async (enabled: boolean) => {
    await updateSettings({ push_enabled: enabled })
  }

  const handleToggleCategory = async (category: string, enabled: boolean) => {
    if (!settings) return
    await updateSettings({
      categories: {
        ...settings.categories,
        [category]: enabled,
      },
    })
  }

  return (
    <>
      <AppHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">Gestiona tus notificaciones y preferencias</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Notificaciones</CardTitle>
                <CardDescription>Revisa y gestiona tus notificaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationList />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Personaliza cómo recibes notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Cargando configuración...</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={settings?.email_enabled ?? true}
                          onCheckedChange={handleToggleEmail}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="push-notifications">Notificaciones Push</Label>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={settings?.push_enabled ?? true}
                          onCheckedChange={handleTogglePush}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Categorías</h4>
                      <div className="space-y-3">
                        {settings &&
                          Object.entries(settings.categories).map(([category, enabled]) => (
                            <div key={category} className="flex items-center justify-between">
                              <Label htmlFor={`category-${category}`} className="capitalize">
                                {category.replace("_", " ")}
                              </Label>
                              <Switch
                                id={`category-${category}`}
                                checked={enabled as boolean}
                                onCheckedChange={(checked) => handleToggleCategory(category, checked)}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Tipos de Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Propiedades:</span> Nuevas propiedades, actualizaciones
                </div>
                <div>
                  <span className="font-medium">Agentes:</span> Asignaciones, actividades
                </div>
                <div>
                  <span className="font-medium">Documentos:</span> Subidas, aprobaciones
                </div>
                <div>
                  <span className="font-medium">Sistema:</span> Actualizaciones importantes
                </div>
                <div>
                  <span className="font-medium">Tareas:</span> Recordatorios, vencimientos
                </div>
                <div>
                  <span className="font-medium">Mensajes:</span> Nuevos mensajes, respuestas
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
