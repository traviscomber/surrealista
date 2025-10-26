import { createClient } from "@/lib/supabase/client"

export type NotificationType = "critical" | "warning" | "info" | "success"
export type NotificationCategory = "property" | "agent" | "document" | "system" | "task" | "message"

export interface InternalNotification {
  id: number
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
  read_at?: string
  metadata?: Record<string, any>
  whatsapp_sent: boolean
  whatsapp_sent_at?: string
}

export interface CreateNotificationParams {
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

class InternalNotificationService {
  private supabase = createClient()

  async createNotification(params: CreateNotificationParams): Promise<number | null> {
    try {
      const { data, error } = await this.supabase.rpc("create_internal_notification", {
        p_type: params.type,
        p_category: params.category,
        p_title: params.title,
        p_message: params.message,
        p_link: params.link || null,
        p_metadata: params.metadata || {},
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error("[v0] Error creating internal notification:", error)
      return null
    }
  }

  async getNotifications(limit = 50): Promise<InternalNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from("internal_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching internal notifications:", error)
      return []
    }
  }

  async getUnreadNotifications(): Promise<InternalNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from("internal_notifications")
        .select("*")
        .eq("read", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching unread notifications:", error)
      return []
    }
  }

  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc("mark_internal_notification_read", {
        notification_id: notificationId,
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
      return false
    }
  }

  async markWhatsAppSent(notificationId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc("mark_whatsapp_sent", {
        notification_id: notificationId,
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error marking WhatsApp as sent:", error)
      return false
    }
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("internal_notifications").delete().eq("id", notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
      return false
    }
  }

  subscribeToNotifications(callback: (notification: InternalNotification) => void) {
    const channel = this.supabase
      .channel("internal_notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_notifications",
        },
        (payload) => {
          callback(payload.new as InternalNotification)
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }
}

export const internalNotificationService = new InternalNotificationService()
