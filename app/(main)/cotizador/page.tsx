'use client'

import { useState } from 'react'
import { AlertCircle, BarChart3, CheckCircle2, Loader2, MapPin, RotateCcw, Send } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ResolvedContext {
  address: string | null
  display_name: string | null
  region: string | null
  city: string | null
  lat: number | null
  lng: number | null
  property_type: string
  area_sqm: number | null
}

interface QuoteResult {
  status?: 'valued'
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
  resolved_context?: ResolvedContext
}

interface NeedsInput {
  status: 'needs_input'
  question: string
  missing: string[]
  options?: string[] | null
  resolved_context: ResolvedContext
}

function formatClp(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function CotizadorPage() {
  const [address, setAddress] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [resolvedContext, setResolvedContext] = useState<ResolvedContext | null>(null)
  const [question, setQuestion] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runValuation = async (payload: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/cotizador/valuar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))

      if (body.status === 'needs_input') {
        const needs = body as NeedsInput
        setResolvedContext(needs.resolved_context)
        setQuestion(needs.question)
        setMissing(needs.missing ?? [])
        setOptions(needs.options ?? [])
        setFollowUp('')
        setResult(null)
        return
      }

      if (!response.ok) {
        throw new Error(body.error || 'No se pudo calcular la referencia de valor.')
      }

      setResult(body as QuoteResult)
      setResolvedContext(body.resolved_context ?? resolvedContext)
      setQuestion(null)
      setMissing([])
      setOptions([])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo completar el cálculo.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (address.trim().length < 3) {
      setError('Escribe una dirección, camino, sector o localidad.')
      return
    }
    setResult(null)
    setResolvedContext(null)
    setQuestion(null)
    setOptions([])
    await runValuation({ address: address.trim() })
  }

  const handleFollowUp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!followUp.trim() || !resolvedContext) return

    const needsAddressClarification = missing.includes('address_clarification') || missing.includes('region')
    const nextAddress = needsAddressClarification
      ? `${address.trim()}, ${followUp.trim()}`
      : address.trim()

    if (needsAddressClarification) setAddress(nextAddress)

    await runValuation({
      address: nextAddress,
      natural_input: followUp.trim(),
      resolved_context: resolvedContext,
    })
  }

  const chooseLocation = async (option: string) => {
    setAddress(option)
    setQuestion(null)
    setOptions([])
    setResolvedContext(null)
    await runValuation({ address: option })
  }

  const reset = () => {
    setAddress('')
    setFollowUp('')
    setResolvedContext(null)
    setQuestion(null)
    setMissing([])
    setOptions([])
    setResult(null)
    setError(null)
  }

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Valorizador de terrenos"
        title="¿Dónde está el terreno?"
        description="Escribe la dirección, camino, sector o localidad. Sur-realista resuelve la ubicación y busca evidencia de mercado en Chile."
        outcome="Si falta un dato importante, te lo preguntaremos en lenguaje natural antes de calcular."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Ubicación</CardTitle>
            <CardDescription>No necesitas saber coordenadas, región ni códigos internos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleAddressSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Ej.: Camino a Ensenada km 12, Puerto Varas"
                disabled={loading}
                className="min-h-11 flex-1"
              />
              <Button type="submit" disabled={loading} className="min-h-11">
                {loading && !question ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Analizar
              </Button>
            </form>

            {resolvedContext?.display_name ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Ubicación resuelta</p>
                <p className="mt-1 text-muted-foreground">{resolvedContext.display_name}</p>
              </div>
            ) : null}

            {question ? (
              <div className="space-y-4 rounded-md border p-4">
                <p className="text-sm font-medium leading-6">{question}</p>

                {options.length ? (
                  <div className="space-y-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={loading}
                        onClick={() => chooseLocation(option)}
                        className="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}

                <form onSubmit={handleFollowUp} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={followUp}
                    onChange={(event) => setFollowUp(event.target.value)}
                    placeholder={missing.includes('area_sqm') ? 'Ej.: 5.000 m² o 12 hectáreas' : 'Escribe una referencia breve'}
                    disabled={loading}
                    autoFocus
                    className="min-h-11 flex-1"
                  />
                  <Button type="submit" disabled={loading || !followUp.trim()} className="min-h-11">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Continuar
                  </Button>
                </form>
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {(result || resolvedContext || error) ? (
              <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={loading}>
                <RotateCcw className="mr-2 h-4 w-4" /> Nueva valorización
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referencia de mercado</CardTitle>
            <CardDescription>Se calcula solo con evidencia suficiente y trazable.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p>Resolviendo ubicación y buscando comparables.</p>
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
                    <h3 className="text-sm font-semibold">Evidencia usada</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {result.market_factors.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                    </ul>
                  </div>
                ) : null}

                {result.data_sources?.length ? (
                  <div>
                    <h3 className="text-sm font-semibold">Fuentes</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.data_sources.join(', ')}</p>
                  </div>
                ) : null}

                {result.last_updated ? <p className="text-xs text-muted-foreground">Último dato utilizado: {new Date(result.last_updated).toLocaleString('es-CL')}</p> : null}
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                <BarChart3 className="h-7 w-7 text-muted-foreground" />
                <div>
                  <p className="font-medium">Parte por la dirección</p>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">El sistema resolverá la ubicación y pedirá solo lo que falte para construir una referencia responsable.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
