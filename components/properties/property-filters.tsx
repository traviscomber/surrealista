"use client"

import { useMemo, useState } from "react"
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

const DEFAULT_MAX_PRICE = 500000000

export default function PropertyFilters({ filters, onFiltersChange, properties }: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const propertyTypes = useMemo(
    () =>
      Array.from(new Set(properties.map((property) => property.type?.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [properties],
  )

  const locations = useMemo(
    () =>
      Array.from(new Set(properties.map((property) => property.location?.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [properties],
  )

  const observedPrices = properties.map((property) => property.price).filter((price) => Number.isFinite(price) && price > 0)
  const observedMaxPrice = observedPrices.length > 0 ? Math.max(...observedPrices) : DEFAULT_MAX_PRICE
  const maxPrice = Math.max(DEFAULT_MAX_PRICE, Math.ceil(observedMaxPrice / 10000000) * 10000000)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)

  const handleTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = checked ? [...filters.types, typeId] : filters.types.filter((type) => type !== typeId)
    onFiltersChange({ ...filters, types: newTypes })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked
      ? [...filters.locations, location]
      : filters.locations.filter((item) => item !== location)
    onFiltersChange({ ...filters, locations: newLocations })
  }

  const handleAreaChange = (field: "minArea" | "maxArea", value: string) => {
    onFiltersChange({ ...filters, [field]: value.replace(/[^0-9]/g, "") })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      locations: [],
      priceRange: [0, maxPrice] as [number, number],
      bedrooms: "any",
      bathrooms: "any",
      minArea: "",
      maxArea: "",
      features: [],
    })
  }

  const activeFiltersCount = [
    filters.types.length > 0,
    filters.locations.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.bedrooms !== "any",
    filters.bathrooms !== "any",
    Boolean(filters.minArea || filters.maxArea),
  ].filter(Boolean).length

  return (
    <Card className="sticky top-4 border-border/70">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Filtros de inventario</span>
          {activeFiltersCount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeFiltersCount}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAllFilters}
                className="h-7 w-7"
                aria-label="Limpiar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {propertyTypes.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo informado</Label>
            <div className="space-y-2">
              {propertyTypes.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.types.includes(type)}
                    onCheckedChange={(checked) => handleTypeChange(type, Boolean(checked))}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm font-normal capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {locations.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ubicación informada</Label>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {locations.map((location) => (
                <div key={location} className="flex items-start gap-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={filters.locations.includes(location)}
                    onCheckedChange={(checked) => handleLocationChange(location, Boolean(checked))}
                  />
                  <Label htmlFor={`location-${location}`} className="text-sm font-normal leading-5">
                    {location}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <Label className="text-sm font-medium">Precio informado</Label>
          <div className="px-1">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => onFiltersChange({ ...filters, priceRange: [value[0], value[1]] })}
              max={maxPrice}
              min={0}
              step={10000000}
            />
            <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dormitorios</Label>
            <Select value={filters.bedrooms} onValueChange={(value) => onFiltersChange({ ...filters, bedrooms: value })}>
              <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                {[1, 2, 3, 4, 5].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Baños</Label>
            <Select value={filters.bathrooms} onValueChange={(value) => onFiltersChange({ ...filters, bathrooms: value })}>
              <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Cualquiera</SelectItem>
                {[1, 2, 3, 4].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="ghost" onClick={() => setShowAdvanced((value) => !value)} className="w-full justify-between px-0">
          Superficie
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showAdvanced ? (
          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mínima (m²)</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={filters.minArea}
                onChange={(event) => handleAreaChange("minArea", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Máxima (m²)</Label>
              <Input
                inputMode="numeric"
                placeholder="Sin límite"
                value={filters.maxArea}
                onChange={(event) => handleAreaChange("maxArea", event.target.value)}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
