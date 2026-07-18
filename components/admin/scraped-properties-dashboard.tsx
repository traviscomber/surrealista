"use client"

import useSWR from "swr"
import Link from "next/link"
import {
  Building2,
  CircleDollarSign,
  Database,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { BasicImage } from "@/components/ui/basic-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

  const sources = new Set(properties.map((property) => property.source)).size
  const regions = new Set(properties.map((property) => property.region).filter(Boolean)).size
  const priced = properties.filter((property) => property.price_clp || property.price || property.price_uf)
  const averageClp = priced.filter((property) => property.price_clp || property.price)
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

  const visibleProperties = mode === "summary" ? properties.slice(0, 4) : properties

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Building2 className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-semibold text-foreground">{properties.length}</p><p className="text-sm text-muted-foreground">Propiedades activas</p></div>
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
            <div className="py-12 text-center text-sm text-muted-foreground">Todavía no hay propiedades activas.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Superficie</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="text-right">Enlace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex min-w-64 items-center gap-3">
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                          <BasicImage src={property.images?.[0] || "/placeholder.svg"} alt={property.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-80 truncate font-medium text-foreground">{property.title}</p>
                          <p className="text-xs text-muted-foreground">{property.property_type || "Propiedad"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{property.source}</Badge></TableCell>
                    <TableCell className="max-w-56"><span className="line-clamp-2 text-muted-foreground">{getLocation(property)}</span></TableCell>
                    <TableCell>{getArea(property)}</TableCell>
                    <TableCell className="font-medium">{formatPrice(property)}</TableCell>
                    <TableCell className="text-right">
                      {property.source_url ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={property.source_url} target="_blank" rel="noreferrer">Ver original <ExternalLink className="ml-2 h-4 w-4" /></Link>
                        </Button>
                      ) : <span className="text-xs text-muted-foreground">Sin enlace</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {mode === "summary" && properties.length > 4 && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="outline"><Link href="/admin/dashboard?tab=properties">Ver las {properties.length} propiedades</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
