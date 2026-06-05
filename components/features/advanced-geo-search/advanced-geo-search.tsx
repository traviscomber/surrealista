'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MapPin, Search, Filter, AlertCircle } from 'lucide-react'

interface AdvancedGeoSearchProps {
  onSearch?: (filters: GeoSearchFilters) => void
}

interface GeoSearchFilters {
  centerLat: number
  centerLng: number
  radiusKm: number
  keywords: string[]
  accessWater: boolean
  accessRoad: boolean
  priceMin?: number
  priceMax?: number
}

export function AdvancedGeoSearch({ onSearch }: AdvancedGeoSearchProps) {
  const [filters, setFilters] = useState<GeoSearchFilters>({
    centerLat: -33.8688,
    centerLng: -71.5193,
    radiusKm: 5,
    keywords: [],
    accessWater: false,
    accessRoad: false,
  })

  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleAddKeyword = () => {
    if (keyword.trim() && !filters.keywords.includes(keyword)) {
      setFilters({
        ...filters,
        keywords: [...filters.keywords, keyword],
      })
      setKeyword('')
    }
  }

  const handleRemoveKeyword = (kw: string) => {
    setFilters({
      ...filters,
      keywords: filters.keywords.filter((k) => k !== kw),
    })
  }

  const handleSearch = async () => {
    setSearching(true)
    try {
      console.log('Searching with filters:', filters)
      onSearch?.(filters)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <MapPin className="h-5 w-5" />
            Búsqueda Geográfica Avanzada
          </CardTitle>
          <CardDescription className="text-blue-800">
            Busca propiedades por ubicación, radio de cobertura y características especiales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Coordenadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-sm font-medium">
                  Latitud
                </Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={filters.centerLat}
                  onChange={(e) =>
                    setFilters({ ...filters, centerLat: parseFloat(e.target.value) })
                  }
                  placeholder="Ej: -33.8688"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-sm font-medium">
                  Longitud
                </Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={filters.centerLng}
                  onChange={(e) =>
                    setFilters({ ...filters, centerLng: parseFloat(e.target.value) })
                  }
                  placeholder="Ej: -71.5193"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius" className="text-sm font-medium">
                  Radio (km)
                </Label>
                <Input
                  id="radius"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={filters.radiusKm}
                  onChange={(e) =>
                    setFilters({ ...filters, radiusKm: parseFloat(e.target.value) })
                  }
                  placeholder="Ej: 5"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Palabras Clave */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Palabras Clave
              </Label>
              <div className="flex gap-2">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword()
                    }
                  }}
                  placeholder="Ej: viña, volcán, frutales, cultivo..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddKeyword}
                  variant="outline"
                  size="sm"
                >
                  Agregar
                </Button>
              </div>

              {filters.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {filters.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => handleRemoveKeyword(kw)}
                    >
                      {kw}
                      <span className="ml-1 text-xs">✕</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Características */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  id="water"
                  checked={filters.accessWater}
                  onChange={(e) =>
                    setFilters({ ...filters, accessWater: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="water" className="text-sm font-medium cursor-pointer flex-1">
                  Acceso a Agua
                </label>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  id="road"
                  checked={filters.accessRoad}
                  onChange={(e) =>
                    setFilters({ ...filters, accessRoad: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="road" className="text-sm font-medium cursor-pointer flex-1">
                  Acceso a Camino
                </label>
              </div>
            </div>

            {/* Rango de Precio (Opcional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-min" className="text-sm font-medium">
                  Precio Mín. (UF)
                </Label>
                <Input
                  id="price-min"
                  type="number"
                  step="100"
                  placeholder="Opcional"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceMin: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-max" className="text-sm font-medium">
                  Precio Máx. (UF)
                </Label>
                <Input
                  id="price-max"
                  type="number"
                  step="100"
                  placeholder="Opcional"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceMax: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Info Message */}
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Tip:</strong> Arrastra el mapa para centrar la búsqueda en una nueva ubicación
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {searching ? 'Buscando...' : 'Buscar Propiedades'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados Placeholder */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({results.length} encontrados)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Se mostrarán aquí las propiedades encontradas</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
