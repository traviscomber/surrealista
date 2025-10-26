"use client"

import { useState, useEffect } from "react"
import { internalNotificationService, type InternalNotification } from "@/lib/services/internal-notification-service"

export function useInternalNotifications() {
  const [notifications, setNotifications] = useState<InternalNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()

    const unsubscribe = internalNotificationService.subscribeToNotifications((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev])
      if (!newNotification.read) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const data = await internalNotificationService.getNotifications()
    setNotifications(data)
    setUnreadCount(data.filter((n) => !n.read).length)
    setLoading(false)
  }

  const markAsRead = async (notificationId: number) => {
    const success = await internalNotificationService.markAsRead(notificationId)
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const deleteNotification = async (notificationId: number) => {
    const success = await internalNotificationService.deleteNotification(notificationId)
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      const notification = notifications.find((n) => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    refresh: loadNotifications,
  }
}
