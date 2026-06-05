'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, DollarSign, Home, AlertCircle, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TasacionResult {
  precioRecomendado: number
  precioMinimo: number
  precioMaximo: number
  precioPorM2: number
  potencialInversion: 'alto' | 'medio' | 'bajo'
  margenUF: number
  factoresPositivos: string[]
  factoresNegativos: string[]
  insightMercado: string
  recomendacion: string
}

interface PriceTasacionMotorProps {
  clientId?: string
  propertyData?: {
    type?: string
    area?: number
    bedrooms?: number
    bathrooms?: number
    yearBuilt?: number
    location?: string
    region?: string
    city?: string
  }
}

export function PriceTasacionMotor({ clientId, propertyData }: PriceTasacionMotorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tasacion, setTasacion] = useState<TasacionResult | null>(null)

  // Form state
  const [form, setForm] = useState({
    type: propertyData?.type || 'Casa',
    area: propertyData?.area || 500,
    bedrooms: propertyData?.bedrooms || 3,
    bathrooms: propertyData?.bathrooms || 2,
    yearBuilt: propertyData?.yearBuilt || 2010,
    location: propertyData?.location || '',
    region: propertyData?.region || '',
    city: propertyData?.city || '',
  })

  const handleAnalyze = async () => {
    if (!form.city || !form.region) {
      setError('Por favor completa ubicación y región')
      return
    }

    setLoading(true)
    setError(null)
    setTasacion(null)

    try {
      const response = await fetch('/api/tasacion/analyze-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: form,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al analizar propiedad')
      }

      const data = await response.json()
      if (data.tasacion) {
        setTasacion(data.tasacion)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con API')
    } finally {
      setLoading(false)
    }
  }

  const investmentColor = {
    alto: 'text-green-600 bg-green-50',
    medio: 'text-yellow-600 bg-yellow-50',
    bajo: 'text-red-600 bg-red-50',
  }

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Motor de Tasación - Análisis de Precio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo Propiedad</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option>Casa</option>
                <option>Departamento</option>
                <option>Terreno</option>
                <option>Local Comercial</option>
                <option>Oficina</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Área (m²)</label>
              <Input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Dormitorios</label>
              <Input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Baños</label>
              <Input
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Año Construcción</label>
              <Input
                type="number"
                value={form.yearBuilt}
                onChange={(e) => setForm({ ...form, yearBuilt: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Región</label>
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="Ej: Metropolitana"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Ciudad</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ej: Santiago"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Ubicación Específica</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ej: Providencia, calle principal"
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analizar Precio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {tasacion && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {/* Price Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Precio Recomendado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-green-600">
                UF {tasacion.precioRecomendado.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Rango Mínimo</p>
                  <p className="font-semibold">UF {tasacion.precioMinimo.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rango Máximo</p>
                  <p className="font-semibold">UF {tasacion.precioMaximo.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-gray-600">Por m²</p>
                  <p className="font-semibold">UF {tasacion.precioPorM2.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-gray-600">Margen</p>
                  <p className="font-semibold">{tasacion.margenUF.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Potential */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Potencial de Inversión</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={cn(
                  'px-4 py-2 text-base capitalize',
                  investmentColor[tasacion.potencialInversion]
                )}
              >
                {tasacion.potencialInversion === 'alto' && 'Alto Potencial'}
                {tasacion.potencialInversion === 'medio' && 'Potencial Medio'}
                {tasacion.potencialInversion === 'bajo' && 'Bajo Potencial'}
              </Badge>
            </CardContent>
          </Card>

          {/* Positive Factors */}
          {tasacion.factoresPositivos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Factores Positivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tasacion.factoresPositivos.map((factor, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-600 font-bold">+</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Negative Factors */}
          {tasacion.factoresNegativos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600" />
                  Factores Negativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tasacion.factoresNegativos.map((factor, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-red-600 font-bold">-</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Insight */}
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Insight del Mercado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {tasacion.insightMercado}
              </p>
            </CardContent>
          </Card>

          {/* Recomendation */}
          <Card className="bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recomendación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {tasacion.recomendacion}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
