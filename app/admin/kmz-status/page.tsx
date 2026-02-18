import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, MapPin, BarChart3, TrendingUp } from 'lucide-react'
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
  const avgLocationsPerKMZ = diagnostics.kmz_collection.total > 0 
    ? Math.round(diagnostics.kmz_location_index.total / diagnostics.kmz_collection.total)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Panel de Control KMZ</h1>
            <p className="text-slate-600 mt-2">Monitoreo en tiempo real del sistema de búsqueda</p>
          </div>
          <Button onClick={fetchDiagnostic} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className={status.kmz_files_exist ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Archivos KMZ</p>
                  <p className="text-3xl font-bold mt-2">{diagnostics.kmz_collection.total}</p>
                </div>
                {status.kmz_files_exist ? (
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={status.index_populated ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Ubicaciones</p>
                  <p className="text-3xl font-bold mt-2">{diagnostics.kmz_location_index.total}</p>
                </div>
                {status.index_populated ? (
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Promedio</p>
                  <p className="text-3xl font-bold mt-2">{avgLocationsPerKMZ}</p>
                  <p className="text-xs text-slate-600 mt-1">ubicaciones/KMZ</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className={status.ready_to_search ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Estado</p>
                  <p className="text-lg font-bold mt-2">{status.ready_to_search ? 'Listo' : 'Incompleto'}</p>
                </div>
                {status.ready_to_search ? (
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-3 gap-6">
          {/* KMZ Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Colección KMZ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4">
                <p className="text-sm text-slate-600">Archivos cargados</p>
                <p className="text-2xl font-bold text-slate-900">{diagnostics.kmz_collection.total}</p>
              </div>
              {diagnostics.kmz_collection.samples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Archivos recientes:</p>
                  <div className="space-y-2">
                    {diagnostics.kmz_collection.samples.slice(0, 3).map((sample, i) => (
                      <div key={i} className="text-xs bg-slate-100 p-2 rounded border-l-2 border-blue-400">
                        <p className="font-mono text-slate-700 truncate">{sample.name}</p>
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Ubicaciones Indexadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 rounded-lg p-4">
                <p className="text-sm text-slate-600">Total indexadas</p>
                <p className="text-2xl font-bold text-slate-900">{diagnostics.kmz_location_index.total}</p>
              </div>
              {diagnostics.kmz_location_index.samples.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Ejemplos de ubicaciones:</p>
                  <div className="space-y-2">
                    {diagnostics.kmz_location_index.samples.slice(0, 3).map((sample, i) => (
                      <div key={i} className="text-xs bg-slate-100 p-2 rounded border-l-2 border-green-400">
                        <p className="font-mono text-slate-700 truncate">{sample.location_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800 font-semibold">Indexación pendiente</p>
                  <p className="text-xs text-yellow-700 mt-1">Carga KMZ para comenzar la indexación automática</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                  <span className="text-xs text-slate-600">Ratio indexación</span>
                  <span className="font-bold">{Math.round((diagnostics.kmz_location_index.total / (diagnostics.kmz_collection.total * avgLocationsPerKMZ || 1)) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                  <span className="text-xs text-slate-600">Última actualización</span>
                  <span className="font-mono text-xs">{new Date(diagnostic.timestamp).toLocaleTimeString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                  <span className="text-xs text-slate-600">Sistema</span>
                  <span className="font-bold text-green-600">Operativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-lg">Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnostics.kmz_collection.total === 0 && (
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">1. Cargar archivos KMZ</p>
                <p>Ve a <strong>/admin/kmz-collection</strong> y carga tus archivos KMZ desde Google Drive u offline</p>
              </div>
            )}
            {diagnostics.kmz_collection.total > 0 && diagnostics.kmz_location_index.total === 0 && (
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">2. Indexar ubicaciones</p>
                <p>Los archivos se indexan automáticamente, pero puedes forzar la indexación en el administrador</p>
              </div>
            )}
            {status.ready_to_search && (
              <div className="text-sm text-green-900 bg-green-50 border border-green-200 rounded p-3">
                <p className="font-semibold mb-1">✓ Sistema listo</p>
                <p>Tu sistema está completamente configurado. Ahora puedes:</p>
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• Ve a <strong>/kmz-search</strong> para búsqueda simple</li>
                  <li>• Ve a <strong>/kmz-search-advanced</strong> para búsqueda con filtros</li>
                  <li>• Ve a <strong>/kmz-map</strong> para ver ubicaciones en mapa</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
