'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Bell, CheckCircle, Clock } from 'lucide-react'

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

export function VisitReminders({ brokerEmail }: VisitRemindersProps) {
  const [reminders, setReminders] = useState<VisitReminder[]>([])
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkReminders = async () => {
      try {
        // Check for visits in next 24 hours
        const response = await fetch('/api/visits/schedule')
        if (!response.ok) return

        const data = await response.json()
        const visits = data.visits || []
        const now = new Date()
        const upcomingReminders: VisitReminder[] = []

        visits.forEach((visit: any) => {
          const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`)
          const hoursUntil = (visitDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

          // Show reminder if 24 hours or less and visit not yet completed
          if (hoursUntil > 0 && hoursUntil <= 24 && visit.status === 'scheduled') {
            upcomingReminders.push({
              id: visit.id,
              visitId: visit.id,
              visitDate: visit.visit_date,
              visitTime: visit.visit_time,
              clientName: visit.client_id, // This should be fetched with client name
              meetingPoint: visit.meeting_point,
              hoursUntil: Math.round(hoursUntil * 10) / 10,
            })
          }
        })

        setReminders(upcomingReminders)
      } catch (error) {
        console.error('Error checking reminders:', error)
      }
    }

    checkReminders()

    // Check every 30 minutes for new reminders
    const interval = setInterval(checkReminders, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (reminderId: string) => {
    setDismissedReminders((prev) => new Set(prev).add(reminderId))
  }

  const activeReminders = reminders.filter((r) => !dismissedReminders.has(r.id))

  if (activeReminders.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-sm z-50">
      {activeReminders.map((reminder) => (
        <Card key={reminder.id} className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">
                    Recordatorio: Visita en {reminder.hoursUntil} horas
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {reminder.visitTime} - {reminder.clientName}
                  </p>
                  {reminder.meetingPoint && (
                    <p className="text-xs text-orange-600 mt-1">
                      📍 {reminder.meetingPoint}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(reminder.id)}
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
