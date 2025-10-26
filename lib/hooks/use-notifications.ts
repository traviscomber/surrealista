"use client"

import { useEffect, useState, useCallback } from "react"
import { notificationService, type Notification, type NotificationSettings } from "@/lib/services/notification-service"
import { useAuth } from "@/lib/hooks/use-auth"

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [notifs, count] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ])
      setNotifications(notifs)
      setUnreadCount(count)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error loading notifications:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("[v0] Error marking notification as read:", err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error("[v0] Error marking all as read:", err)
    }
  }, [user?.id])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        setUnreadCount((prev) => {
          const notification = notifications.find((n) => n.id === notificationId)
          return notification && !notification.read ? Math.max(0, prev - 1) : prev
        })
      } catch (err) {
        console.error("[v0] Error deleting notification:", err)
      }
    },
    [notifications],
  )

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = notificationService.subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev])
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    return unsubscribe
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  }
}

export function useNotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadSettings = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await notificationService.getSettings(user.id)
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error loading notification settings:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      if (!user?.id) return

      try {
        const updated = await notificationService.updateSettings(user.id, updates)
        setSettings(updated)
      } catch (err) {
        console.error("[v0] Error updating notification settings:", err)
        throw err
      }
    },
    [user?.id],
  )

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings,
  }
}
