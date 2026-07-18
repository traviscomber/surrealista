"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Building2,
  CircleDollarSign,
  Database,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { BasicImage } from "@/components/ui/basic-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ScrapedProperty = {
  id: string
  external_id: string
  title: string
  location: string | null
  address: string | null
  city: string | null
  region: string | null
  price: number | null
  price_clp: number | null
  price_uf: number | null
  area: number | null
  area_m2: number | null
  property_type: string | null
  images: string[] | null
  source: string
  source_url: string | null
  scraped_at: string
  is_active: boolean
}

async function fetchScrapedProperties(): Promise<ScrapedProperty[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("properties_external")
    .select(
      "id, external_id, title, location, address, city, region, price, price_clp, price_uf, area, area_m2, property_type, images, source, source_url, scraped_at, is_active",
    )
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ScrapedProperty[]
}

function formatPrice(property: ScrapedProperty) {
  if (property.price_uf) return `UF ${new Intl.NumberFormat("es-CL").format(property.price_uf)}`
  const clp = property.price_clp || property.price
  if (clp) return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(clp)
  return "Precio no informado"
}

function getLocation(property: ScrapedProperty) {
  return property.location || property.address || property.city || property.region || "Ubicación no informada"
}

function getArea(property: ScrapedProperty) {
  const area = property.area_m2 || property.area
  return area ? `${new Intl.NumberFormat("es-CL").format(area)} m²` : "Sin superficie"
}

export function ScrapedPropertiesDashboard({ mode = "full" }: { mode?: "summary" | "full" }) {
  const { data: properties = [], error, isLoading, mutate } = useSWR(
    "admin-scraped-properties",
    fetchScrapedProperties,
    { refreshInterval: 30_000, revalidateOnFocus: true },
  )
  const [query, setQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>()
    properties.forEach((property) => counts.set(property.source, (counts.get(property.source) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [properties])
  const regionOptions = useMemo(
    () => [...new Set(properties.map((property) => property.region).filter((region): region is string => Boolean(region)))].sort(),
    [properties],
  )
  const typeOptions = useMemo(
    () => [...new Set(properties.map((property) => property.property_type).filter((type): type is string => Boolean(type)))].sort(),
    [properties],
  )
  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es")
    return properties.filter((property) => {
      const searchable = [property.title, property.location, property.address, property.city, property.region, property.property_type, property.source]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (sourceFilter === "all" || property.source === sourceFilter)
        && (regionFilter === "all" || property.region === regionFilter)
        && (typeFilter === "all" || property.property_type === typeFilter)
    })
  }, [properties, query, sourceFilter, regionFilter, typeFilter])
  const hasFilters = Boolean(query || sourceFilter !== "all" || regionFilter !== "all" || typeFilter !== "all")
  const clearFilters = () => {
    setQuery("")
    setSourceFilter("all")
    setRegionFilter("all")
    setTypeFilter("all")
  }

  const sources = new Set(filteredProperties.map((property) => property.source)).size
  const regions = new Set(filteredProperties.map((property) => property.region).filter(Boolean)).size
  const averageClp = filteredProperties.filter((property) => property.price_clp || property.price)
  const average = averageClp.length
    ? Math.round(averageClp.reduce((total, property) => total + Number(property.price_clp || property.price || 0), 0) / averageClp.length)
    : 0

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Database className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-foreground">No se pudieron cargar las propiedades scrapeadas</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const visibleProperties = mode === "summary" ? filteredProperties.slice(0, 4) : filteredProperties

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Building2 className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-semibold text-foreground">{filteredProperties.length}</p><p className="text-sm text-muted-foreground">Propiedades encontradas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Database className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-semibold text-foreground">{sources}</p><p className="text-sm text-muted-foreground">Fuentes con datos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-semibold text-foreground">{regions}</p><p className="text-sm text-muted-foreground">Regiones cubiertas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-lg font-semibold text-foreground">{average ? new Intl.NumberFormat("es-CL", { notation: "compact", style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(average) : "Sin datos"}</p><p className="text-sm text-muted-foreground">Precio promedio CLP</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar propiedades</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título, comuna, región..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
              <label>
                <span className="sr-only">Filtrar por región</span>
                <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring lg:w-48">
                  <option value="all">Todas las regiones</option>
                  {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrar por tipo</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring lg:w-44">
                  <option value="all">Todos los tipos</option>
                  {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="col-span-2 sm:col-span-1">
                  <X className="mr-2 h-4 w-4" /> Limpiar
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtrar por scraper">
            <Button size="sm" variant={sourceFilter === "all" ? "default" : "outline"} onClick={() => setSourceFilter("all")}>
              Todos <Badge variant="secondary" className="ml-2">{properties.length}</Badge>
            </Button>
            {sourceOptions.map(([source, count]) => (
              <Button key={source} size="sm" variant={sourceFilter === source ? "default" : "outline"} onClick={() => setSourceFilter(source)} className="capitalize">
                {source.replaceAll("_", " ")} <Badge variant="secondary" className="ml-2">{count}</Badge>
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Mostrando <span className="font-medium text-foreground">{filteredProperties.length}</span> de {properties.length} propiedades
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{mode === "summary" ? "Propiedades scrapeadas recientes" : "Inventario scrapeado"}</CardTitle>
            <CardDescription>Información real obtenida desde los portales y guardada en properties_external.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && properties.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" /> Cargando propiedades scrapeadas…
            </div>
          ) : visibleProperties.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8" />
              <p>{hasFilters ? "No hay propiedades que coincidan con estos filtros." : "Todavía no hay propiedades activas."}</p>
              {hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleProperties.map((property) => (
                <article key={property.id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:flex-row">
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-muted md:w-44">
                    <BasicImage
                      src={property.images?.[0] || "/placeholder.svg"}
                      alt={`Vista de ${property.title}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-pretty font-medium leading-6 text-foreground">{property.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{property.source}</Badge>
                          <span className="text-sm capitalize text-muted-foreground">{property.property_type || "Propiedad"}</span>
                        </div>
                      </div>
                      {property.source_url && (
                        <Button asChild variant="outline" size="sm" className="shrink-0 self-start">
                          <Link href={property.source_url} target="_blank" rel="noreferrer">
                            Ver original <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">Ubicación</dt>
                        <dd className="mt-1 break-words text-foreground">{getLocation(property)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Superficie</dt>
                        <dd className="mt-1 text-foreground">{getArea(property)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Precio</dt>
                        <dd className="mt-1 font-medium text-foreground">{formatPrice(property)}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          )}
          {mode === "summary" && filteredProperties.length > 4 && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="outline"><Link href="/admin/dashboard?tab=properties">Ver las {filteredProperties.length} propiedades encontradas</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
