"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function ActiveFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get all filter values from URL
  const filters = {
    minPrice: searchParams.get("minPrice"),
    maxPrice: searchParams.get("maxPrice"),
    minSize: searchParams.get("minSize"),
    maxSize: searchParams.get("maxSize"),
    bedrooms: searchParams.get("bedrooms"),
    bathrooms: searchParams.get("bathrooms"),
    type: searchParams.get("type"),
    city: searchParams.get("city"),
    condition: searchParams.get("condition"),
    hasGarden: searchParams.get("hasGarden"),
    hasPool: searchParams.get("hasPool"),
    hasGarage: searchParams.get("hasGarage"),
    hasTerrace: searchParams.get("hasTerrace"),
    hasView: searchParams.get("hasView"),
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((value) => value !== null)

  if (!hasActiveFilters) {
    return null
  }

  // Remove a specific filter
  const removeFilter = (filterName: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(filterName)
    router.push(`/propiedades?${params.toString()}`)
  }

  // Clear all filters
  const clearAllFilters = () => {
    router.push("/propiedades")
  }

  // Format filter labels
  const getFilterLabel = (name: string, value: string) => {
    switch (name) {
      case "minPrice":
        return `Precio mín: ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value))}`
      case "maxPrice":
        return `Precio máx: ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value))}`
      case "minSize":
        return `Tamaño mín: ${value} m²`
      case "maxSize":
        return `Tamaño máx: ${value} m²`
      case "bedrooms":
        return `${value}+ dormitorios`
      case "bathrooms":
        return `${value}+ baños`
      case "type":
        const propertyTypes = {
          house: "Casa",
          apartment: "Departamento",
          land: "Terreno",
          commercial: "Comercial",
          rural: "Rural",
        }
        return propertyTypes[value] || value
      case "city":
        const cities = {
          puerto_montt: "Puerto Montt",
          puerto_varas: "Puerto Varas",
          frutillar: "Frutillar",
          osorno: "Osorno",
          valdivia: "Valdivia",
          chiloe: "Chiloé",
          temuco: "Temuco",
        }
        return cities[value] || value
      case "condition":
        const conditions = {
          new: "Nueva",
          used: "Usada",
          under_construction: "En construcción",
          to_be_restored: "Para restaurar",
        }
        return conditions[value] || value
      case "hasGarden":
        return "Con jardín"
      case "hasPool":
        return "Con piscina"
      case "hasGarage":
        return "Con estacionamiento"
      case "hasTerrace":
        return "Con terraza"
      case "hasView":
        return "Con vista panorámica"
      default:
        return `${name}: ${value}`
    }
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground mr-1">Filtros activos:</span>

        {Object.entries(filters).map(([name, value]) => {
          if (value === null) return null

          return (
            <Badge key={name} variant="outline" className="flex items-center gap-1 px-2 py-1">
              {getFilterLabel(name, value)}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => removeFilter(name)}>
                <X className="h-3 w-3" />
                <span className="sr-only">Eliminar filtro {name}</span>
              </Button>
            </Badge>
          )
        })}

        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={clearAllFilters}>
          Limpiar todos
        </Button>
      </div>
    </div>
  )
}
