'use client'

import { useState } from 'react'
import { AlertCircle, BarChart3, Calculator, CheckCircle2, Loader2 } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface QuoteResult {
  estimated_price: number
  price_range: { min: number; max: number }
  price_per_sqm: number
  methodology: string
  confidence: number
  sample_count: number
  market_factors: string[]
  comparable_analysis: string
  recommendations: string[]
  data_sources?: string[]
  last_updated?: string | null
  uf_value?: number | null
  uf_date?: string | null
}

const regions = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos',
  'Los Lagos', 'Aysén', 'Magallanes',
]

const propertyTypes = [
  { id: 'terreno', label: 'Terreno o lote' },
  { id: 'casa', label: 'Casa o vivienda' },
  { id: 'departamento', label: 'Departamento' },
  { id: 'comercial', label: 'Propiedad comercial' },
  { id: 'industrial', label: 'Propiedad industrial' },
  { id: 'agrícola', label: 'Campo, fundo o propiedad agrícola' },
  { id: 'local', label: 'Local comercial' },
  { id: 'oficina', label: 'Oficina' },
]

function formatClp(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function CotizadorPage() {
  const [formData, setFormData] = useState({
    property_type: '',
    region: '',
    city: '',
    area_sqm: '',
  })
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.property_type || !formData.region || !formData.area_sqm) {
      setError('Completa tipo de propiedad, región y superficie para generar una referencia.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/cotizador/valuar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'No se pudo calcular la referencia de valor.')
      setResult(payload)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo completar el cálculo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Análisis comercial"
        title="Referencia de valor con comparables"
        description="Calcula una referencia interna únicamente cuando existen suficientes avisos comparables trazables por región, tipo y superficie."
        outcome="Obtendrás un rango de trabajo, precio mediano por metro cuadrado, tamaño de muestra, fuentes y fecha de actualización."
      />

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong>Alcance:</strong> no se generan valores cuando faltan comparables suficientes. Esta herramienta no reemplaza una tasación profesional, bancaria, tributaria ni legal.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Datos para buscar comparables</CardTitle>
            <CardDescription>La comuna es opcional; al ingresarla, la muestra será más específica y puede resultar insuficiente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de propiedad *</label>
                  <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>{propertyTypes.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Región *</label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar región" /></SelectTrigger>
                    <SelectContent>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comuna o localidad</label>
                  <Input value={formData.city} onChange={(event) => setFormData({ ...formData, city: event.target.value })} placeholder="Ej.: Futrono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Superficie en m² *</label>
                  <Input type="number" min="1" value={formData.area_sqm} onChange={(event) => setFormData({ ...formData, area_sqm: event.target.value })} placeholder="Ej.: 50000" />
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                {loading ? 'Buscando comparables…' : 'Calcular referencia'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado verificable</CardTitle>
            <CardDescription>El resultado aparece solo cuando la muestra cumple el mínimo requerido.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p>Consultando comparables activos.</p>
              </div>
            ) : result ? (
              <div className="space-y-5">
                <div className="rounded-md border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Referencia central</p>
                  <p className="mt-1 font-serif text-3xl font-semibold">{formatClp(result.estimated_price)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Rango: {formatClp(result.price_range.min)} – {formatClp(result.price_range.max)}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Valor por m²</p><p className="mt-1 font-medium">{formatClp(result.price_per_sqm)}</p></div>
                  <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Confianza</p><p className="mt-1 font-medium">{Math.round(result.confidence || 0)}%</p></div>
                  <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Muestra</p><p className="mt-1 font-medium">{result.sample_count || 0}</p></div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Metodología</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.methodology}</p>
                </div>

                {result.market_factors?.length ? (
                  <div>
                    <h3 className="text-sm font-semibold">Factores observados</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {result.market_factors.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                    </ul>
                  </div>
                ) : null}

                {result.data_sources?.length ? (
                  <div>
                    <h3 className="text-sm font-semibold">Fuentes declaradas</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.data_sources.join(', ')}</p>
                  </div>
                ) : null}

                {result.last_updated ? <p className="text-xs text-muted-foreground">Último dato utilizado: {new Date(result.last_updated).toLocaleString('es-CL')}</p> : null}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                <BarChart3 className="h-7 w-7 text-muted-foreground" />
                <div>
                  <p className="font-medium">Aún no hay una referencia calculada</p>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">Completa los datos mínimos para buscar una muestra comparable real.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
