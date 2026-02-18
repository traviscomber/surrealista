"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface KMZLocation {
  id: string
  location_name: string
  region?: string
  coordinates?: { lat: number; lng: number }
  kmz_files: Array<{
    id: string
    name: string
    file_url: string
  }>
}

export default function KMZSearchSimple() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<KMZLocation[]>([])
  const [loading, setLoading] = useState(false)

  // Get diagnostic info
  const { data: diagnostic } = useSWR("/api/kmz/diagnostic", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      toast.error("Ingresa un término de búsqueda")
      return
    }

    setLoading(true)
    setHasSearched(true)
    console.log("[v0] Searching for:", searchTerm)

    try {
      const response = await fetch(`/api/kmz/search?q=${encodeURIComponent(searchTerm)}&type=location`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        if (!data.results || data.results.length === 0) {
          toast.info("No se encontraron ubicaciones con ese término")
        } else {
          toast.success(`Se encontraron ${data.results.length} ubicaciones`)
        }
      } else {
        toast.error(data.error || "Error en la búsqueda")
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
      toast.error("Error al buscar")
    } finally {
      setLoading(false)
    }
  }

  const isIndexed = (diagnostic?.indexedLocations || 0) > 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Búsqueda de Ubicaciones</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Busca cualquier ubicación en tu colección de {diagnostic?.totalKmzFiles || "..."} archivos KMZ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Box */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Busca una ubicación: Centro, Parque, Mercado, Calle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-4 pr-12 text-base"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={loading || !searchTerm.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-sm text-slate-600">
                Indexadas: <strong>{diagnostic?.indexedLocations || 0}</strong> ubicaciones
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {results.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    {results.length} {results.length === 1 ? "Ubicación" : "Ubicaciones"} Encontrada{results.length === 1 ? "" : "s"}
                  </h2>
                </div>

                {results.map((location) => (
                  <Card key={location.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            {location.location_name}
                          </CardTitle>
                          {location.region && (
                            <p className="text-sm text-slate-600 mt-1">Región: {location.region}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {location.coordinates && (
                        <p className="text-xs text-slate-500">
                          Coordenadas: {location.coordinates.lat?.toFixed(4)}, {location.coordinates.lng?.toFixed(4)}
                        </p>
                      )}

                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Encontrada en {location.kmz_files.length} archivo(s):</p>
                        <div className="space-y-2">
                          {location.kmz_files.map((kmz) => (
                            <div
                              key={kmz.id}
                              className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200"
                            >
                              <span className="text-sm font-medium text-slate-700 truncate">{kmz.name}</span>
                              <a
                                href={kmz.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-600" />
                  <p className="text-slate-900 font-semibold">No se encontraron ubicaciones</p>
                  <p className="text-sm text-slate-600 mt-2">
                    Intenta con otro término de búsqueda o verifica que el sistema esté indexado
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Cómo Funciona</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-900 space-y-3">
                <p>✓ Ingresa el nombre de cualquier ubicación que busques</p>
                <p>✓ El sistema busca en todos tus archivos KMZ indexados</p>
                <p>✓ Ve todos los archivos que contienen esa ubicación</p>
                <p>✓ Accede directamente a los archivos KMZ desde aquí</p>
              </CardContent>
            </Card>

            {!isIndexed && (
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Indexación en Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-orange-900">
                  <p>El sistema está indexando tus archivos KMZ.</p>
                  <p className="mt-2">Progreso: {diagnostic?.indexedLocations || 0} ubicaciones indexadas</p>
                  <p className="mt-2">Vuelve en unos minutos para comenzar a buscar.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
