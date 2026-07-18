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
    // Query alerts table and map to Notification format
    // Note: alerts table uses organization_id, not user_id
    // For now, we fetch organization alerts that the user should see
    const { data, error } = await this.supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    
    // Map alerts to notification format
    return (data || []).map((alert: any) => ({
      id: alert.id,
      user_id: userId,
      type: this.mapAlertTypeToNotificationType(alert.type),
      category: alert.category || "system",
      title: alert.title,
      message: alert.message,
      link: alert.action_url,
      read: alert.is_read || false,
      created_at: alert.created_at,
      read_at: alert.read_at,
      metadata: alert.metadata,
    })) as Notification[]
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)

    if (error) throw error
    return count || 0
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.supabase
      .from("alerts")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) throw error
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .from("alerts")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("is_read", false)

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
    // This is typically called from backend - alerts are created via dedicated functions
    console.warn("[v0] createNotification called - alerts should be created via document-alerts-generator")
    return null
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.supabase
      .from("alerts")
      .update({ is_dismissed: true })
      .eq("id", notificationId)

    if (error) throw error
  }

  private mapAlertTypeToNotificationType(alertType: string): NotificationType {
    // Map alert types from alerts table to notification types
    if (alertType.includes("REJECTED") || alertType.includes("ERROR")) return "critical"
    if (alertType.includes("EXPIR")) return "warning"
    if (alertType.includes("APPROVED") || alertType.includes("SUCCESS")) return "success"
    return "info"
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
