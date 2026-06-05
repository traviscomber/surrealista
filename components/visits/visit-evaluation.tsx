'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, Star } from 'lucide-react'

interface VisitEvaluationProps {
  visitId: string
  clientName?: string
  onSuccess?: () => void
}

export function VisitEvaluation({ visitId, clientName, onSuccess }: VisitEvaluationProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [satisfaction, setSatisfaction] = useState(5)
  const [offerProbability, setOfferProbability] = useState<'high' | 'medium' | 'low'>('medium')
  const [aspectsLiked, setAspectsLiked] = useState('')
  const [aspectsDisliked, setAspectsDisliked] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/visits/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          satisfaction,
          aspectsLiked,
          aspectsDisliked,
          offerProbability,
          followUpNotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al registrar evaluación')
      }

      setSuccess(true)
      setSatisfaction(5)
      setOfferProbability('medium')
      setAspectsLiked('')
      setAspectsDisliked('')
      setFollowUpNotes('')
      setTimeout(() => setSuccess(false), 3000)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const satisfactionLabels = {
    1: '😞 Muy Insatisfecho',
    2: '😕 Insatisfecho',
    3: '😐 Neutral',
    4: '🙂 Satisfecho',
    5: '😊 Muy Satisfecho',
  }

  const probabilityColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Evaluación Post-Visita
        </CardTitle>
        {clientName && <p className="text-sm text-slate-600">Cliente: {clientName}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Satisfaction Rating */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Satisfacción: {satisfactionLabels[satisfaction as keyof typeof satisfactionLabels]}
            </label>
            <div className="flex justify-between items-center px-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSatisfaction(num)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    satisfaction === num
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span className="text-lg">{num}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Offer Probability */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Probabilidad de Oferta
            </label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((prob) => (
                <Badge
                  key={prob}
                  variant={offerProbability === prob ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    offerProbability === prob ? '' : probabilityColors[prob]
                  }`}
                  onClick={() => setOfferProbability(prob)}
                >
                  {prob === 'high' ? '🎯 Alta' : prob === 'medium' ? '📊 Media' : '❌ Baja'}
                </Badge>
              ))}
            </div>
          </div>

          {/* Aspects Liked */}
          <div>
            <label className="text-sm font-medium">✅ Aspectos que Gustaron</label>
            <Textarea
              placeholder="Ej: Ubicación excelente, abundante luz natural, vista despejada..."
              value={aspectsLiked}
              onChange={(e) => setAspectsLiked(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Aspects Disliked */}
          <div>
            <label className="text-sm font-medium">❌ Aspectos que No Gustaron</label>
            <Textarea
              placeholder="Ej: Necesita reparaciones, ruido de la calle, acceso complicado..."
              value={aspectsDisliked}
              onChange={(e) => setAspectsDisliked(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Follow-up Notes */}
          <div>
            <label className="text-sm font-medium">📝 Notas de Seguimiento</label>
            <Textarea
              placeholder="Próximos pasos, contactos de proveedores, recomendaciones..."
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Status Messages */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Evaluación registrada exitosamente</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Registrar Evaluación
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
