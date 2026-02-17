"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface LocationResult {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  address: string
  region: string
  city: string
  kmz_id: string
  searchable_text: string
}

interface KMZInfo {
  id: string
  file_name: string
  placemarks_count: number
  region: string
  category: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function KMZSearchResults() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"location" | "region" | "file">("location")
  const [hasSearched, setHasSearched] = useState(false)

  const { data: results, isLoading, error } = useSWR(
    hasSearched && searchTerm
      ? `/api/kmz/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`
      : null,
    fetcher
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      toast.error("Ingresa un término de búsqueda")
      return
    }
    console.log("[v0] Search initiated:", { term: searchTerm, type: searchType })
    setHasSearched(true)
  }

  const handleStartIndexing = async () => {
    try {
      console.log("[v0] Starting KMZ indexing from search page...")
      const response = await fetch("/api/admin/kmz/mass-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })

      if (response.ok) {
        toast.success("Indexación iniciada. Vuelve aquí en unos minutos para buscar.")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al iniciar indexación")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast.error("Error al iniciar indexación")
    }
  }

  const groupByKMZ = (locations: LocationResult[]) => {
    const grouped: Record<string, LocationResult[]> = {}
    locations.forEach((loc) => {
      if (!grouped[loc.kmz_id]) {
        grouped[loc.kmz_id] = []
      }
      grouped[loc.kmz_id].push(loc)
    })
    return grouped
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Búsqueda de Ubicaciones en KMZ</h1>
          <p className="text-slate-600">
            Busca en más de 180 archivos KMZ para encontrar ubicaciones específicas
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Ubicaciones</CardTitle>
            <CardDescription>Encuentra ubicaciones en todos tus archivos KMZ indexados</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Ej: Centro, Parque, Calle Principal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="px-4 py-2 border rounded-md"
                >
                  <option value="location">Ubicación</option>
                  <option value="region">Región</option>
                  <option value="file">Archivo</option>
                </select>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  <Search className="h-4 w-4" />
                  {isLoading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-slate-500">
                    <p>Buscando en tus archivos KMZ...</p>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p>Error en la búsqueda: {error.message}</p>
                </CardContent>
              </Card>
            ) : results && results.locations && results.locations.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900">
                    <strong>Se encontraron {results.locations.length} ubicaciones</strong> en{" "}
                    <strong>{Object.keys(groupByKMZ(results.locations)).length} archivos KMZ</strong>
                  </p>
                </div>

                {Object.entries(groupByKMZ(results.locations)).map(([kmzId, locations]) => (
                  <Card key={kmzId}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {results.kmzFiles?.[kmzId]?.file_name || `KMZ ${kmzId.slice(0, 8)}`}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {locations.length} ubicaciones encontradas
                          </CardDescription>
                        </div>
                        {results.kmzFiles?.[kmzId] && (
                          <div className="text-right">
                            <Badge>{results.kmzFiles[kmzId].region}</Badge>
                            <p className="text-xs text-slate-500 mt-2">
                              {results.kmzFiles[kmzId].placemarks_count} placemarks total
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {locations.map((location) => (
                          <div
                            key={location.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{location.name}</h4>
                                {location.address && (
                                  <p className="text-sm text-slate-600 mt-1">{location.address}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {location.type}
                                  </Badge>
                                  {location.city && (
                                    <Badge variant="outline" className="text-xs">
                                      {location.city}
                                    </Badge>
                                  )}
                                  {location.region && (
                                    <Badge variant="outline" className="text-xs">
                                      {location.region}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-end gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <div className="text-right text-xs text-slate-500">
                                  <p>{location.latitude.toFixed(4)}</p>
                                  <p>{location.longitude.toFixed(4)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-amber-600" />
                  <p className="text-slate-900 font-semibold">No se encontraron ubicaciones</p>
                  <p className="text-sm text-slate-600 mt-2">
                    Esto puede significar que las ubicaciones aún no han sido indexadas. 
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    Intenta otro término o inicia el proceso de indexación.
                  </p>
                  <Button 
                    onClick={handleStartIndexing}
                    className="mt-4"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Indexar Ubicaciones KMZ
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-semibold text-slate-900">Busca en tus archivos KMZ</p>
                <p className="text-sm text-slate-600 mt-2">
                  Ingresa un término de búsqueda para encontrar ubicaciones en tus archivos indexados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Primer Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-900">
                  Para empezar a buscar ubicaciones, primero necesitas indexar tus archivos KMZ:
                </p>
                <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                  <li>Haz clic en el botón de abajo para indexar todos tus archivos KMZ</li>
                  <li>El proceso se ejecuta en background (puede tardar unos minutos)</li>
                  <li>Vuelve aquí cuando esté listo para comenzar a buscar</li>
                </ol>
                <Button 
                  onClick={handleStartIndexing}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Iniciar Indexación Ahora
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
