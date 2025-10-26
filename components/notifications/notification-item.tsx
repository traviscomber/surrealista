"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/hooks/use-notifications"
import type { Notification } from "@/lib/services/notification-service"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react"

interface NotificationItemProps {
  notification: Notification
  onClose?: () => void
}

const typeIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const typeColors = {
  critical: "text-red-500",
  warning: "text-yellow-500",
  success: "text-green-500",
  info: "text-blue-500",
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter()
  const { markAsRead, deleteNotification } = useNotifications()
  const Icon = typeIcons[notification.type]

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      onClose?.()
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notification.id)
  }

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
        !notification.read && "bg-blue-50/50",
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", typeColors[notification.type])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn("text-sm font-medium", !notification.read && "font-semibold")}>{notification.title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(notification.created_at).toLocaleString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      {!notification.read && <div className="absolute top-4 right-4 h-2 w-2 bg-blue-500 rounded-full" />}
    </div>
  )
}
