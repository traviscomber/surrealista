'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, MapPin, Loader2, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import type { PropertyAnalysis } from '@/lib/kmz/kmz-property-analyzer'

interface KMZAnalysisPanelProps {
  clientId?: string
  clientName?: string
}

export function KMZAnalysisPanel({ clientId, clientName }: KMZAnalysisPanelProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.kmz')) {
      setError('Por favor carga un archivo .kmz válido')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      if (clientId) formData.append('clientId', clientId)

      const response = await fetch('/api/kmz/analyze-property', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error al analizar el KMZ')
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Arrastra tu archivo KMZ aquí
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                O haz click para seleccionar un archivo
              </p>
            </div>
            <Button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.kmz'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
              variant="outline"
              disabled={loading}
            >
              Seleccionar archivo KMZ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-8 flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analizando propiedad...</span>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Región</p>
                  <p className="font-semibold">{analysis.region}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Comuna</p>
                  <p className="font-semibold">{analysis.commune}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sector</p>
                  <p className="font-semibold text-sm">{analysis.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Confianza</p>
                  <p className="font-semibold">{analysis.confidence}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Area Card */}
          <Card>
            <CardHeader>
              <CardTitle>Área de la Propiedad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Hectáreas</p>
                  <p className="text-2xl font-bold text-green-600">{analysis.hectares.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Metros cuadrados</p>
                  <p className="text-lg font-semibold">{analysis.area_m2.toLocaleString()} m²</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Características Geográficas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {analysis.features.hasRiver && (
                  <Badge variant="secondary" className="justify-center">
                    ✓ Río cercano
                  </Badge>
                )}
                {analysis.features.hasLake && (
                  <Badge variant="secondary" className="justify-center">
                    ✓ Lago cercano
                  </Badge>
                )}
                {analysis.features.hasSeaAccess && (
                  <Badge variant="secondary" className="justify-center">
                    ✓ Acceso al mar
                  </Badge>
                )}
                {analysis.features.nearbyRoad && (
                  <Badge variant="secondary" className="justify-center">
                    ✓ Ruta a {analysis.features.roadDistance?.toFixed(1)}km
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Neighboring Properties Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Propiedades Vecinas
              </CardTitle>
              <CardDescription>En radio de 5km</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                {analysis.neighboringProperties.map((neighbor, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <span className="text-sm">
                      {neighbor.direction} - {neighbor.distance.toFixed(2)} km
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análisis de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Precio por Ha</p>
                  <p className="text-xl font-bold">
                    UF {analysis.marketAnalysis.pricePerHectare.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Valor Estimado</p>
                  <p className="text-xl font-bold text-blue-600">
                    UF {analysis.marketAnalysis.estimatedValue.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Nivel de Demanda</p>
                <Badge
                  className={
                    analysis.marketAnalysis.demandLevel === 'high'
                      ? 'bg-green-600'
                      : analysis.marketAnalysis.demandLevel === 'medium'
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }
                >
                  {analysis.marketAnalysis.demandLevel === 'high'
                    ? 'Alta demanda'
                    : analysis.marketAnalysis.demandLevel === 'medium'
                      ? 'Demanda moderada'
                      : 'Baja demanda'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Market Alert Card */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              {analysis.marketAnalysis.marketAlert}
            </AlertDescription>
          </Alert>

          {/* Timestamp */}
          <p className="text-xs text-slate-500 text-center">
            Análisis realizado: {new Date(analysis.processedAt).toLocaleString('es-CL')}
          </p>
        </div>
      )}
    </div>
  )
}
