"use client"

import type React from "react"
import LeafletMap from "@/components/maps/leaflet-map" // Import LeafletMap component

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { KMZReader } from "@/lib/kmz/kmz-reader"
import {
  MapPin,
  Home,
  Building,
  TreePine,
  Filter,
  Eye,
  Heart,
  Share2,
  Phone,
  DollarSign,
  Bed,
  Bath,
  Square,
  Upload,
  FileText,
  Layers,
} from "lucide-react"

interface Property {
  id: string
  title: string
  type: "casa" | "departamento" | "terreno" | "comercial"
  price: number
  location: {
    city: string
    region: string
    coordinates: [number, number]
  }
  features: {
    bedrooms?: number
    bathrooms?: number
    area: number
  }
  description: string
  image: string
  featured: boolean
}

interface KMZData {
  fileName: string
  coordinates: Array<[number, number]>
  rolNumbers: string[]
  properties: any[]
}

const mockProperties: Property[] = [
  {
    id: "1",
    title: "Casa con Vista al Lago Llanquihue",
    type: "casa",
    price: 850000000,
    location: {
      city: "Puerto Varas",
      region: "Los Lagos",
      coordinates: [-41.3317, -72.9828],
    },
    features: {
      bedrooms: 4,
      bathrooms: 3,
      area: 280,
    },
    description: "Hermosa casa con vista panorámica al lago y volcanes",
    image: "/images/property-puerto-varas.png",
    featured: true,
  },
  {
    id: "2",
    title: "Cabaña Turística en Pucón",
    type: "casa",
    price: 450000000,
    location: {
      city: "Pucón",
      region: "Araucanía",
      coordinates: [-39.2706, -71.9443],
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
    },
    description: "Cabaña ideal para turismo con acceso directo al lago",
    image: "/images/property-pucon.png",
    featured: false,
  },
  {
    id: "3",
    title: "Terreno Forestal en Valdivia",
    type: "terreno",
    price: 1200000000,
    location: {
      city: "Valdivia",
      region: "Los Ríos",
      coordinates: [-39.8142, -73.2459],
    },
    features: {
      area: 5000,
    },
    description: "Amplio terreno forestal con potencial de conservación",
    image: "/images/property-valdivia.png",
    featured: true,
  },
  {
    id: "4",
    title: "Departamento Frente al Mar en Frutillar",
    type: "departamento",
    price: 320000000,
    location: {
      city: "Frutillar",
      region: "Los Lagos",
      coordinates: [-41.1281, -73.0306],
    },
    features: {
      bedrooms: 2,
      bathrooms: 2,
      area: 95,
    },
    description: "Moderno departamento con vista al lago y montañas",
    image: "/images/property-frutillar.png",
    featured: false,
  },
  {
    id: "5",
    title: "Casa Patrimonial en Osorno",
    type: "casa",
    price: 680000000,
    location: {
      city: "Osorno",
      region: "Los Lagos",
      coordinates: [-40.5736, -73.1353],
    },
    features: {
      bedrooms: 5,
      bathrooms: 4,
      area: 350,
    },
    description: "Casa histórica restaurada en el centro de la ciudad",
    image: "/images/property-osorno.png",
    featured: false,
  },
  {
    id: "6",
    title: "Terreno Costero en Chiloé",
    type: "terreno",
    price: 890000000,
    location: {
      city: "Castro",
      region: "Los Lagos",
      coordinates: [-42.4827, -73.7615],
    },
    features: {
      area: 2500,
    },
    description: "Terreno con acceso directo al mar y vista panorámica",
    image: "/images/property-chiloe.png",
    featured: true,
  },
]

export function InteractiveMap() {
  const [properties] = useState<Property[]>(mockProperties)
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [filters, setFilters] = useState({
    type: "all",
    priceRange: "all",
    region: "all",
    search: "",
  })
  const [kmzData, setKmzData] = useState<KMZData[]>([])
  const [showKmzOverlay, setShowKmzOverlay] = useState(true)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    let filtered = properties

    if (newFilters.type !== "all") {
      filtered = filtered.filter((p) => p.type === newFilters.type)
    }

    if (newFilters.region !== "all") {
      filtered = filtered.filter((p) => p.location.region === newFilters.region)
    }

    if (newFilters.priceRange !== "all") {
      const [min, max] = newFilters.priceRange.split("-").map(Number)
      filtered = filtered.filter((p) => p.price >= min && (max ? p.price <= max : true))
    }

    if (newFilters.search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(newFilters.search.toLowerCase()) ||
          p.location.city.toLowerCase().includes(newFilters.search.toLowerCase()) ||
          p.description.toLowerCase().includes(newFilters.search.toLowerCase()),
      )
    }

    setFilteredProperties(filtered)
  }

  const handleKmzUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const kmzReader = new KMZReader()
    const newKmzData: KMZData[] = []

    for (const file of Array.from(files)) {
      try {
        const result = await kmzReader.readKMZ(file)
        newKmzData.push({
          fileName: file.name,
          coordinates: result.coordinates,
          rolNumbers: result.rolNumbers,
          properties: result.placemarks,
        })
      } catch (error) {
        console.error(`Error reading KMZ file ${file.name}:`, error)
      }
    }

    setKmzData([...kmzData, ...newKmzData])
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "casa":
        return <Home className="h-4 w-4" />
      case "departamento":
        return <Building className="h-4 w-4" />
      case "terreno":
        return <TreePine className="h-4 w-4" />
      case "comercial":
        return <Building className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "casa":
        return "bg-blue-100 text-blue-800"
      case "departamento":
        return "bg-green-100 text-green-800"
      case "terreno":
        return "bg-yellow-100 text-yellow-800"
      case "comercial":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `$${(price / 1000000000).toFixed(1)}B`
    } else if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(0)}M`
    } else {
      return `$${(price / 1000).toFixed(0)}K`
    }
  }

  const totalValue = filteredProperties.reduce((sum, p) => sum + p.price, 0)
  const avgPrice = filteredProperties.length > 0 ? totalValue / filteredProperties.length : 0
  const featuredCount = filteredProperties.filter((p) => p.featured).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mapa Interactivo de Propiedades</h1>
          <p className="text-muted-foreground">Explora propiedades en el sur de Chile</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".kmz,.kml"
              multiple
              onChange={handleKmzUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Cargar KMZ
            </Button>
          </div>
          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartir Mapa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProperties.length}</div>
            <p className="text-xs text-muted-foreground">de {properties.length} totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archivos KMZ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kmzData.length}</div>
            <p className="text-xs text-muted-foreground">archivos cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Extraídos</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kmzData.reduce((sum, data) => sum + data.rolNumbers.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">números de rol</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgPrice)}</div>
            <p className="text-xs text-muted-foreground">precio promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destacadas</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{featuredCount}</div>
            <p className="text-xs text-muted-foreground">propiedades premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar propiedades..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="casa">Casas</SelectItem>
                <SelectItem value="departamento">Departamentos</SelectItem>
                <SelectItem value="terreno">Terrenos</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                <SelectItem value="Araucanía">Araucanía</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange("priceRange", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los precios</SelectItem>
                <SelectItem value="0-500000000">Hasta $500M</SelectItem>
                <SelectItem value="500000000-1000000000">$500M - $1B</SelectItem>
                <SelectItem value="1000000000-">Más de $1B</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ type: "all", priceRange: "all", region: "all", search: "" })
                setFilteredProperties(properties)
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Simulation */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Mapa de Propiedades</h2>
            <p className="text-muted-foreground">Vista interactiva del sur de Chile</p>
          </div>
          {kmzData.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowKmzOverlay(!showKmzOverlay)} className="gap-2">
              <Layers className="h-4 w-4" />
              {showKmzOverlay ? "Ocultar KMZ" : "Mostrar KMZ"}
            </Button>
          )}
        </div>
        <LeafletMap
          properties={filteredProperties}
          kmzData={kmzData}
          showKmzOverlay={showKmzOverlay}
          onToggleKmzOverlay={() => setShowKmzOverlay(!showKmzOverlay)}
          onPropertySelect={setSelectedProperty}
          selectedProperty={selectedProperty}
        />
      </div>

      {/* Property List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100"></div>
                <div className="relative z-10">{getPropertyIcon(property.type)}</div>
                {property.featured && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    <Heart className="h-3 w-3 mr-1" />
                    Destacada
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">{property.title}</CardTitle>
                  <Badge className={getTypeColor(property.type)}>
                    {getPropertyIcon(property.type)}
                    <span className="ml-1 capitalize">{property.type}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {property.location.city}, {property.location.region}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{property.description}</p>

              <div className="flex items-center justify-between text-sm">
                {property.features.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.features.bedrooms}
                  </div>
                )}
                {property.features.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.features.bathrooms}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  {property.features.area}m²
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">{formatPrice(property.price)}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Contactar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron propiedades con los filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
