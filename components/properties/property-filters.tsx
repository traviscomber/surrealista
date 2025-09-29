"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, X } from "lucide-react"

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

interface PropertyFiltersProps {
  filters: {
    types: string[]
    locations: string[]
    priceRange: [number, number]
    bedrooms: string
    bathrooms: string
    minArea: string
    maxArea: string
    features: string[]
  }
  onFiltersChange: (filters: any) => void
  properties: Property[]
}

export default function PropertyFilters({ filters, onFiltersChange, properties }: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const propertyTypes = [
    { id: "casa", label: "Casa" },
    { id: "departamento", label: "Departamento" },
    { id: "terreno", label: "Terreno" },
    { id: "comercial", label: "Comercial" },
    { id: "oficina", label: "Oficina" },
  ]

  const locations = ["Puerto Varas", "Pucón", "Valdivia", "Puerto Montt", "Osorno", "Frutillar", "Chiloé"]

  const features = [
    "Vista al lago",
    "Vista al volcán",
    "Jardín",
    "Piscina",
    "Quincho",
    "Estacionamiento",
    "Amoblado",
    "Acceso al agua",
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = checked ? [...filters.types, typeId] : filters.types.filter((t) => t !== typeId)

    onFiltersChange({ ...filters, types: newTypes })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked ? [...filters.locations, location] : filters.locations.filter((l) => l !== location)

    onFiltersChange({ ...filters, locations: newLocations })
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const newFeatures = checked ? [...filters.features, feature] : filters.features.filter((f) => f !== feature)

    onFiltersChange({ ...filters, features: newFeatures })
  }

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] as [number, number] })
  }

  const handleAreaChange = (field: "minArea" | "maxArea", value: string) => {
    // Only allow numeric values
    const numericValue = value.replace(/[^0-9]/g, "")
    onFiltersChange({ ...filters, [field]: numericValue })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      locations: [],
      priceRange: [0, 500000000] as [number, number],
      bedrooms: "any",
      bathrooms: "any",
      minArea: "",
      maxArea: "",
      features: [],
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.locations.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000000) count++
    if (filters.bedrooms !== "any") count++
    if (filters.bathrooms !== "any") count++
    if (filters.minArea || filters.maxArea) count++
    if (filters.features.length > 0) count++
    return count
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Filtros
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getActiveFiltersCount()} activos</Badge>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Propiedad</Label>
          <div className="space-y-2">
            {propertyTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={filters.types.includes(type.id)}
                  onCheckedChange={(checked) => handleTypeChange(type.id, checked as boolean)}
                />
                <Label htmlFor={type.id} className="text-sm">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ubicación</Label>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={location}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={(checked) => handleLocationChange(location, checked as boolean)}
                />
                <Label htmlFor={location} className="text-sm">
                  {location}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Rango de Precio</Label>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceRangeChange}
              max={500000000}
              min={0}
              step={10000000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dormitorios</Label>
            <Select
              value={filters.bedrooms}
              onValueChange={(value) => onFiltersChange({ ...filters, bedrooms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Baños</Label>
            <Select
              value={filters.bathrooms}
              onValueChange={(value) => onFiltersChange({ ...filters, bathrooms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full justify-between">
          Filtros Avanzados
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* Area Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Área Mín. (m²)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minArea}
                  onChange={(e) => handleAreaChange("minArea", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Área Máx. (m²)</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxArea}
                  onChange={(e) => handleAreaChange("maxArea", e.target.value)}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Características</Label>
              <div className="space-y-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={filters.features.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                    />
                    <Label htmlFor={feature} className="text-sm">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
