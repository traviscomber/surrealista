"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import PropertyFilters from "@/components/properties/property-filters"
import PropertyListView from "@/components/properties/property-list-view"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Grid, List, Database } from "lucide-react"

interface Property {
  id: string
  title: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  type: string
  description: string
  featured: boolean
  status: string
  images: string[]
}

interface PropertiesClientProps {
  initialProperties: Property[]
}

function PropertiesContent({ initialProperties }: PropertiesClientProps) {
  const searchParams = useSearchParams()
  const [properties] = useState<Property[]>(initialProperties)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    types: [] as string[],
    locations: [] as string[],
    priceRange: [0, 500000000] as [number, number],
    bedrooms: "any",
    bathrooms: "any",
    minArea: "",
    maxArea: "",
    features: [] as string[],
  })

  useEffect(() => {
    const search = searchParams.get("search")
    if (search) setSearchTerm(search)
  }, [searchParams])

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          (property.title || "").toLowerCase().includes(searchLower) ||
          (property.location || "").toLowerCase().includes(searchLower) ||
          (property.description || "").toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      if (filters.types.length > 0 && !filters.types.includes(property.type || "")) return false

      if (filters.locations.length > 0) {
        const matchesLocation = filters.locations.some((location) =>
          (property.location || "").toLowerCase().includes(location.toLowerCase()),
        )
        if (!matchesLocation) return false
      }

      const propertyPrice = property.price || 0
      if (propertyPrice > 0 && (propertyPrice < filters.priceRange[0] || propertyPrice > filters.priceRange[1])) return false

      if (filters.bedrooms !== "any") {
        const bedroomCount = Number.parseInt(filters.bedrooms)
        if ((property.bedrooms || 0) !== bedroomCount) return false
      }

      if (filters.bathrooms !== "any") {
        const bathroomCount = Number.parseInt(filters.bathrooms)
        if ((property.bathrooms || 0) !== bathroomCount) return false
      }

      const propertyArea = property.area || 0
      if (filters.minArea && propertyArea < Number.parseInt(filters.minArea)) return false
      if (filters.maxArea && propertyArea > Number.parseInt(filters.maxArea)) return false

      if (filters.features.length > 0) {
        const propertyDescription = (property.description || "").toLowerCase()
        const matchesFeatures = filters.features.some((feature) => propertyDescription.includes(feature.toLowerCase()))
        if (!matchesFeatures) return false
      }

      return true
    })
  }, [properties, searchTerm, filters])

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Inventario comercial"
        title="Propiedades disponibles"
        description="Consulta y filtra registros activos obtenidos desde las fuentes inmobiliarias conectadas al sistema."
        outcome="Podrás identificar propiedades por ubicación, tipo, superficie y precio informado, manteniendo visibles los datos ausentes o no verificados."
      />

      <Card className="border-border/70">
        <CardContent className="p-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por título, ubicación o descripción"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <PropertyFilters filters={filters} onFiltersChange={setFilters} properties={properties} />
        </aside>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <p className="text-sm">
                <span className="font-semibold">{filteredProperties.length}</span>{" "}
                {filteredProperties.length === 1 ? "registro disponible" : "registros disponibles"}
              </p>
            </div>

            <div className="flex gap-2" aria-label="Cambiar vista">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                aria-label="Vista en cuadrícula"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="Vista en lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <PropertyListView properties={filteredProperties} viewMode={viewMode} />
        </section>
      </div>
    </main>
  )
}

export default function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-sm text-muted-foreground">Cargando inventario…</div>}>
      <PropertiesContent initialProperties={initialProperties} />
    </Suspense>
  )
}
