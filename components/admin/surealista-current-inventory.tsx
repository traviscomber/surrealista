"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, ExternalLink, ImageOff, Loader2, MapPin, RefreshCw, Search } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

type CurrentProperty = {
  id: string
  external_id: string
  title: string
  description: string | null
  city: string | null
  commune: string | null
  region: string | null
  price_uf: number | null
  area_m2: number | null
  property_type: string | null
  images: string[] | null
  source_url: string | null
  scraped_at: string
}

function formatArea(area: number | null) {
  if (!area) return "Superficie no informada"
  if (area >= 10_000) return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(area / 10_000)} ha`
  return `${new Intl.NumberFormat("es-CL").format(area)} m²`
}

function formatPrice(priceUf: number | null) {
  return priceUf ? `UF ${new Intl.NumberFormat("es-CL").format(priceUf)}` : "Precio no informado"
}

export function SurRealistaCurrentInventory() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [properties, setProperties] = useState<CurrentProperty[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const loadProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from("properties_external")
      .select("id, external_id, title, description, city, commune, region, price_uf, area_m2, property_type, images, source_url, scraped_at")
      .eq("source", "surealista")
      .eq("is_active", true)
      .order("scraped_at", { ascending: false })

    if (queryError) setError(queryError.message)
    else setProperties((data || []) as CurrentProperty[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { void loadProperties() }, [loadProperties])

  const syncNow = useCallback(async () => {
    setSyncing(true)
    setError(null)
    setLastResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const siteToken = sessionStorage.getItem("site_access_token")
      const response = await fetch("/api/scrape/surealista", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(siteToken ? { "X-Site-Access-Token": siteToken } : {}),
        },
        body: JSON.stringify({ dryRun: false }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
      setLastResult(`${result.found || 0} actuales · ${result.inserted || 0} nuevas · ${result.updated || 0} actualizadas · ${result.deactivated || 0} retiradas`)
      await loadProperties()
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "No se pudo sincronizar")
    } finally {
      setSyncing(false)
    }
  }, [loadProperties, supabase])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es")
    if (!normalized) return properties
    return properties.filter((property) => [property.title, property.city, property.commune, property.region, property.property_type]
      .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(normalized))
  }, [properties, query])

  const regions = new Set(properties.map((property) => property.region).filter(Boolean)).size
  const lastSync = properties[0]?.scraped_at ? new Date(properties[0].scraped_at).toLocaleString("es-CL") : "Sin sincronización registrada"

  return (
    <div className="space-y-7">
      <WorkspaceHeading
        eyebrow="Inventario oficial"
        title="Propiedades actuales de Sur Realista"
        description="Consulta el inventario comercial vigente publicado por Sur Realista y verifica cuándo fue incorporada o actualizada cada propiedad."
        outcome="Obtienes una vista consolidada de las propiedades activas, con ubicación, superficie, precio disponible y acceso directo a la publicación original."
        actions={
          <Button onClick={() => void syncNow()} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar ahora
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{properties.length}</p><p className="text-sm text-muted-foreground">Propiedades vigentes</p></div></CardContent></Card>
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{regions}</p><p className="text-sm text-muted-foreground">Regiones representadas</p></div></CardContent></Card>
        <Card className="col-span-2 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Última sincronización registrada</p><p className="mt-1 font-medium">{lastSync}</p>{lastResult && <p className="mt-1 text-xs text-muted-foreground">{lastResult}</p>}</CardContent></Card>
      </div>

      {error && <Card className="border-destructive shadow-none"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Inventario publicado</CardTitle>
          <CardDescription>Solo se muestran registros activos provenientes de la fuente oficial configurada.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="relative mb-5 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar campo, comuna o región..." className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
          </label>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando inventario…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No hay propiedades activas que coincidan con la búsqueda.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property) => {
                const image = property.images?.find(Boolean)
                return (
                  <Card key={property.id} className="overflow-hidden shadow-none">
                    <div className="aspect-[16/9] bg-muted/50">
                      {image ? (
                        <img src={image} alt={property.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                          Imagen no disponible en la fuente
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <h2 className="line-clamp-2 font-medium">{property.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{[property.commune || property.city, property.region].filter(Boolean).join(", ") || "Ubicación no informada"}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm"><span>{formatArea(property.area_m2)}</span><strong>{formatPrice(property.price_uf)}</strong></div>
                      <div className="flex items-center justify-between gap-3"><Badge variant="secondary">{property.property_type || "Tipo no informado"}</Badge>{property.source_url && <Button asChild size="sm" variant="outline"><Link href={property.source_url} target="_blank" rel="noreferrer">Abrir fuente <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
