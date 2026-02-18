'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Search, Calendar, Layers, Download } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function KMZSearchAdvanced() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Get available filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/kmz/filters')
        const data = await response.json()
        setRegions(data.regions || [])
        setCategories(data.categories || [])
      } catch (error) {
        console.error('[v0] Error fetching filters:', error)
      }
    }

    fetchFilters()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchTerm.trim() && !selectedRegion && !selectedCategory) {
      toast.error('Ingresa al menos un criterio de búsqueda')
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('q', searchTerm)
      if (selectedRegion) params.append('region', selectedRegion)
      if (selectedCategory) params.append('category', selectedCategory)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/kmz/search-advanced?${params}`)
      const data = await response.json()

      setResults(data)

      const total =
        (data.results?.locations?.length || 0) +
        (data.results?.kmzFiles?.length || 0)

      if (total === 0) {
        toast.info('No se encontraron resultados')
      } else {
        toast.success(`Encontrados ${total} resultado(s)`)
      }
    } catch (error) {
      console.error('[v0] Search error:', error)
      toast.error('Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Búsqueda Avanzada de KMZ</h1>
          </div>
          <p className="text-blue-100">Encuentra archivos KMZ con filtros específicos</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Term */}
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar por término</label>
                <Input
                  type="text"
                  placeholder="Nombre, región, ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Region Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Región</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las regiones</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Rango de fechas</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-10 flex-1"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-10 flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedRegion('')
                    setSelectedCategory('')
                    setDateFrom('')
                    setDateTo('')
                    setHasSearched(false)
                    setResults(null)
                  }}
                >
                  Limpiar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && results && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {results.results?.locations?.length || 0}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Ubicaciones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {results.results?.kmzFiles?.length || 0}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Archivos KMZ</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {((results.results?.locations?.length || 0) + (results.results?.kmzFiles?.length || 0))}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Locations Results */}
            {results.results?.locations && results.results.locations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Ubicaciones ({results.results.locations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.results.locations.map((loc: any) => (
                    <div key={loc.id} className="p-3 border rounded-lg hover:bg-slate-50">
                      <h4 className="font-semibold">{loc.name}</h4>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {loc.region && <Badge variant="secondary">{loc.region}</Badge>}
                        {loc.city && <Badge variant="secondary">{loc.city}</Badge>}
                      </div>
                      {loc.description && <p className="text-sm text-slate-600 mt-2">{loc.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* KMZ Files Results */}
            {results.results?.kmzFiles && results.results.kmzFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-600" />
                    Archivos KMZ ({results.results.kmzFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.results.kmzFiles.map((kmz: any) => (
                    <div key={kmz.id} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{kmz.file_name}</h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {kmz.region && <Badge>{kmz.region}</Badge>}
                            {kmz.category && <Badge variant="secondary">{kmz.category}</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {kmz.placemarks_count} ubicaciones • Creado: {new Date(kmz.created_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {(!results.results?.locations?.length && !results.results?.kmzFiles?.length) && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-900 font-semibold">No se encontraron resultados</p>
                  <p className="text-sm text-slate-600 mt-2">Intenta ajustar los filtros de búsqueda</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                Usa los filtros anteriores para buscar archivos KMZ por región, categoría, término o fecha.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
