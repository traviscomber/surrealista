"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Search, Loader, AlertCircle, Files } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { KMZLocationSearch } from "@/lib/kmz/kmz-location-search"

interface LocationResult {
  id: string
  name: string
  type: "Point" | "LineString" | "Polygon"
  region: string
  kmz_file_name: string
  kmz_file_url: string
  coordinates_preview: string
}

interface KMZGrouped {
  fileName: string
  fileUrl: string
  locationCount: number
  locations: LocationResult[]
}

export function KMZLocationSearchComponent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"location" | "region" | "kmz">("location")
  const [results, setResults] = useState<LocationResult[]>([])
  const [groupedResults, setGroupedResults] = useState<KMZGrouped[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalLocations, setTotalLocations] = useState(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    // Load statistics on mount
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const { count } = await supabase
        .from("kmz_location_index")
        .select("*", { count: "exact", head: true })

      setTotalLocations(count || 0)
    } catch (err) {
      console.error("[v0] Error loading statistics:", err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Ingresa un término de búsqueda")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Searching KMZ locations:", { query: searchQuery, type: searchType })

      let searchResults: LocationResult[] = []

      if (searchType === "location") {
        searchResults = await KMZLocationSearch.searchByName(searchQuery)
      } else if (searchType === "region") {
        searchResults = await KMZLocationSearch.searchByRegion(searchQuery)
      } else if (searchType === "kmz") {
        searchResults = await KMZLocationSearch.searchByKMZFile(searchQuery)
      }

      console.log("[v0] Search returned", searchResults.length, "results")

      setResults(searchResults)

      // Group by KMZ file
      const grouped = groupByKMZFile(searchResults)
      setGroupedResults(grouped)
    } catch (err: any) {
      console.error("[v0] Search error:", err)
      setError(err?.message || "Error en la búsqueda")
    } finally {
      setLoading(false)
    }
  }

  const groupByKMZFile = (locations: LocationResult[]): KMZGrouped[] => {
    const grouped = new Map<string, KMZGrouped>()

    for (const location of locations) {
      if (!grouped.has(location.kmz_file_url)) {
        grouped.set(location.kmz_file_url, {
          fileName: location.kmz_file_name,
          fileUrl: location.kmz_file_url,
          locationCount: 0,
          locations: [],
        })
      }

      const group = grouped.get(location.kmz_file_url)!
      group.locationCount++
      group.locations.push(location)
    }

    return Array.from(grouped.values()).sort((a, b) => b.locationCount - a.locationCount)
  }

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "Point":
        return "bg-blue-100 text-blue-800"
      case "LineString":
        return "bg-purple-100 text-purple-800"
      case "Polygon":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Búsqueda de Ubicaciones KMZ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Busca una ubicación, región o archivo KMZ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="location">Por Ubicación</TabsTrigger>
                <TabsTrigger value="region">Por Región</TabsTrigger>
                <TabsTrigger value="kmz">Por Archivo</TabsTrigger>
              </TabsList>
            </Tabs>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalLocations}</div>
              <div className="text-sm text-gray-600">Ubicaciones Indexadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{groupedResults.length}</div>
              <div className="text-sm text-gray-600">Archivos KMZ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {groupedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados ({results.length} ubicaciones en {groupedResults.length} archivo{groupedResults.length !== 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedResults.map((kmzGroup) => (
              <Card key={kmzGroup.fileUrl} className="border-l-4 border-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="font-semibold flex items-center gap-2">
                        <Files className="h-4 w-4" />
                        {kmzGroup.fileName}
                      </div>
                      <div className="text-sm text-gray-600 break-all">{kmzGroup.fileUrl}</div>
                    </div>
                    <Badge variant="secondary">{kmzGroup.locationCount} ubicaciones</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {kmzGroup.locations.map((location) => (
                      <div key={location.id} className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{location.name}</span>
                          <Badge className={getLocationTypeColor(location.type)}>{location.type}</Badge>
                        </div>
                        <div className="text-gray-600">Región: {location.region}</div>
                        <div className="text-xs text-gray-500 font-mono">{location.coordinates_preview}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && searchQuery && results.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron resultados para "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Intenta con otro término de búsqueda o región</p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!loading && !searchQuery && (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Busca ubicaciones en archivos KMZ</p>
            <p className="text-sm text-gray-500 mt-2">
              Tenemos {totalLocations} ubicaciones indexadas listas para buscar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
