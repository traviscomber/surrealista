'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Home, MapPin, Ruler, Sparkles, TrendingUp, AlertCircle } from 'lucide-react'

interface QuoteResult {
  estimated_price: number
  price_range: { min: number; max: number }
  price_per_sqm: number
  methodology: string
  confidence: number
  market_factors: string[]
  comparable_analysis: string
  recommendations: string[]
  data_sources?: string[]
  comparable_count?: number
  internet_comparison?: {
    price_per_sqm: number
    source: string
    difference_percentage: number
    interpretation: string
  } | null
}

export default function CotizadorPage() {
  const [formData, setFormData] = useState({
    property_type: '',
    region: '',
    city: '',
    area_sqm: '',
    condition: '',
    features: '',
    additional_info: '',
  })

  const [result, setResult] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const regions = [
    'Metropolitana',
    'Valparaíso',
    'Los Lagos',
    'Los Ríos',
    'Biobío',
    'Araucanía',
    'Maule',
    'O\'Higgins',
    'Coquimbo',
    'Atacama',
    'Antofagasta',
    'Tarapacá',
    'Arica y Parinacota',
    'Aysén',
    'Magallanes',
  ]

  const propertyTypes = [
    { id: 'terreno', label: 'Terreno/Lote' },
    { id: 'casa', label: 'Casa/Vivienda' },
    { id: 'departamento', label: 'Departamento/Piso' },
    { id: 'comercial', label: 'Propiedad Comercial' },
    { id: 'industrial', label: 'Propiedad Industrial' },
    { id: 'agrícola', label: 'Propiedad Agrícola/Fundo' },
    { id: 'local', label: 'Local Comercial' },
    { id: 'oficina', label: 'Oficina' },
  ]

  const conditions = [
    { id: 'excelente', label: 'Excelente estado' },
    { id: 'bueno', label: 'Buen estado' },
    { id: 'regular', label: 'Estado regular' },
    { id: 'reparacion', label: 'Necesita reparación' },
    { id: 'construccion', label: 'En construcción' },
    { id: 'terreno', label: 'Terreno sin mejoras' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.property_type || !formData.region || !formData.area_sqm) {
      setError('Por favor completa al menos: tipo de propiedad, región y área')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cotizador/valuar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Error en la valuación')

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Error al procesar la valuación. Intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Cotizador de Propiedades</h1>
          </div>
          <p className="text-slate-400 text-lg">Valuación inteligente de propiedades inmobiliarias en Chile con datos reales de mercado</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-400" />
                  Datos de la Propiedad
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Proporciona la información de la propiedad para obtener una valuación estimada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Property Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Tipo de Propiedad *</label>
                    <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona el tipo de propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Región *</label>
                      <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona región" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Ciudad</label>
                      <Input
                        type="text"
                        placeholder="Ej: Santiago, Viña del Mar"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Area */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Área (m²) *</label>
                      <Input
                        type="number"
                        placeholder="Ej: 5000"
                        value={formData.area_sqm}
                        onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Estado de la Propiedad</label>
                      <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((cond) => (
                            <SelectItem key={cond.id} value={cond.id}>
                              {cond.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Características (separadas por comas)</label>
                    <Input
                      type="text"
                      placeholder="Ej: piscina, jardín, estacionamiento, acceso a metro"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    />
                  </div>

                  {/* Additional Info */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Información Adicional</label>
                    <Textarea
                      placeholder="Agrega cualquier información relevante (acceso, vista, proximidad a servicios, etc)"
                      value={formData.additional_info}
                      onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base font-semibold"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    {loading ? 'Calculando valuación...' : 'Obtener Valuación'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Result */}
          <div className="lg:col-span-1">
            {result && (
              <div className="space-y-4">
                {/* Main Price */}
                <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-700/50">
                  <CardContent className="pt-6">
                    <p className="text-slate-300 text-sm mb-2">Valor Estimado</p>
                    <p className="text-4xl font-bold text-emerald-400 mb-1">
                      ${(result.estimated_price / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-slate-400 text-xs mb-4">
                      Rango: ${(result.price_range.min / 1000000).toFixed(1)}M - ${(result.price_range.max / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-emerald-300 text-sm">
                      ${result.price_per_sqm.toLocaleString()} por m²
                    </p>
                  </CardContent>
                </Card>

                {/* Confidence */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm">Confianza de la Valuación</p>
                      <p className="text-emerald-400 font-semibold">{Math.round(result.confidence)}%</p>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Methodology */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-slate-300 font-medium mb-2 text-sm">Metodología Aplicada</p>
                    <p className="text-slate-400 text-sm">{result.methodology}</p>
                  </CardContent>
                </Card>

                {/* Data Sources */}
                {result.data_sources && result.data_sources.length > 0 && (
                  <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        Fuentes de Datos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.data_sources.map((source, idx) => (
                          <li key={idx} className="text-blue-200 text-sm flex items-start gap-2">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>
                              {source.includes('SII') ? (
                                <>
                                  <strong>SII (Servicio de Impuestos Internos)</strong> - Avalúos fiscales reales del registro oficial chileno
                                </>
                              ) : source.includes('Properties Enhanced') ? (
                                <>
                                  <strong>Properties Enhanced</strong> - Base de datos de propiedades reales registradas ({result.comparable_count} comparables analizados)
                                </>
                              ) : (
                                source
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-blue-300 text-xs mt-3 pt-3 border-t border-blue-700/30">
                        ✓ Datos verificables • ✓ Registro oficial • ✓ Actualizados a mercado vigente
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Internet Market Comparison */}
                {result.internet_comparison && (
                  <Card className={`border-l-4 ${
                    result.internet_comparison.difference_percentage > 10 ? 'bg-amber-900/30 border-l-amber-500 border-amber-700/50' :
                    result.internet_comparison.difference_percentage < -10 ? 'bg-orange-900/30 border-l-orange-500 border-orange-700/50' :
                    'bg-green-900/30 border-l-green-500 border-green-700/50'
                  }`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className={`h-4 w-4 ${
                          result.internet_comparison.difference_percentage > 10 ? 'text-amber-400' :
                          result.internet_comparison.difference_percentage < -10 ? 'text-orange-400' :
                          'text-green-400'
                        }`} />
                        Comparación con Mercado Vigente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Tu Valuación</p>
                          <p className="text-emerald-400 font-bold">${result.price_per_sqm.toLocaleString()}/m²</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs mb-1">Mercado Actual</p>
                          <p className={`font-bold ${
                            result.internet_comparison.difference_percentage > 10 ? 'text-amber-400' :
                            result.internet_comparison.difference_percentage < -10 ? 'text-orange-400' :
                            'text-green-400'
                          }`}>
                            ${result.internet_comparison.price_per_sqm.toLocaleString()}/m²
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-900/50 rounded">
                        <p className="text-slate-300 text-sm font-medium mb-1">Variación</p>
                        <p className={`text-lg font-bold ${
                          result.internet_comparison.difference_percentage > 10 ? 'text-amber-400' :
                          result.internet_comparison.difference_percentage < -10 ? 'text-orange-400' :
                          'text-green-400'
                        }`}>
                          {result.internet_comparison.difference_percentage > 0 ? '+' : ''}{result.internet_comparison.difference_percentage}%
                        </p>
                      </div>
                      <div className="p-2 bg-slate-700/30 rounded border border-slate-600/50">
                        <p className="text-slate-300 text-sm font-medium mb-1">Análisis</p>
                        <p className="text-slate-400 text-sm">{result.internet_comparison.interpretation}</p>
                      </div>
                      <p className="text-slate-500 text-xs">
                        Basado en: <strong>{result.internet_comparison.source}</strong>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Market Factors */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-slate-300 font-medium mb-2 text-sm">Factores de Mercado</p>
                    <ul className="space-y-1">
                      {result.market_factors.map((factor, idx) => (
                        <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                          <span className="text-emerald-400 mt-1">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <p className="text-slate-300 font-medium mb-2 text-sm">Recomendaciones</p>
                      <ul className="space-y-1">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {!result && !loading && (
              <Card className="bg-slate-800 border-slate-700 h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="p-4 bg-slate-700/50 rounded-lg mb-4 inline-block">
                    <Ruler className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-slate-300 font-medium mb-1">Completa el formulario</p>
                  <p className="text-slate-500 text-sm">Los resultados aparecerán aquí</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
