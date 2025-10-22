"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { Bell, CheckCircle, XCircle, Clock, RefreshCw, MessageCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Notification {
  id: string
  task_id: string
  user_id: string
  notification_type: string
  notification_event: string
  message: string
  delivery_status: string
  sent_at: string | null
  error_message: string | null
  metadata: any
  user_name: string
  user_email: string
  user_whatsapp: string
  task_title: string
}

export default function TestNotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("task_notifications")
        .select(`
          *,
          users!task_notifications_user_id_fkey (
            name,
            email,
            whatsapp
          ),
          tasks!task_notifications_task_id_fkey (
            title
          )
        `)
        .order("sent_at", { ascending: false })
        .limit(50)

      if (error) throw error

      const formatted =
        data?.map((n: any) => ({
          id: n.id,
          task_id: n.task_id,
          user_id: n.user_id,
          notification_type: n.notification_type,
          notification_event: n.notification_event,
          message: n.message,
          delivery_status: n.delivery_status,
          sent_at: n.sent_at,
          error_message: n.error_message,
          metadata: n.metadata,
          user_name: n.users?.name || "Usuario desconocido",
          user_email: n.users?.email || "",
          user_whatsapp: n.users?.whatsapp || "",
          task_title: n.tasks?.title || "Tarea sin título",
        })) || []

      setNotifications(formatted)
    } catch (error: any) {
      console.error("Error loading notifications:", error)
      setTestResult({ success: false, message: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsAppNotification = async (notification: Notification) => {
    if (!notification.user_whatsapp) {
      setTestResult({
        success: false,
        message: "❌ El usuario no tiene número de WhatsApp configurado",
      })
      return
    }

    setSending(notification.id)
    setTestResult(null)

    try {
      // Format WhatsApp number (remove spaces, dashes, and ensure it starts with country code)
      const phoneNumber = notification.user_whatsapp.replace(/[\s-]/g, "")

      // Format message for WhatsApp
      const whatsappMessage = encodeURIComponent(
        `🔔 *Nueva Tarea Asignada*\n\n` +
          `📋 *Tarea:* ${notification.task_title}\n\n` +
          `${notification.message}\n\n` +
          `_Enviado desde Sur-Realista_`,
      )

      // Generate WhatsApp Web URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`

      console.log("[v0] Opening WhatsApp Web:", {
        to: phoneNumber,
        url: whatsappUrl,
        user: notification.user_name,
      })

      // Open WhatsApp Web in new tab
      window.open(whatsappUrl, "_blank")

      // Update notification status to sent
      const { error } = await supabase
        .from("task_notifications")
        .update({
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            ...notification.metadata,
            sent_via: "whatsapp_web",
            sent_to: phoneNumber,
            whatsapp_url: whatsappUrl,
          },
        })
        .eq("id", notification.id)

      if (error) throw error

      setTestResult({
        success: true,
        message: `✅ WhatsApp Web abierto para ${notification.user_name}. Revisa la pestaña y presiona Enviar.`,
      })

      // Reload notifications
      await loadNotifications()
    } catch (error: any) {
      console.error("Error opening WhatsApp:", error)
      setTestResult({ success: false, message: `Error: ${error.message}` })

      // Update notification with error
      await supabase
        .from("task_notifications")
        .update({
          delivery_status: "failed",
          error_message: error.message,
        })
        .eq("id", notification.id)
    } finally {
      setSending(null)
    }
  }

  const sendAllPending = async () => {
    const pending = notifications.filter((n) => n.delivery_status === "pending" && n.user_whatsapp)

    if (pending.length === 0) {
      setTestResult({
        success: false,
        message: "No hay notificaciones pendientes con WhatsApp configurado",
      })
      return
    }

    setTestResult({
      success: true,
      message: `Abriendo ${pending.length} conversaciones de WhatsApp...`,
    })

    // Open each WhatsApp conversation with a small delay
    for (let i = 0; i < pending.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay between opens
      await sendWhatsAppNotification(pending[i])
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      sent: "default",
      failed: "destructive",
      pending: "secondary",
    }
    return (
      <Badge variant={variants[status] || "outline"}>
        {status === "sent" ? "Enviado" : status === "failed" ? "Fallido" : "Pendiente"}
      </Badge>
    )
  }

  const pendingCount = notifications.filter((n) => n.delivery_status === "pending").length
  const sentCount = notifications.filter((n) => n.delivery_status === "sent").length
  const failedCount = notifications.filter((n) => n.delivery_status === "failed").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones WhatsApp</h1>
          <p className="text-muted-foreground mt-2">Envía notificaciones de tareas por WhatsApp Web</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button onClick={sendAllPending} disabled={loading}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar Todas ({pendingCount})
            </Button>
          )}
          <Button onClick={loadNotifications} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Notificaciones por enviar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <p className="text-xs text-muted-foreground">Notificaciones exitosas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Errores de envío</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Notificaciones</CardTitle>
          <CardDescription>
            Haz clic en "Enviar por WhatsApp" para abrir WhatsApp Web con el mensaje pre-escrito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay notificaciones. Crea una tarea y asígnala a un usuario para generar notificaciones.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-1">{getStatusIcon(notification.delivery_status)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{notification.task_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Para: {notification.user_name} ({notification.user_whatsapp || "Sin WhatsApp"})
                        </p>
                      </div>
                      {getStatusBadge(notification.delivery_status)}
                    </div>

                    <p className="text-sm bg-muted p-3 rounded">{notification.message}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Tipo: {notification.notification_type}</span>
                      <span>Evento: {notification.notification_event}</span>
                      {notification.sent_at && <span>Enviado: {new Date(notification.sent_at).toLocaleString()}</span>}
                    </div>

                    {notification.error_message && (
                      <p className="text-sm text-red-600">Error: {notification.error_message}</p>
                    )}
                  </div>

                  {notification.delivery_status === "pending" && notification.user_whatsapp && (
                    <Button
                      size="sm"
                      onClick={() => sendWhatsAppNotification(notification)}
                      disabled={sending === notification.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {sending === notification.id ? "Abriendo..." : "Enviar por WhatsApp"}
                    </Button>
                  )}

                  {notification.delivery_status === "pending" && !notification.user_whatsapp && (
                    <Badge variant="outline" className="text-yellow-600">
                      Sin WhatsApp
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Web - Modo Simple
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-800 dark:text-green-200 space-y-2">
          <p>
            <strong>✅ Sin APIs ni costos:</strong> Este sistema usa WhatsApp Web directamente, sin necesidad de APIs de
            pago.
          </p>
          <p>
            <strong>📱 Cómo funciona:</strong> Al hacer clic en "Enviar por WhatsApp", se abre una nueva pestaña de
            WhatsApp Web con el mensaje pre-escrito. Solo debes revisar y presionar Enviar.
          </p>
          <p>
            <strong>🔔 Automático:</strong> Cuando creas una tarea y la asignas a un usuario con WhatsApp configurado,
            el sistema automáticamente crea la notificación lista para enviar.
          </p>
          <p>
            <strong>💡 Tip:</strong> Asegúrate de que los números de WhatsApp incluyan el código de país (ej:
            +56912345678 para Chile).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
