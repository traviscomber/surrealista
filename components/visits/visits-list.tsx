'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react'

interface Visit {
  id: string
  client_id: string
  visit_date: string
  visit_time: string
  duration_minutes: number
  meeting_point: string
  status: string
  notes: string
}

interface VisitsListProps {
  clientId?: string
  onVisitClick?: (visit: Visit) => void
}

export function VisitsList({ clientId, onVisitClick }: VisitsListProps) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const url = clientId
          ? `/api/visits/schedule?clientId=${clientId}`
          : '/api/visits/schedule'

        const response = await fetch(url)
        if (!response.ok) throw new Error('Error fetching visits')

        const data = await response.json()
        setVisits(data.visits || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchVisits()
  }, [clientId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Agendada</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Completada</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`)
    return d.toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando visitas...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error}
        </CardContent>
      </Card>
    )
  }

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-slate-500">
          <Calendar className="w-5 h-5 mr-2" />
          No hay visitas agendadas
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Visitas Agendadas ({visits.length})</h3>
      {visits.map((visit) => (
        <Card key={visit.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">
                    {formatDateTime(visit.visit_date, visit.visit_time)}
                  </span>
                  {getStatusBadge(visit.status)}
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duración: {visit.duration_minutes} minutos
                  </div>
                  {visit.meeting_point && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {visit.meeting_point}
                    </div>
                  )}
                </div>

                {visit.notes && (
                  <p className="text-sm text-slate-600 mt-2 italic">"{visit.notes}"</p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onVisitClick?.(visit)}
              >
                Ver Detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
