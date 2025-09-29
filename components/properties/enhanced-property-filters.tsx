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
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, X, Droplets, TreePine, Wheat, Mountain } from "lucide-react"

interface Property {
  id: string
  title: string
  location: string
  price: number
  bedrooms?: number
  bathrooms?: number
  square_meters?: number
  lot_size?: number
  property_type: string
  water_rights?: boolean
  avaluo_total?: number
  region?: string
  city?: string
  features?: string[]
  amenities?: string[]
}

interface EnhancedPropertyFiltersProps {
  filters: {
    types: string[]
    locations: string[]
    regions: string[]
    priceRange: [number, number]
    avaluoRange: [number, number]
    bedrooms: string
    bathrooms: string
    minArea: string
    maxArea: string
    minLotSize: string
    maxLotSize: string
    features: string[]
    waterRights: boolean
    agriculturalFeatures: string[]
  }
  onFiltersChange: (filters: any) => void
  properties: Property[]
}

export default function EnhancedPropertyFilters({
  filters,
  onFiltersChange,
  properties,
}: EnhancedPropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAgricultural, setShowAgricultural] = useState(false)

  const propertyTypes = [
    { id: "agricola", label: "Agrícola", icon: "🌾" },
    { id: "rural", label: "Rural", icon: "🏞️" },
    { id: "forestal", label: "Forestal", icon: "🌲" },
    { id: "acuicultura", label: "Acuicultura", icon: "🐟" },
    { id: "ganadero", label: "Ganadero", icon: "🐄" },
    { id: "casa", label: "Casa", icon: "🏠" },
    { id: "terreno", label: "Terreno", icon: "📐" },
    { id: "comercial", label: "Comercial", icon: "🏢" },
  ]

  const regions = [
    "Región de Los Lagos",
    "Región de Los Ríos",
    "Región de La Araucanía",
    "Región del Biobío",
    "Región de Aysén",
    "Región de Magallanes",
  ]

  const cities = [
    "Puerto Varas",
    "Puerto Montt",
    "Osorno",
    "Valdivia",
    "Pucón",
    "Villarrica",
    "Frutillar",
    "Chiloé",
    "Ancud",
    "Castro",
    "Temuco",
    "Concepción",
    "Coyhaique",
    "Punta Arenas",
  ]

  const agriculturalFeatures = [
    { id: "riego_tecnificado", label: "Riego Tecnificado", icon: <Droplets className="h-4 w-4" /> },
    { id: "suelo_clase_i", label: "Suelo Clase I", icon: "🌱" },
    { id: "suelo_clase_ii", label: "Suelo Clase II", icon: "🌿" },
    { id: "invernaderos", label: "Invernaderos", icon: "🏠" },
    { id: "bodega_agricola", label: "Bodega Agrícola", icon: "🏭" },
    { id: "maquinaria_incluida", label: "Maquinaria Incluida", icon: "🚜" },
    { id: "certificacion_organica", label: "Certificación Orgánica", icon: "✅" },
    { id: "plantaciones_frutales", label: "Plantaciones Frutales", icon: "🍎" },
  ]

  const features = [
    "Vista al lago",
    "Vista al volcán",
    "Vista al mar",
    "Acceso al agua",
    "Electricidad",
    "Camino pavimentado",
    "Internet",
    "Cerca de ciudad",
    "Transporte público",
    "Escuelas cercanas",
    "Centros de salud",
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

  const handleRegionChange = (region: string, checked: boolean) => {
    const newRegions = checked ? [...filters.regions, region] : filters.regions.filter((r) => r !== region)

    onFiltersChange({ ...filters, regions: newRegions })
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const newFeatures = checked ? [...filters.features, feature] : filters.features.filter((f) => f !== feature)

    onFiltersChange({ ...filters, features: newFeatures })
  }

  const handleAgriculturalFeatureChange = (feature: string, checked: boolean) => {
    const newFeatures = checked
      ? [...filters.agriculturalFeatures, feature]
      : filters.agriculturalFeatures.filter((f) => f !== feature)

    onFiltersChange({ ...filters, agriculturalFeatures: newFeatures })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      locations: [],
      regions: [],
      priceRange: [0, 2000000000] as [number, number],
      avaluoRange: [0, 1000000000] as [number, number],
      bedrooms: "any",
      bathrooms: "any",
      minArea: "",
      maxArea: "",
      minLotSize: "",
      maxLotSize: "",
      features: [],
      waterRights: false,
      agriculturalFeatures: [],
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.locations.length > 0) count++
    if (filters.regions.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000000000) count++
    if (filters.avaluoRange[0] > 0 || filters.avaluoRange[1] < 1000000000) count++
    if (filters.bedrooms !== "any") count++
    if (filters.bathrooms !== "any") count++
    if (filters.minArea || filters.maxArea) count++
    if (filters.minLotSize || filters.maxLotSize) count++
    if (filters.features.length > 0) count++
    if (filters.waterRights) count++
    if (filters.agriculturalFeatures.length > 0) count++
    return count
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            Filtros Avanzados
          </div>
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {getActiveFiltersCount()} activos
              </Badge>
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
          <Label className="text-sm font-medium flex items-center gap-2">
            <Wheat className="h-4 w-4" />
            Tipo de Propiedad
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={filters.types.includes(type.id)}
                  onCheckedChange={(checked) => handleTypeChange(type.id, checked as boolean)}
                />
                <Label htmlFor={type.id} className="text-sm flex items-center gap-1">
                  <span>{type.icon}</span>
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Region & Location */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Región</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {regions.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={region}
                    checked={filters.regions.includes(region)}
                    onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                  />
                  <Label htmlFor={region} className="text-sm">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Ciudad</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cities.map((city) => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox
                    id={city}
                    checked={filters.locations.includes(city)}
                    onCheckedChange={(checked) => handleLocationChange(city, checked as boolean)}
                  />
                  <Label htmlFor={city} className="text-sm">
                    {city}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Rango de Precio</Label>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, priceRange: [value[0], value[1]] as [number, number] })
              }
              max={2000000000}
              min={0}
              step={50000000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Avalúo Fiscal Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Avalúo Fiscal</Label>
          <div className="px-2">
            <Slider
              value={filters.avaluoRange}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, avaluoRange: [value[0], value[1]] as [number, number] })
              }
              max={1000000000}
              min={0}
              step={25000000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatPrice(filters.avaluoRange[0])}</span>
              <span>{formatPrice(filters.avaluoRange[1])}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Water Rights */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="waterRights"
            checked={filters.waterRights}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, waterRights: checked as boolean })}
          />
          <Label htmlFor="waterRights" className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4 text-water" />
            Con Derechos de Agua
          </Label>
        </div>

        {/* Agricultural Features Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowAgricultural(!showAgricultural)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Características Agrícolas
          </span>
          {showAgricultural ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Agricultural Features */}
        {showAgricultural && (
          <div className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-1 gap-2">
              {agriculturalFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature.id}
                    checked={filters.agriculturalFeatures.includes(feature.id)}
                    onCheckedChange={(checked) => handleAgriculturalFeatureChange(feature.id, checked as boolean)}
                  />
                  <Label htmlFor={feature.id} className="text-sm flex items-center gap-2">
                    {feature.icon}
                    {feature.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters Toggle */}
        <Button variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full justify-between">
          Filtros Adicionales
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* Area Ranges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Área Construida Mín. (m²)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minArea}
                  onChange={(e) => onFiltersChange({ ...filters, minArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Área Construida Máx. (m²)</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxArea}
                  onChange={(e) => onFiltersChange({ ...filters, maxArea: e.target.value })}
                />
              </div>
            </div>

            {/* Lot Size Ranges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Terreno Mín. (m²)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minLotSize}
                  onChange={(e) => onFiltersChange({ ...filters, minLotSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Terreno Máx. (m²)</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxLotSize}
                  onChange={(e) => onFiltersChange({ ...filters, maxLotSize: e.target.value })}
                />
              </div>
            </div>

            {/* Basic Property Features */}
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

            {/* General Features */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Características Generales</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
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
