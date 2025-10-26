import { createClient } from "@/lib/supabase/client"

export type NotificationType = "critical" | "warning" | "info" | "success"
export type NotificationCategory = "property" | "agent" | "document" | "system" | "task" | "message"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
  read_at?: string
  metadata?: Record<string, any>
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  categories: Record<NotificationCategory, boolean>
  created_at: string
  updated_at: string
}

export class NotificationService {
  private supabase = createClient()

  async getNotifications(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Notification[]
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) throw error
    return count || 0
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.supabase.rpc("mark_notification_read", {
      notification_id: notificationId,
    })

    if (error) throw error
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) throw error
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>,
  ) {
    const { data, error } = await this.supabase.rpc("create_notification", {
      p_user_id: userId,
      p_type: type,
      p_category: category,
      p_title: title,
      p_message: message,
      p_link: link,
      p_metadata: metadata || {},
    })

    if (error) throw error
    return data
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error
  }

  async getSettings(userId: string) {
    const { data, error } = await this.supabase.from("notification_settings").select("*").eq("user_id", userId).single()

    if (error) {
      // Si no existe, crear configuración por defecto
      if (error.code === "PGRST116") {
        return this.createDefaultSettings(userId)
      }
      throw error
    }

    return data as NotificationSettings
  }

  async updateSettings(userId: string, settings: Partial<NotificationSettings>) {
    const { data, error } = await this.supabase
      .from("notification_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    return data as NotificationSettings
  }

  private async createDefaultSettings(userId: string) {
    const { data, error } = await this.supabase
      .from("notification_settings")
      .insert({
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        categories: {
          property: true,
          agent: true,
          document: true,
          system: true,
          task: true,
          message: true,
        },
      })
      .select()
      .single()

    if (error) throw error
    return data as NotificationSettings
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = this.supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        },
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

export const notificationService = new NotificationService()
