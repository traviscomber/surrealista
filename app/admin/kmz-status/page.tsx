'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface DiagnosticData {
  timestamp: string
  diagnostics: {
    kmz_collection: { total: number; samples: any[] }
    kmz_location_index: { total: number; samples: any[] }
    property_documents_kmz: { total: number; samples: any[] }
  }
  status: {
    index_populated: boolean
    kmz_files_exist: boolean
    ready_to_search: boolean
  }
}

export default function KMZStatusPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchDiagnostic = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/kmz/diagnostic')
      const data = await response.json()
      setDiagnostic(data)
      console.log('[v0] Diagnostic data:', data)
      toast.success('Diagnóstico actualizado')
    } catch (error) {
      console.error('[v0] Error fetching diagnostic:', error)
      toast.error('Error al obtener diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const handleIndexNow = async () => {
    setLoading(true)
    try {
      console.log('[v0] Starting immediate indexing of ALL KMZ sources...')
      const response = await fetch('/api/admin/index-kmz-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      console.log('[v0] Indexing response:', data)
      
      if (response.ok) {
        toast.success(`Indexadas ${data.totalLocationsIndexed} ubicaciones de ${data.sourcesProcessed} fuentes`)
        await fetchDiagnostic()
      } else {
        toast.error(data.error || 'Error en indexación')
      }
    } catch (error: any) {
      console.error('[v0] Error:', error)
      toast.error('Error al indexar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostic()
  }, [])

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="animate-spin mb-4 flex justify-center">
                <RefreshCw className="h-8 w-8" />
              </div>
              <p>Cargando diagnóstico...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { diagnostics, status } = diagnostic

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Estado del Sistema KMZ</h1>
            <p className="text-slate-600 mt-2">Monitoreo de indexación y estado de búsqueda</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleIndexNow} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Indexar Ahora
            </Button>
            <Button onClick={fetchDiagnostic} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className={status.kmz_files_exist ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Archivos KMZ</p>
                  <p className="text-3xl font-bold">{diagnostics.kmz_collection.total}</p>
                </div>
                {status.kmz_files_exist ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={status.index_populated ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Ubicaciones Indexadas</p>
                  <p className="text-3xl font-bold">{diagnostics.kmz_location_index.total}</p>
                </div>
                {status.index_populated ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={status.ready_to_search ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Listo para Buscar</p>
                  <p className="text-2xl font-bold">{status.ready_to_search ? 'Sí' : 'No'}</p>
                </div>
                {status.ready_to_search ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-2 gap-6">
          {/* KMZ Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Colección KMZ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                <strong>Total:</strong> {diagnostics.kmz_collection.total} archivos
              </p>
              {diagnostics.kmz_collection.samples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Ejemplos:</p>
                  <div className="space-y-2">
                    {diagnostics.kmz_collection.samples.map((sample, i) => (
                      <div key={i} className="text-xs bg-slate-100 p-2 rounded">
                        <p className="font-mono text-slate-700">{sample.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Index */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Índice de Ubicaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                <strong>Total:</strong> {diagnostics.kmz_location_index.total} ubicaciones indexadas
              </p>
              {diagnostics.kmz_location_index.samples.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Ejemplos:</p>
                  <div className="space-y-2">
                    {diagnostics.kmz_location_index.samples.map((sample, i) => (
                      <div key={i} className="text-xs bg-slate-100 p-2 rounded">
                        <p className="font-mono text-slate-700">{sample.location_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    No hay ubicaciones indexadas aún. El sistema debe indexar los archivos KMZ.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            {diagnostics.kmz_collection.total === 0 && (
              <p>• Necesitas cargar archivos KMZ en la Colección</p>
            )}
            {diagnostics.kmz_collection.total > 0 && diagnostics.kmz_location_index.total === 0 && (
              <div>
                <p>• Los KMZ están cargados pero no han sido indexados</p>
                <p>• Ve a /admin/kmz-collection y haz clic en "Indexar Ubicaciones"</p>
              </div>
            )}
            {status.ready_to_search ? (
              <p>• Tu sistema está listo. Ve a /kmz-search para comenzar a buscar.</p>
            ) : (
              <p>• Completa los pasos anteriores para usar la búsqueda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
