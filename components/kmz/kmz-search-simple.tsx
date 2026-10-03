"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, ExternalLink, Loader2, FileText, Folder } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function KMZSearchSimple() {
  const [searchTerm, setSearchTerm] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<any>(null)
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
      const response = await fetch(`/api/kmz/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data)
        const total = (data.summary?.locationsFound || 0) + (data.summary?.kmzCollectionFound || 0) + (data.summary?.propertyDocsFound || 0)
        
        if (total === 0) {
          toast.info("No se encontraron resultados")
        } else {
          toast.success(`Encontrados ${total} resultado(s)`)
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
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Campos · Herramientas"
        title="Búsqueda KMZ"
        description="Busca en la colección, documentos y ubicaciones indexadas desde una sola vista."
        outcome="Encuentra el registro correcto y continúa desde Campos."
      />

      <div className="max-w-5xl space-y-6">
        {/* Search Box */}
        <Card className="border-border/70 shadow-none">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Busca una ubicación, región o nombre de archivo..."
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
              <p className="text-sm text-muted-foreground">
                Indexadas: <strong>{diagnostic?.indexedLocations || 0}</strong> ubicaciones en <strong>{diagnostic?.kmzCount || 0}</strong> archivos
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && results && (
          <div className="space-y-6">
            {/* Summary */}
            {(results.summary?.locationsFound || results.summary?.kmzCollectionFound || results.summary?.propertyDocsFound) > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{results.summary?.locationsFound || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">Ubicaciones Encontradas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{results.summary?.kmzCollectionFound || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">En Colección KMZ</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{results.summary?.propertyDocsFound || 0}</p>
                    <p className="text-sm text-muted-foreground mt-2">En Documentos</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Locations Results */}
            {results.results?.locations && results.results.locations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ubicaciones Encontradas ({results.results.locations.length})
                </h2>
                {results.results.locations.map((location: any) => (
                  <Card key={location.id} className="border-border/70 shadow-none transition-colors hover:bg-secondary/35">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{location.name}</h3>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {location.region && <Badge variant="secondary">{location.region}</Badge>}
                            {location.city && <Badge variant="secondary">{location.city}</Badge>}
                            {location.type && <Badge>{location.type}</Badge>}
                          </div>
                          {location.address && (
                            <p className="text-sm text-muted-foreground mt-2">{location.address}</p>
                          )}
                          {location.latitude && location.longitude && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          {location.kmz_file && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">En archivo:</p>
                              <p className="text-sm font-medium text-foreground">{location.kmz_file.file_name}</p>
                            </div>
                          )}
                          <div className="flex gap-2 justify-end">
                            {location.kmz_id && (
                              <Button asChild size="sm" variant="outline" className="gap-2">
                                <Link href={`/campos?kmz=${location.kmz_id}`}>
                                  <MapPin className="h-4 w-4" />
                                  Abrir en Campos
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* KMZ Collection Results */}
            {results.results?.kmzCollection && results.results.kmzCollection.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" />
                  Archivos en Colección KMZ ({results.results.kmzCollection.length})
                </h2>
                <div className="grid gap-3">
                  {results.results.kmzCollection.map((kmz: any) => (
                    <Card key={kmz.id} className="border-border/70 shadow-none transition-colors hover:bg-secondary/35">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">{kmz.file_name}</h3>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {kmz.region && <Badge variant="secondary">{kmz.region}</Badge>}
                              {kmz.category && <Badge>{kmz.category}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Creado: {new Date(kmz.created_at).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button asChild size="sm" variant="outline" className="gap-2">
                              <Link href={`/campos?kmz=${kmz.id}`}>
                                <MapPin className="h-4 w-4" />
                                Abrir en Campos
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Property Documents Results */}
            {results.results?.propertyDocuments && results.results.propertyDocuments.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Archivos en Documentos ({results.results.propertyDocuments.length})
                </h2>
                <div className="grid gap-3">
                  {results.results.propertyDocuments.map((doc: any) => (
                    <Card key={doc.id} className="border-border/70 shadow-none transition-colors hover:bg-secondary/35">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold">{doc.title || doc.file_name}</h3>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary">{doc.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Creado: {new Date(doc.created_at).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                          {doc.file_url && (
                            <Button asChild size="icon" variant="outline">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${doc.title || doc.file_name}`}>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!results.results?.locations?.length && !results.results?.kmzCollection?.length && !results.results?.propertyDocuments?.length && (
              <Card className="border-border/70 bg-secondary/25 shadow-none">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="text-foreground font-semibold">No se encontraron resultados</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Intenta con otro término de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="space-y-4">
            <Card className="border-border/70 bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-foreground">Busca en Tres Fuentes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground space-y-3">
                <p>✓ <strong>Ubicaciones Indexadas:</strong> Placemarks dentro de archivos KMZ</p>
                <p>✓ <strong>Colección KMZ:</strong> Archivos principales de la colección</p>
                <p>✓ <strong>Documentos:</strong> Archivos KMZ en comunicaciones y documentación</p>
              </CardContent>
            </Card>

            {!isIndexed && (
              <Card className="border-border/70 bg-secondary/25 shadow-none">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Indexación en Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground">
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
