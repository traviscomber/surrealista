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
  metadata?: Record<string, unknown>
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

const DEFAULT_CATEGORIES: Record<NotificationCategory, boolean> = {
  property: true,
  agent: true,
  document: true,
  system: true,
  task: true,
  message: true,
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeType(value: unknown): NotificationType | null {
  return value === "critical" || value === "warning" || value === "info" || value === "success" ? value : null
}

function normalizeCategory(value: unknown): NotificationCategory | null {
  return value === "property" || value === "agent" || value === "document" || value === "system" || value === "task" || value === "message" ? value : null
}

function normalizeCategories(value: unknown): Record<NotificationCategory, boolean> {
  const row = asRecord(value)
  return {
    property: row?.property !== false,
    agent: row?.agent !== false,
    document: row?.document !== false,
    system: row?.system !== false,
    task: row?.task !== false,
    message: row?.message !== false,
  }
}

function normalizeNotification(value: unknown): Notification | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const userId = stringValue(row.user_id)
  const type = normalizeType(row.type)
  const category = normalizeCategory(row.category)
  const title = stringValue(row.title)
  const message = stringValue(row.message)
  if (!id || !userId || !type || !category || !title || !message) return null

  return {
    id,
    user_id: userId,
    type,
    category,
    title,
    message,
    link: stringValue(row.link) || undefined,
    read: row.read === true,
    created_at: stringValue(row.created_at),
    read_at: stringValue(row.read_at) || undefined,
    metadata: asRecord(row.metadata) || undefined,
  }
}

function normalizeSettings(value: unknown, expectedUserId?: string): NotificationSettings | null {
  const row = asRecord(value)
  if (!row) return null
  const id = stringValue(row.id)
  const userId = stringValue(row.user_id) || expectedUserId || ""
  if (!id || !userId) return null

  return {
    id,
    user_id: userId,
    email_enabled: row.email_enabled !== false,
    push_enabled: row.push_enabled !== false,
    categories: normalizeCategories(row.categories),
    created_at: stringValue(row.created_at),
    updated_at: stringValue(row.updated_at),
  }
}

export class NotificationService {
  private supabase = createClient()

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return (Array.isArray(data) ? data : [])
      .map(normalizeNotification)
      .filter((notification): notification is Notification => notification !== null)
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
    const { error } = await this.supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)

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
    metadata?: Record<string, unknown>,
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        category,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
        read: false,
      })
      .select("*")
      .single()

    if (error) throw error
    return normalizeNotification(data)
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.supabase.from("notifications").delete().eq("id", notificationId)
    if (error) throw error
  }

  async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.supabase.from("notification_settings").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") return this.createDefaultSettings(userId)
      throw error
    }

    const settings = normalizeSettings(data, userId)
    if (!settings) throw new Error("Invalid notification settings row")
    return settings
  }

  async updateSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof settings.email_enabled === "boolean") patch.email_enabled = settings.email_enabled
    if (typeof settings.push_enabled === "boolean") patch.push_enabled = settings.push_enabled
    if (settings.categories) patch.categories = normalizeCategories(settings.categories)

    const { data, error } = await this.supabase
      .from("notification_settings")
      .update(patch)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) throw error
    const normalized = normalizeSettings(data, userId)
    if (!normalized) throw new Error("Invalid updated notification settings row")
    return normalized
  }

  private async createDefaultSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.supabase
      .from("notification_settings")
      .insert({ user_id: userId, email_enabled: true, push_enabled: true, categories: DEFAULT_CATEGORIES })
      .select("*")
      .single()

    if (error) throw error
    const settings = normalizeSettings(data, userId)
    if (!settings) throw new Error("Invalid default notification settings row")
    return settings
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = normalizeNotification(payload.new)
          if (notification) callback(notification)
        },
      )
      .subscribe()

    return () => {
      void this.supabase.removeChannel(channel)
    }
  }
}

export const notificationService = new NotificationService()
