'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Offer {
  id: string
  amount: number
  date: string
  status: 'pending' | 'accepted' | 'rejected' | 'countered'
  notes?: string
  proposedBy: 'us' | 'client'
}

interface OfferManagerProps {
  clientId?: string
  propertyId?: string
  currentPrice?: number
}

export function OfferManager({ clientId, propertyId, currentPrice = 0 }: OfferManagerProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newOffer, setNewOffer] = useState({
    amount: '',
    notes: '',
    proposedBy: 'client' as 'us' | 'client',
  })

  const handleAddOffer = () => {
    if (!newOffer.amount) return

    const offer: Offer = {
      id: `offer-${Date.now()}`,
      amount: parseFloat(newOffer.amount),
      date: new Date().toLocaleDateString('es-CL'),
      status: 'pending',
      notes: newOffer.notes,
      proposedBy: newOffer.proposedBy,
    }

    setOffers([offer, ...offers])
    setNewOffer({ amount: '', notes: '', proposedBy: 'client' })
    setIsOpen(false)
  }

  const updateOfferStatus = (id: string, status: Offer['status']) => {
    setOffers(offers.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'countered':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const badgeMap = {
      pending: 'bg-amber-100 text-amber-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      countered: 'bg-blue-100 text-blue-800',
    }
    const statusLabels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      countered: 'Contrapropuesta',
    }
    return badgeMap[status as keyof typeof badgeMap] || ''
  }

  const priceChange = offers.length > 0 ? offers[0].amount - currentPrice : 0
  const percentChange = currentPrice > 0 ? ((priceChange / currentPrice) * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestor de Ofertas</CardTitle>
        <CardDescription>Seguimiento de ofertas y contraofertas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Summary */}
        {currentPrice > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <p className="text-gray-600">Precio Base</p>
              <p className="font-bold text-lg">{currentPrice.toLocaleString('es-CL')} UF</p>
            </div>
            {offers.length > 0 && (
              <>
                <div>
                  <p className="text-gray-600">Última Oferta</p>
                  <p className="font-bold text-lg">{offers[0].amount.toLocaleString('es-CL')} UF</p>
                </div>
                <div>
                  <p className="text-gray-600">Diferencia</p>
                  <p className={`font-bold text-lg ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString('es-CL')} UF ({percentChange}%)
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Offers List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {offers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin ofertas registradas</p>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(offer.status)}
                    <span className="font-bold text-lg">{offer.amount.toLocaleString('es-CL')} UF</span>
                    <span className="text-xs text-gray-500">{offer.date}</span>
                  </div>
                  <Badge className={getStatusBadge(offer.status)}>
                    {offer.status === 'pending' && 'Pendiente'}
                    {offer.status === 'accepted' && 'Aceptada'}
                    {offer.status === 'rejected' && 'Rechazada'}
                    {offer.status === 'countered' && 'Contrapropuesta'}
                  </Badge>
                </div>

                {offer.notes && <p className="text-sm text-gray-600">{offer.notes}</p>}

                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button
                    size="xs"
                    variant={offer.status === 'accepted' ? 'default' : 'outline'}
                    onClick={() => updateOfferStatus(offer.id, 'accepted')}
                    className="text-xs"
                  >
                    ✓ Aceptar
                  </Button>
                  <Button
                    size="xs"
                    variant={offer.status === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => updateOfferStatus(offer.id, 'rejected')}
                    className="text-xs"
                  >
                    ✕ Rechazar
                  </Button>
                  <Button
                    size="xs"
                    variant={offer.status === 'countered' ? 'default' : 'outline'}
                    onClick={() => updateOfferStatus(offer.id, 'countered')}
                    className="text-xs"
                  >
                    ⟳ Contrapropuesta
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Offer Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Oferta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Oferta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto Ofrecido (UF)</label>
                <Input
                  type="number"
                  placeholder="Ej: 1250"
                  step="0.1"
                  value={newOffer.amount}
                  onChange={(e) => setNewOffer({ ...newOffer, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Propuesta de:</label>
                <Select
                  value={newOffer.proposedBy}
                  onValueChange={(val) => setNewOffer({ ...newOffer, proposedBy: val as 'us' | 'client' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="us">Nosotros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  placeholder="Comentarios adicionales..."
                  value={newOffer.notes}
                  onChange={(e) => setNewOffer({ ...newOffer, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleAddOffer} className="w-full">
                Registrar Oferta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
