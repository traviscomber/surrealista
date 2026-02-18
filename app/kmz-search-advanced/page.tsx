'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, MapPin, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'

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

  const handleSearch = async () => {
    if (!filters.searchTerm.trim()) {
      toast.error('Por favor ingresa un término de búsqueda')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/kmz/search-advanced?${params}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setStats(data.stats || { total: 0, locations: 0, kmzFiles: 0 })
        toast.success(`Encontrados ${data.stats?.total || 0} resultados`)
      } else {
        toast.error(data.error || 'Error en la búsqueda')
      }
    } catch (error) {
      console.error('[v0] Search error:', error)
      toast.error('Error al realizar la búsqueda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Búsqueda Avanzada de KMZ</h1>
          <p className="text-slate-600 mt-2">Busca ubicaciones con filtros personalizados</p>
        </div>

        {/* Search and Filters */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Criterios de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Término de búsqueda *
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
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
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Ubicaciones</p>
                  <p className="text-3xl font-bold text-green-600">{stats.locations}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
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
              className={`cursor-pointer hover:shadow-lg transition ${
                result.type === 'location'
                  ? 'border-l-4 border-l-green-500'
                  : 'border-l-4 border-l-blue-500'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
