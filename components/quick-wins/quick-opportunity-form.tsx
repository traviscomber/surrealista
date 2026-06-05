'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function QuickOpportunityForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    contact_name: '',
    phone_number: '',
    location: '',
    hectares: '',
    property_type: 'terreno',
    asking_price: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, property_type: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/quick-wins/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar la oportunidad')
      }

      setSuccess(true)
      setFormData({
        contact_name: '',
        phone_number: '',
        location: '',
        hectares: '',
        property_type: 'terreno',
        asking_price: '',
        notes: '',
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Capturar Oportunidad Rápida</CardTitle>
        <CardDescription>Ingresa rápidamente una nueva oportunidad de terreno</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Oportunidad guardada exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre Contacto</label>
              <Input
                name="contact_name"
                placeholder="Juan Pérez"
                value={formData.contact_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                name="phone_number"
                placeholder="+56912345678"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Input
                name="location"
                placeholder="Curicó, Maule"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hectáreas</label>
              <Input
                name="hectares"
                type="number"
                placeholder="50"
                step="0.1"
                value={formData.hectares}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Propiedad</label>
              <Select value={formData.property_type} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="fundo">Fundo</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="campo">Campo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precio Solicitado (UF)</label>
              <Input
                name="asking_price"
                type="number"
                placeholder="1000"
                step="0.1"
                value={formData.asking_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas Adicionales</label>
            <Textarea
              name="notes"
              placeholder="Información adicional sobre la oportunidad..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Guardando...' : 'Guardar Oportunidad'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
