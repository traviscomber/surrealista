"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import PropertyFilters from "@/components/properties/property-filters"
import PropertyListView from "@/components/properties/property-list-view"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Grid, List } from 'lucide-react'

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
    features: [] as string[]
  })

  // Update search term from URL params
  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  // Filter properties based on search and filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          property.title.toLowerCase().includes(searchLower) ||
          property.location.toLowerCase().includes(searchLower) ||
          property.description.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(property.type)) {
        return false
      }

      // Location filter
      if (filters.locations.length > 0) {
        const matchesLocation = filters.locations.some(location => 
          property.location.toLowerCase().includes(location.toLowerCase())
        )
        if (!matchesLocation) return false
      }

      // Price range filter
      if (property.price < filters.priceRange[0] || property.price > filters.priceRange[1]) {
        return false
      }

      // Bedrooms filter
      if (filters.bedrooms !== "any") {
        const bedroomCount = parseInt(filters.bedrooms)
        if (property.bedrooms !== bedroomCount) return false
      }

      // Bathrooms filter
      if (filters.bathrooms !== "any") {
        const bathroomCount = parseInt(filters.bathrooms)
        if (property.bathrooms !== bathroomCount) return false
      }

      // Area filters
      if (filters.minArea && property.area < parseInt(filters.minArea)) {
        return false
      }
      if (filters.maxArea && property.area > parseInt(filters.maxArea)) {
        return false
      }

      return true
    })
  }, [properties, searchTerm, filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Encuentra tu Hogar Ideal
            </h1>
            <p className="text-xl opacity-90">
              Descubre las mejores propiedades en el sur de Chile
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por ubicación, tipo de propiedad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <PropertyFilters
              filters={filters}
              onFiltersChange={setFilters}
              properties={properties}
            />
          </div>

          {/* Properties List */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredProperties.length} propiedades encontradas
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <PropertyListView
              properties={filteredProperties}
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  return (
    <Suspense fallback={<div>Cargando propiedades...</div>}>
      <PropertiesContent initialProperties={initialProperties} />
    </Suspense>
  )
}
