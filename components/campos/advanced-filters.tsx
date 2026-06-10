"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, X, RotateCcw } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface AdvancedFiltersState {
  priceMin: number
  priceMax: number
  areaMin: number
  areaMax: number
  zones: string[]
  propertyTypes: string[]
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: AdvancedFiltersState) => void
  activeFiltersCount?: number
}

const ZONE_OPTIONS = ["Urbana", "Rural", "Mixta"]
const PROPERTY_TYPES = ["Agrícola", "Residencial", "Comercial", "Industrial", "Mixto"]
const MAX_PRICE = 10000000
const MAX_AREA = 50000

export function AdvancedFilters({ onFiltersChange, activeFiltersCount = 0 }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<AdvancedFiltersState>({
    priceMin: 0,
    priceMax: MAX_PRICE,
    areaMin: 0,
    areaMax: MAX_AREA,
    zones: [],
    propertyTypes: [],
  })

  const handlePriceMinChange = (value: string) => {
    const numValue = parseInt(value) || 0
    const newFilters = { ...filters, priceMin: Math.min(numValue, filters.priceMax) }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceMaxChange = (value: string) => {
    const numValue = parseInt(value) || MAX_PRICE
    const newFilters = { ...filters, priceMax: Math.max(numValue, filters.priceMin) }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleAreaMinChange = (value: string) => {
    const numValue = parseInt(value) || 0
    const newFilters = { ...filters, areaMin: Math.min(numValue, filters.areaMax) }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleAreaMaxChange = (value: string) => {
    const numValue = parseInt(value) || MAX_AREA
    const newFilters = { ...filters, areaMax: Math.max(numValue, filters.areaMin) }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleZoneToggle = (zone: string) => {
    const newZones = filters.zones.includes(zone)
      ? filters.zones.filter(z => z !== zone)
      : [...filters.zones, zone]
    const newFilters = { ...filters, zones: newZones }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePropertyTypeToggle = (type: string) => {
    const newTypes = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter(t => t !== type)
      : [...filters.propertyTypes, type]
    const newFilters = { ...filters, propertyTypes: newTypes }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    const defaultFilters: AdvancedFiltersState = {
      priceMin: 0,
      priceMax: MAX_PRICE,
      areaMin: 0,
      areaMax: MAX_AREA,
      zones: [],
      propertyTypes: [],
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters =
    filters.priceMin > 0 ||
    filters.priceMax < MAX_PRICE ||
    filters.areaMin > 0 ||
    filters.areaMax < MAX_AREA ||
    filters.zones.length > 0 ||
    filters.propertyTypes.length > 0

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">Filtros Avanzados</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount || (
                    filters.zones.length +
                    filters.propertyTypes.length +
                    (filters.priceMin > 0 || filters.priceMax < MAX_PRICE ? 1 : 0) +
                    (filters.areaMin > 0 || filters.areaMax < MAX_AREA ? 1 : 0)
                  )}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t p-4 space-y-6">
          {/* Precio */}
          <div className="space-y-3">
            <Label className="font-semibold">Precio</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="price-min" className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  id="price-min"
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => handlePriceMinChange(e.target.value)}
                  placeholder="$0"
                  className="mt-1"
                  min="0"
                  max={MAX_PRICE}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="price-max" className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  id="price-max"
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => handlePriceMaxChange(e.target.value)}
                  placeholder={`$${MAX_PRICE.toLocaleString()}`}
                  className="mt-1"
                  min="0"
                  max={MAX_PRICE}
                />
              </div>
            </div>
          </div>

          {/* Área */}
          <div className="space-y-3">
            <Label className="font-semibold">Área (m²)</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="area-min" className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  id="area-min"
                  type="number"
                  value={filters.areaMin}
                  onChange={(e) => handleAreaMinChange(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                  min="0"
                  max={MAX_AREA}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="area-max" className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  id="area-max"
                  type="number"
                  value={filters.areaMax}
                  onChange={(e) => handleAreaMaxChange(e.target.value)}
                  placeholder={`${MAX_AREA.toLocaleString()}`}
                  className="mt-1"
                  min="0"
                  max={MAX_AREA}
                />
              </div>
            </div>
          </div>

          {/* Zona */}
          <div className="space-y-3">
            <Label className="font-semibold">Zona</Label>
            <div className="space-y-2">
              {ZONE_OPTIONS.map((zone) => (
                <div key={zone} className="flex items-center gap-2">
                  <Checkbox
                    id={`zone-${zone}`}
                    checked={filters.zones.includes(zone)}
                    onCheckedChange={() => handleZoneToggle(zone)}
                  />
                  <Label htmlFor={`zone-${zone}`} className="font-normal cursor-pointer">
                    {zone}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Propiedad */}
          <div className="space-y-3">
            <Label className="font-semibold">Tipo de Propiedad</Label>
            <div className="space-y-2">
              {PROPERTY_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.propertyTypes.includes(type)}
                    onCheckedChange={() => handlePropertyTypeToggle(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
