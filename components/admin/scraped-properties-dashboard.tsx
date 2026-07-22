"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Building2,
  CircleDollarSign,
  Database,
  ExternalLink,
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
] as const

const UF_RATE = 38_500

async function fetchScrapedProperties(): Promise<ScrapedProperty[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("properties_external")
    .select("id, external_id, title, description, location, address, city, region, price, price_clp, price_uf, area, area_m2, property_type, images, source, source_url, scraped_at, is_active")
    .eq("is_active", true)
    .order("scraped_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ScrapedProperty[]
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
  const { data: properties = [], error, isLoading, mutate } = useSWR(
    "admin-scraped-properties",
    fetchScrapedProperties,
    { refreshInterval: 30_000, revalidateOnFocus: true },
  )
  const [query, setQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [favoriteFilter, setFavoriteFilter] = useState(initialShowFavorites)

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>()
    properties.forEach((property) => counts.set(property.source, (counts.get(property.source) ?? 0) + 1))
    return SOURCE_OPTIONS.map((source) => ({ ...source, count: counts.get(source.key) ?? 0 }))
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
      const searchable = [
        property.title,
        property.location,
        property.address,
        property.city,
        property.region,
        property.property_type,
        property.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")

      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (sourceFilter === "all" || property.source === sourceFilter)
        && (regionFilter === "all" || property.region === regionFilter)
        && (typeFilter === "all" || property.property_type === typeFilter)
        && !favoriteFilter
    })
  }, [properties, query, sourceFilter, regionFilter, typeFilter, favoriteFilter])

  const clearFilters = () => {
    setQuery("")
    setSourceFilter("all")
    setRegionFilter("all")
    setTypeFilter("all")
    setFavoriteFilter(false)
  }

  const hasFilters = Boolean(query || sourceFilter !== "all" || regionFilter !== "all" || typeFilter !== "all" || favoriteFilter)
  const visibleProperties = mode === "summary" ? filteredProperties.slice(0, 4) : filteredProperties
  const sources = new Set(filteredProperties.map((property) => property.source)).size
  const regions = new Set(filteredProperties.map((property) => property.region).filter(Boolean)).size
  const priced = filteredProperties.map(toUF).filter((value): value is number => Boolean(value))
  const averageUF = priced.length ? Math.round(priced.reduce((sum, value) => sum + value, 0) / priced.length) : 0

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Database className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">No se pudieron cargar las propiedades</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button variant="outline" onClick={() => mutate()}><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-5"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{filteredProperties.length}</p><p className="text-sm text-muted-foreground">Propiedades encontradas</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><Database className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{sources}</p><p className="text-sm text-muted-foreground">Fuentes con datos</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{regions}</p><p className="text-sm text-muted-foreground">Regiones cubiertas</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><CircleDollarSign className="h-5 w-5 text-primary" /><div><p className="text-lg font-semibold">{averageUF ? `UF ${new Intl.NumberFormat("es-CL").format(averageUF)}` : "Sin datos"}</p><p className="text-sm text-muted-foreground">Precio promedio UF</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, comuna, región..." className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
            </label>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:w-48">
              <option value="all">Todas las regiones</option>
              {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:w-44">
              <option value="all">Todos los tipos</option>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filtrar por fuente">
            <Button size="sm" variant={sourceFilter === "all" ? "default" : "outline"} onClick={() => { setSourceFilter("all"); setFavoriteFilter(false) }}>
              Todos <Badge variant="secondary" className="ml-2">{properties.length}</Badge>
            </Button>
            <Button size="sm" variant={favoriteFilter ? "default" : "outline"} onClick={() => setFavoriteFilter(!favoriteFilter)}>
              <Star className="mr-1.5 h-4 w-4" /> Favoritos
            </Button>
            {sourceOptions.map((source) => (
              <Button
                key={source.key}
                size="sm"
                variant={sourceFilter === source.key ? "default" : "outline"}
                className={source.key === "surealista" ? "border-emerald-500" : undefined}
                onClick={() => { setSourceFilter(source.key); setFavoriteFilter(false) }}
              >
                {source.label} <Badge variant="secondary" className="ml-2">{source.count}</Badge>
              </Button>
            ))}
            {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}><X className="mr-1.5 h-4 w-4" />Limpiar</Button>}
          </div>

          <p className="text-sm text-muted-foreground">Mostrando <span className="font-medium text-foreground">{filteredProperties.length}</span> de {properties.length} propiedades activas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{sourceFilter === "surealista" ? "Propiedades actuales de Sur Realista" : mode === "summary" ? "Propiedades recientes" : "Inventario de propiedades"}</CardTitle>
            <CardDescription>{sourceFilter === "surealista" ? "Inventario comercial vigente sincronizado con sur-realista.cl." : "Información real guardada en properties_external."}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Actualizar</Button>
        </CardHeader>
        <CardContent>
          {isLoading && properties.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando propiedades…</div>
          ) : visibleProperties.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No hay propiedades activas para este filtro.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleProperties.map((property) => (
                <article key={property.id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:flex-row">
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-muted md:w-44"><img src={property.images?.[0] || "/placeholder.svg"} alt={property.title} className="h-full w-full object-cover" /></div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-medium leading-6">{property.title}</h3><div className="mt-2 flex flex-wrap gap-2"><Badge variant={property.source === "surealista" ? "default" : "secondary"}>{property.source === "surealista" ? "Sur Realista" : property.source}</Badge><span className="text-sm capitalize text-muted-foreground">{property.property_type || "Propiedad"}</span></div></div>
                      {property.source_url && <Button asChild variant="outline" size="sm"><Link href={property.source_url} target="_blank" rel="noreferrer">Ver original <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-3">
                      <div><dt className="text-xs text-muted-foreground">Ubicación</dt><dd className="mt-1">{propertyLocation(property)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Superficie</dt><dd className="mt-1">{formatArea(property)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Precio</dt><dd className="mt-1 font-medium">{formatPrice(property)}</dd></div>
                    </dl>
                    {property.description && <p className="line-clamp-2 text-sm text-muted-foreground">{property.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
          {mode === "summary" && filteredProperties.length > 4 && <div className="mt-4 flex justify-end"><Button asChild variant="outline"><Link href="/admin/dashboard?tab=properties">Ver todas las propiedades</Link></Button></div>}
        </CardContent>
      </Card>
    </div>
  )
}
