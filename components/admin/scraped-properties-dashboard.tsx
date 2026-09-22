"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ScrapedProperty = {
  id: string
  external_id: string
  title: string
  description: string | null
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

type MarketFacet = {
  source: string
  region: string | null
  property_type: string | null
}

type MarketPage = {
  properties: ScrapedProperty[]
  total: number
}

type MarketFilters = {
  page: number
  pageSize: number
  query: string
  source: string
  region: string
  propertyType: string
  favoriteIds: string[]
}

const SOURCE_OPTIONS = [
  { key: "surealista", label: "Sur Realista" },
  { key: "ichiloe", label: "iChiloe" },
  { key: "camposchile", label: "CamposChile" },
  { key: "terrachiloe", label: "TerraChiloe" },
  { key: "portalterreno", label: "PortalTerreno" },
  { key: "rura", label: "Rura.cl" },
  { key: "goplaceit", label: "GoPlaceIt" },
  { key: "portal_inmobiliario", label: "Portal Inmobiliario" },
  { key: "yapo", label: "Yapo" },
  { key: "toctoc", label: "TocToc" },
  { key: "icasas", label: "iCasas" },
  { key: "remax", label: "RE/MAX" },
] as const

const UF_RATE = 38_500
const FULL_PAGE_SIZE = 48
const SUMMARY_PAGE_SIZE = 4
const FACET_BATCH_SIZE = 500
const MAX_FACET_ROWS = 5_000

function normalizeSearchTerm(value: string) {
  return value.replace(/[(),%_]/g, " ").replace(/\s+/g, " ").trim()
}

async function fetchScrapedProperties(filters: MarketFilters): Promise<MarketPage> {
  if (filters.favoriteIds.length === 0 && filters.source === "__favorites__") {
    return { properties: [], total: 0 }
  }

  const supabase = createBrowserClient()
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let request = supabase
    .from("properties_external")
    .select(
      "id, external_id, title, description, location, address, city, region, price, price_clp, price_uf, area, area_m2, property_type, images, source, source_url, scraped_at, is_active",
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })
    .range(from, to)

  if (filters.source !== "all" && filters.source !== "__favorites__") {
    request = request.eq("source", filters.source)
  }
  if (filters.region !== "all") request = request.eq("region", filters.region)
  if (filters.propertyType !== "all") request = request.eq("property_type", filters.propertyType)
  if (filters.source === "__favorites__") request = request.in("id", filters.favoriteIds)

  const searchTerm = normalizeSearchTerm(filters.query)
  if (searchTerm) {
    const pattern = `%${searchTerm}%`
    request = request.or(
      `title.ilike.${pattern},location.ilike.${pattern},address.ilike.${pattern},city.ilike.${pattern},region.ilike.${pattern},property_type.ilike.${pattern}`,
    )
  }

  const { data, error, count } = await request
  if (error) throw error

  return {
    properties: (data ?? []) as ScrapedProperty[],
    total: count ?? 0,
  }
}

async function fetchMarketFacets(): Promise<MarketFacet[]> {
  const supabase = createBrowserClient()
  const facets: MarketFacet[] = []

  for (let offset = 0; offset < MAX_FACET_ROWS; offset += FACET_BATCH_SIZE) {
    const { data, error } = await supabase
      .from("properties_external")
      .select("source, region, property_type")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .range(offset, offset + FACET_BATCH_SIZE - 1)

    if (error) throw error
    const batch = (data ?? []) as MarketFacet[]
    facets.push(...batch)
    if (batch.length < FACET_BATCH_SIZE) break
  }

  return facets
}

function toUF(property: ScrapedProperty): number | null {
  if (property.price_uf && property.price_uf >= 1 && property.price_uf <= 100_000) return property.price_uf
  const clp = property.price_clp ?? property.price
  if (clp && clp > 0 && clp < 50_000_000_000) return Math.round(clp / UF_RATE)
  return null
}

function formatPrice(property: ScrapedProperty) {
  const uf = toUF(property)
  if (uf) return `UF ${new Intl.NumberFormat("es-CL").format(uf)}`
  return property.source === "surealista" ? "Consultar precio" : "Precio no informado"
}

function formatArea(property: ScrapedProperty) {
  const area = property.area_m2 ?? property.area
  if (!area) return "Sin superficie"
  if (area >= 10_000) return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(area / 10_000)} ha`
  return `${new Intl.NumberFormat("es-CL").format(area)} m²`
}

function propertyLocation(property: ScrapedProperty) {
  return property.location || property.address || property.city || property.region || "Ubicación no informada"
}

export function ScrapedPropertiesDashboard({
  mode = "full",
  initialShowFavorites = false,
}: {
  mode?: "summary" | "full"
  initialShowFavorites?: boolean
}) {
  const pageSize = mode === "summary" ? SUMMARY_PAGE_SIZE : FULL_PAGE_SIZE
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState(initialShowFavorites ? "__favorites__" : "all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch("/api/admin/favorites")
        if (!response.ok) return
        const result = await response.json()
        setFavorites(new Set(result.favorites || []))
      } catch (loadError) {
        console.error("[favorites] Could not load favorites", loadError)
      }
    }

    void loadFavorites()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, sourceFilter, regionFilter, typeFilter])

  const favoriteIds = useMemo(() => [...favorites].sort(), [favorites])
  const marketFilters = useMemo<MarketFilters>(
    () => ({
      page,
      pageSize,
      query: debouncedQuery,
      source: sourceFilter,
      region: regionFilter,
      propertyType: typeFilter,
      favoriteIds: sourceFilter === "__favorites__" ? favoriteIds : [],
    }),
    [page, pageSize, debouncedQuery, sourceFilter, regionFilter, typeFilter, favoriteIds],
  )

  const {
    data: marketPage,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(["admin-scraped-properties", marketFilters], () => fetchScrapedProperties(marketFilters), {
    revalidateOnFocus: false,
    refreshInterval: 0,
  })

  const { data: facets = [] } = useSWR("admin-scraped-properties-facets", fetchMarketFacets, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  })

  const properties = marketPage?.properties ?? []
  const total = marketPage?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const toggleFavorite = async (propertyId: string) => {
    setFavoriteLoading(propertyId)
    try {
      const response = await fetch("/api/admin/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ property_id: propertyId, action: "toggle" }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      setFavorites((current) => {
        const next = new Set(current)
        if (result.is_favorite) next.add(propertyId)
        else next.delete(propertyId)
        return next
      })
      if (sourceFilter === "__favorites__") void mutate()
    } catch (toggleError) {
      console.error("[favorites] Could not update favorite", toggleError)
    } finally {
      setFavoriteLoading(null)
    }
  }

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>()
    facets.forEach((facet) => counts.set(facet.source, (counts.get(facet.source) ?? 0) + 1))
    return SOURCE_OPTIONS.map((source) => ({ ...source, count: counts.get(source.key) ?? 0 }))
  }, [facets])

  const regionOptions = useMemo(
    () => [...new Set(facets.map((facet) => facet.region).filter((region): region is string => Boolean(region)))].sort(),
    [facets],
  )

  const typeOptions = useMemo(
    () => [...new Set(facets.map((facet) => facet.property_type).filter((type): type is string => Boolean(type)))].sort(),
    [facets],
  )

  const clearFilters = () => {
    setQuery("")
    setDebouncedQuery("")
    setSourceFilter("all")
    setRegionFilter("all")
    setTypeFilter("all")
    setPage(1)
  }

  const hasFilters = Boolean(
    query || sourceFilter !== "all" || regionFilter !== "all" || typeFilter !== "all",
  )
  const sources = new Set(properties.map((property) => property.source)).size
  const regions = new Set(properties.map((property) => property.region).filter(Boolean)).size
  const priced = properties.map(toUF).filter((value): value is number => Boolean(value))
  const averageUF = priced.length ? Math.round(priced.reduce((sum, value) => sum + value, 0) / priced.length) : 0
  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastVisible = Math.min(page * pageSize, total)

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Database className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">No se pudieron cargar las propiedades</p>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold">{total}</p>
              <p className="text-sm text-muted-foreground">Propiedades encontradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold">{sources}</p>
              <p className="text-sm text-muted-foreground">Fuentes en esta página</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold">{regions}</p>
              <p className="text-sm text-muted-foreground">Regiones en esta página</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">
                {averageUF ? `UF ${new Intl.NumberFormat("es-CL").format(averageUF)}` : "Sin datos"}
              </p>
              <p className="text-sm text-muted-foreground">Promedio de esta página</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título, comuna, región..."
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
              />
            </label>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:w-56"
            >
              <option value="all">Todas las regiones</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:w-48"
            >
              <option value="all">Todos los tipos</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filtrar por fuente">
            <Button
              size="sm"
              variant={sourceFilter === "all" ? "default" : "outline"}
              onClick={() => setSourceFilter("all")}
            >
              Todos <Badge variant="secondary" className="ml-2">{facets.length || total}</Badge>
            </Button>
            <Button
              size="sm"
              variant={sourceFilter === "__favorites__" ? "default" : "outline"}
              onClick={() => setSourceFilter("__favorites__")}
            >
              <Star className="mr-1.5 h-4 w-4" />
              Favoritos <Badge variant="secondary" className="ml-2">{favorites.size}</Badge>
            </Button>
            {sourceOptions.map((source) => (
              <Button
                key={source.key}
                size="sm"
                variant={sourceFilter === source.key ? "default" : "outline"}
                className={source.key === "surealista" ? "border-emerald-500" : undefined}
                onClick={() => setSourceFilter(source.key)}
              >
                {source.label} <Badge variant="secondary" className="ml-2">{source.count}</Badge>
              </Button>
            ))}
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <X className="mr-1.5 h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{firstVisible}-{lastVisible}</span> de {total} propiedades
            {isValidating ? " · actualizando…" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>
              {sourceFilter === "surealista"
                ? "Propiedades actuales de Sur Realista"
                : mode === "summary"
                  ? "Propiedades recientes"
                  : "Inventario de propiedades"}
            </CardTitle>
            <CardDescription>
              {sourceFilter === "surealista"
                ? "Inventario comercial vigente sincronizado con sur-realista.cl."
                : "Información real guardada en properties_external, cargada por páginas para mantener estable la vista."}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isValidating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando propiedades…</div>
          ) : properties.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay propiedades activas para este filtro.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:flex-row"
                >
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-muted md:w-44">
                    <img
                      src={property.images?.[0] || "/placeholder.svg"}
                      alt={property.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium leading-6">{property.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant={property.source === "surealista" ? "default" : "secondary"}>
                            {property.source === "surealista" ? "Sur Realista" : property.source}
                          </Badge>
                          <span className="text-sm capitalize text-muted-foreground">
                            {property.property_type || "Propiedad"}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant={favorites.has(property.id) ? "default" : "outline"}
                          className={favorites.has(property.id) ? "bg-amber-500 text-white hover:bg-amber-600" : undefined}
                          aria-label={favorites.has(property.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                          title={favorites.has(property.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                          onClick={() => void toggleFavorite(property.id)}
                          disabled={favoriteLoading === property.id}
                        >
                          {favoriteLoading === property.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className={`h-4 w-4 ${favorites.has(property.id) ? "fill-current" : ""}`} />
                          )}
                        </Button>
                        {property.source_url && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={property.source_url} target="_blank" rel="noreferrer">
                              Ver original <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-muted-foreground">Ubicación</dt>
                        <dd className="mt-1">{propertyLocation(property)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Superficie</dt>
                        <dd className="mt-1">{formatArea(property)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Precio</dt>
                        <dd className="mt-1 font-medium">{formatPrice(property)}</dd>
                      </div>
                    </dl>
                    {property.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{property.description}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {mode === "full" && total > pageSize && (
            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page <= 1 || isValidating}
                >
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
                  disabled={page >= pageCount || isValidating}
                >
                  Siguiente
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {mode === "summary" && total > SUMMARY_PAGE_SIZE && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="outline">
                <Link href="/mercado">Ver mercado completo</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
