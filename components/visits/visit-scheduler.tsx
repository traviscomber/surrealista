'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface VisitSchedulerProps {
  clientId: string
  clientName?: string
  onSuccess?: () => void
}

export function VisitScheduler({ clientId, clientName, onSuccess }: VisitSchedulerProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    visitDate: '',
    visitTime: '10:00',
    duration: '60',
    meetingPoint: '',
    notes: '',
    propertyId: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/visits/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          propertyId: formData.propertyId || null,
          visitDate: formData.visitDate,
          visitTime: formData.visitTime,
          duration: parseInt(formData.duration),
          meetingPoint: formData.meetingPoint,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al agendar visita')
      }

      setSuccess(true)
      setFormData({
        visitDate: '',
        visitTime: '10:00',
        duration: '60',
        meetingPoint: '',
        notes: '',
        propertyId: '',
      })
      setTimeout(() => setSuccess(false), 3000)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agendar Visita a Terreno
        </CardTitle>
        {clientName && <p className="text-sm text-slate-600">Cliente: {clientName}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha de Visita</label>
              <Input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hora</label>
              <Input
                type="time"
                name="visitTime"
                value={formData.visitTime}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duración (minutos)
            </label>
            <Input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="15"
              max="240"
              className="mt-1"
            />
          </div>

          {/* Meeting Point */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Punto de Encuentro
            </label>
            <Input
              type="text"
              name="meetingPoint"
              placeholder="Ej: Entrada principal, GPS: -33.4489, -70.6693"
              value={formData.meetingPoint}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notas Adicionales</label>
            <Textarea
              name="notes"
              placeholder="Información importante sobre la propiedad o cliente..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Status Messages */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Visita agendada exitosamente</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !formData.visitDate}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Visita
              </>
            )}
          </Button>

          {/* Pre-visit Checklist Preview */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">✓ Se creará automáticamente:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <Badge variant="outline" className="mr-2">Checklist pre-visita</Badge>
              <Badge variant="outline" className="mr-2">Recordatorio 24h antes</Badge>
              <Badge variant="outline">Formulario de evaluación</Badge>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
