"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

interface VisitReminder {
  id: string
  visitId: string
  visitDate: string
  visitTime: string
  clientName: string
  meetingPoint: string
  hoursUntil: number
}

interface VisitRemindersProps {
  brokerEmail?: string
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function VisitReminders({ brokerEmail }: VisitRemindersProps) {
  const [reminders, setReminders] = useState<VisitReminder[]>([])
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkReminders = async () => {
      try {
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const params = new URLSearchParams({
          status: "scheduled",
          from: formatLocalDate(now),
          to: formatLocalDate(tomorrow),
          limit: "100",
        })

        const response = await fetch(`/api/visits/schedule?${params.toString()}`, {
          cache: "no-store",
        })
        if (!response.ok) return

        const data = await response.json()
        const visits = data.visits || []
        const upcomingReminders: VisitReminder[] = []

        visits.forEach((visit: any) => {
          const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`)
          const hoursUntil = (visitDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

          if (hoursUntil > 0 && hoursUntil <= 24) {
            upcomingReminders.push({
              id: visit.id,
              visitId: visit.id,
              visitDate: visit.visit_date,
              visitTime: visit.visit_time,
              clientName: visit.client_id,
              meetingPoint: visit.meeting_point,
              hoursUntil: Math.round(hoursUntil * 10) / 10,
            })
          }
        })

        setReminders(upcomingReminders)
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }

    void checkReminders()

    const interval = window.setInterval(checkReminders, 30 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [brokerEmail])

  const handleDismiss = (reminderId: string) => {
    setDismissedReminders((prev) => new Set(prev).add(reminderId))
  }

  const activeReminders = reminders.filter((r) => !dismissedReminders.has(r.id))

  if (activeReminders.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2">
      {activeReminders.map((reminder) => (
        <Card key={reminder.id} className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">
                    Recordatorio: Visita en {reminder.hoursUntil} horas
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    {reminder.visitTime} - {reminder.clientName}
                  </p>
                  {reminder.meetingPoint && (
                    <p className="mt-1 text-xs text-orange-600">📍 {reminder.meetingPoint}</p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDismiss(reminder.id)}>
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
