'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, MapPin, FileText, Calendar, Map } from 'lucide-react'
import { toast } from 'sonner'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'

interface SearchResult {
  id: string
  name: string
  type: 'location' | 'kmz'
  description?: string
  region?: string
  city?: string
  createdAt?: string
  kmzFileName?: string
  locationsCount?: number
}

interface Filters {
  searchTerm: string
  region: string
  category: string
  dateFrom: string
  dateTo: string
}

export default function KMZSearchAdvanced() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    region: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, locations: 0, kmzFiles: 0 })
  const [autoSearchTimeout, setAutoSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Auto-search cuando cambian los filtros (con debounce de 500ms)
  useEffect(() => {
    if (autoSearchTimeout) clearTimeout(autoSearchTimeout)

    const timeout = setTimeout(() => {
      if (filters.searchTerm.trim() || filters.region.trim() || filters.category || filters.dateFrom || filters.dateTo) {
        performSearch(filters)
      }
    }, 500)

    setAutoSearchTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [filters])

  const performSearch = async (searchFilters: Filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/kmz/search-advanced?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'No se pudo completar la búsqueda.')
      const nextResults = data.results || []
      const nextStats = data.stats || { total: nextResults.length, locations: 0, kmzFiles: 0 }
      setResults(nextResults)
      setStats(nextStats)
      return Number(nextStats.total || 0)
    } catch (error) {
      console.error('[kmz-search-advanced] Search error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    // Check if at least one filter is provided
    const hasFilters = filters.searchTerm.trim() || filters.region.trim() || filters.category || filters.dateFrom || filters.dateTo
    
    if (!hasFilters) {
      toast.error('Por favor ingresa al menos un criterio de búsqueda')
      return
    }

    const total = await performSearch(filters)
    if (total !== null) toast.success(`Encontrados ${total} resultados`)
    else toast.error('No se pudo completar la búsqueda.')
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Campos · Herramientas"
        title="Búsqueda avanzada"
        description="Combina criterios para acotar el inventario KMZ sin salir del contexto operativo de Campos."
        outcome="Reduce el universo y abre sólo los resultados que necesiten revisión."
      />

        {/* Search and Filters */}
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Criterios de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Término de búsqueda
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre, descripción, región..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters({ ...filters, searchTerm: e.target.value })
                    }
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading} className="gap-2">
                    <Search className="h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Región
                </label>
                <Input
                  placeholder="Ej: Los Lagos, Osorno..."
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Categoría
                </label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">Todas</option>
                  <option value="kmz_collection">Colección</option>
                  <option value="property_documents">Documentos</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Desde
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hasta
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/70 bg-card shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Ubicaciones</p>
                  <p className="text-3xl font-bold text-green-600">{stats.locations}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card shadow-none">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Archivos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.kmzFiles}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {results.length === 0 && !loading && (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="pt-6 text-center text-slate-600">
                Realiza una búsqueda para ver resultados
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="bg-slate-50">
              <CardContent className="pt-6 text-center">
                <div className="animate-spin inline-block">
                  <Search className="h-6 w-6" />
                </div>
                <p className="mt-2">Buscando...</p>
              </CardContent>
            </Card>
          )}

          {results.map((result) => (
            <Card
              key={result.id}
              className="border-border/70 shadow-none transition-colors hover:bg-secondary/35"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {result.type === 'location' ? (
                        <MapPin className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                      <h3 className="text-lg font-semibold text-slate-900">
                        {result.name}
                      </h3>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                        {result.type === 'location' ? 'Ubicación' : 'Archivo'}
                      </span>
                    </div>

                    {result.description && (
                      <p className="text-sm text-slate-600 mb-2">{result.description}</p>
                    )}

                    <div className="flex gap-4 text-xs text-slate-600 flex-wrap">
                      {result.region && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.region}
                        </div>
                      )}
                      {result.city && (
                        <div className="flex items-center gap-1">
                          {result.city}
                        </div>
                      )}
                      {result.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.createdAt).toLocaleDateString('es-CL')}
                        </div>
                      )}
                      {result.locationsCount && (
                        <div className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          {result.locationsCount} ubicaciones
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  {result.type === 'kmz' && (
                    <Button
                      onClick={() => router.push(`/kmz-map?kmzId=${result.id}`)}
                      className="flex-shrink-0"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      Ver en Mapa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </main>
  )
}
