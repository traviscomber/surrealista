'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Home, MapPin, Ruler, Sparkles, TrendingUp, AlertCircle, Filter } from 'lucide-react'
import { RuralMacrofiltros, RuralMacrofilters } from '@/components/cotizador/rural-macrofiltros'
import { QuickKeywords } from '@/components/cotizador/quick-keywords'

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
  const [activeTab, setActiveTab] = useState('basico')
  const [formData, setFormData] = useState({
    property_type: '',
    region: '',
    city: '',
    area_sqm: '',
    condition: '',
    features: '',
    additional_info: '',
    macrofiltros: {
      aptitudAgricola: [],
      recursosHidricos: [],
      aptitudFruticola: [],
      aptitudGanadera: [],
      aptitudLechera: [],
      potencialForestal: [],
      desarrolloInmobiliario: [],
      conservacionTurismo: [],
      infraestructura: [],
      accesibilidad: [],
    } as RuralMacrofilters,
    quickKeywords: [] as string[],
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

      if (!response.ok) {
        throw new Error('Error en la valuación')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cotizador de Propiedades</h1>
              <p className="text-slate-400">Valuación profesional con análisis de mercado</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 p-6 min-h-[calc(100vh-150px)]">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white">Información de la Propiedad</CardTitle>
                <CardDescription className="text-slate-400">
                  Completa los datos para obtener valuación
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-700 mb-4">
                      <TabsTrigger value="basico" className="data-[state=active]:bg-emerald-600">
                        Básico
                      </TabsTrigger>
                      <TabsTrigger value="macrofiltros" className="data-[state=active]:bg-emerald-600">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros Rurales
                      </TabsTrigger>
                      <TabsTrigger value="palabras-clave" className="data-[state=active]:bg-emerald-600">
                        Palabras Clave
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab: Datos Básicos */}
                    <TabsContent value="basico" className="space-y-4">
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
                            placeholder="e.g., Santiago"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Area */}
                        <div>
                          <label className="block text-sm font-medium text-slate-200 mb-2">Área (m²) *</label>
                          <Input
                            type="number"
                            placeholder="e.g., 5000"
                            value={formData.area_sqm}
                            onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                          />
                        </div>

                        {/* Condition */}
                        <div>
                          <label className="block text-sm font-medium text-slate-200 mb-2">Condición</label>
                          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Selecciona condición" />
                            </SelectTrigger>
                            <SelectContent>
                              {conditions.map((condition) => (
                                <SelectItem key={condition.id} value={condition.id}>
                                  {condition.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">Características</label>
                        <Textarea
                          placeholder="e.g., Frente a calle, vista al mar, con árboles frutales..."
                          value={formData.features}
                          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                          rows={3}
                        />
                      </div>

                      {/* Additional Info */}
                      <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">Información Adicional</label>
                        <Textarea
                          placeholder="Detalles adicionales que consideres importante..."
                          value={formData.additional_info}
                          onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab: Macrofiltros Rurales */}
                    <TabsContent value="macrofiltros" className="space-y-4">
                      <RuralMacrofiltros
                        values={formData.macrofiltros}
                        onChange={(macrofiltros) => setFormData({ ...formData, macrofiltros })}
                      />
                    </TabsContent>

                    {/* Tab: Palabras Clave */}
                    <TabsContent value="palabras-clave" className="space-y-4">
                      <QuickKeywords
                        selectedKeywords={formData.quickKeywords}
                        onChange={(quickKeywords) => setFormData({ ...formData, quickKeywords })}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Calculando valuación...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Obtener Valuación
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {loading && (
              <Card className="bg-slate-800 border-slate-700 h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="animate-spin inline-block p-4 bg-slate-700/50 rounded-lg mb-4">
                    <Sparkles className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-300 font-medium">Analizando propiedad...</p>
                  <p className="text-slate-500 text-sm">Esto puede tomar unos momentos</p>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-4">
                {/* Main Result */}
                <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 border-emerald-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-300 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Valuación Estimada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-4xl font-bold text-white">
                      ${result.estimated_price.toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Rango Estimado</p>
                        <p className="text-emerald-300 font-medium">
                          ${result.price_range.min.toLocaleString()} - ${result.price_range.max.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Precio por m²</p>
                        <p className="text-emerald-300 font-medium">
                          ${result.price_per_sqm.toLocaleString()}/m²
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded">
                      <p className="text-slate-400 text-xs mb-1">Confiabilidad</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className="text-emerald-300 font-bold text-sm">{result.confidence}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparable Analysis */}
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
