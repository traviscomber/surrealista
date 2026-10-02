"use client"

import { useEffect, useMemo, useState } from "react"
import { Anchor, Building2, ExternalLink, FileText, FolderOpen, MapPin, Mountain, Plane, Route, Trees, UserRound } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  calculateDistance,
  estimateTravelTime,
  findLocationDetails,
  findNearestAirport,
  findNearestCities,
  findNearestNationalPark,
  findNearestPort,
  getClimateZone,
} from "@/lib/chile-geographic-data"

export interface KMZDetailRecord {
  id: string
  file_name: string
  file_path: string
  drive_file_id?: string | null
  description?: string | null
  metadata?: Record<string, any> | null
  placemarks_count: number
  rol_numbers: string[]
  bounds?: Record<string, any> | null
  tags?: string[]
  category?: string | null
  owner?: string | null
  pic?: string | null
  pic_phone?: string | null
  pic_email?: string | null
  google_docs_link?: string | null
  region?: string | null
  created_at?: string
  updated_at?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  kmz: KMZDetailRecord | null
  onEdit?: () => void
}

function operationalCenter(kmz: KMZDetailRecord | null) {
  if (!kmz) return null
  const manual = kmz.metadata?.manual_location
  const lat = Number(manual?.lat)
  const lng = Number(manual?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng, source: "Ubicación manual" }

  const north = Number(kmz.bounds?.north)
  const south = Number(kmz.bounds?.south)
  const east = Number(kmz.bounds?.east)
  const west = Number(kmz.bounds?.west)
  if ([north, south, east, west].every(Number.isFinite)) {
    return { lat: (north + south) / 2, lng: (east + west) / 2, source: "Centro del KMZ" }
  }
  return null
}

export function KMZDetailModal({ open, onOpenChange, kmz, onEdit }: Props) {
  const [locations, setLocations] = useState<any[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const center = useMemo(() => operationalCenter(kmz), [kmz])

  useEffect(() => {
    if (!open || !kmz?.id) return
    setLoadingLocations(true)
    fetch(`/api/kmz/get-by-id?kmzId=${encodeURIComponent(kmz.id)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("No se pudo cargar el detalle KMZ")))
      .then((payload) => setLocations(Array.isArray(payload?.locations) ? payload.locations : []))
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false))
  }, [open, kmz?.id])

  const context = useMemo(() => {
    if (!center) return null
    const location = findLocationDetails(center.lat, center.lng)
    const cities = findNearestCities(center.lat, center.lng, 5)
    const airport = findNearestAirport(center.lat, center.lng)
    const airportDistance = calculateDistance(center.lat, center.lng, airport.lat, airport.lng)
    const port = findNearestPort(center.lat, center.lng)
    const park = findNearestNationalPark(center.lat, center.lng)
    const climate = getClimateZone(center.lat)
    return { location, cities, airport, airportDistance, port, park, climate }
  }, [center])

  if (!kmz) return null

  const driveLink = kmz.google_docs_link || (kmz.drive_file_id ? `https://drive.google.com/open?id=${encodeURIComponent(kmz.drive_file_id)}` : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{kmz.file_name}</DialogTitle>
              <DialogDescription className="mt-1">Ficha territorial y documental del KMZ</DialogDescription>
            </div>
            <div className="flex gap-2">
              {driveLink && (
                <Button asChild variant="outline" size="sm">
                  <a href={driveLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Google Drive
                  </a>
                </Button>
              )}
              {onEdit && <Button size="sm" onClick={onEdit}>Editar información</Button>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Región</div><div className="mt-1 font-medium">{kmz.region || "No informada"}</div></div>
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Categoría</div><div className="mt-1 font-medium">{kmz.category || "No informada"}</div></div>
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Ubicaciones</div><div className="mt-1 font-medium">{kmz.placemarks_count || locations.length || 0}</div></div>
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Roles</div><div className="mt-1 font-medium">{kmz.rol_numbers?.length || 0}</div></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><FolderOpen className="h-4 w-4" /> Origen y documentación</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Ruta Google Drive</dt><dd className="break-all font-medium">{kmz.file_path || "No informada"}</dd></div>
                <div><dt className="text-muted-foreground">Drive ID</dt><dd className="break-all font-mono text-xs">{kmz.drive_file_id || "No enlazado"}</dd></div>
                <div><dt className="text-muted-foreground">Descripción</dt><dd>{kmz.description || "No informada"}</dd></div>
              </dl>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4" /> Responsable</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Dueño</dt><dd className="font-medium">{kmz.owner || "No informado"}</dd></div>
                <div><dt className="text-muted-foreground">PIC</dt><dd>{kmz.pic || "No informado"}</dd></div>
                <div><dt className="text-muted-foreground">Contacto</dt><dd>{[kmz.pic_phone, kmz.pic_email].filter(Boolean).join(" · ") || "No informado"}</dd></div>
              </dl>
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" /> Ubicación territorial</h3>
            {center && context ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">{center.source}</div>
                  <div className="font-mono text-sm">{center.lat.toFixed(6)}, {center.lng.toFixed(6)}</div>
                </div>
                <div><div className="text-xs text-muted-foreground">Comuna aproximada</div><div className="font-medium">{context.location.comuna?.name || "No determinada"}</div></div>
                <div><div className="text-xs text-muted-foreground">Provincia</div><div className="font-medium">{context.location.province?.name || "No determinada"}</div></div>
                <div><div className="text-xs text-muted-foreground">Capital regional</div><div className="font-medium">{context.location.nearestRegionalCapital ? `${context.location.nearestRegionalCapital.name} · ${Math.round(context.location.nearestRegionalCapital.distance)} km` : "No determinada"}</div></div>
                <div><div className="text-xs text-muted-foreground">Capital provincial</div><div className="font-medium">{context.location.nearestProvincialCapital ? `${context.location.nearestProvincialCapital.name} · ${Math.round(context.location.nearestProvincialCapital.distance)} km` : "No determinada"}</div></div>
                <div><div className="text-xs text-muted-foreground">Capital comunal</div><div className="font-medium">{context.location.nearestCommuneCapital ? `${context.location.nearestCommuneCapital.name} · ${Math.round(context.location.nearestCommuneCapital.distance)} km` : "No determinada"}</div></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin coordenadas suficientes para contexto territorial.</p>}
          </section>

          {context && (
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Ciudades cercanas</h3>
                <div className="space-y-2">
                  {context.cities.map((city) => (
                    <div key={city.name} className="flex items-center justify-between border-b py-2 last:border-0">
                      <div><div className="font-medium">{city.name}</div><div className="text-xs text-muted-foreground">{city.region}</div></div>
                      <div className="text-right"><div className="font-medium">{Math.round(city.distance)} km</div><div className="text-xs text-muted-foreground">{estimateTravelTime(city.distance)}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Route className="h-4 w-4" /> Conectividad y entorno</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2"><Plane className="mt-0.5 h-4 w-4" /><div><div className="font-medium">{context.airport.name} ({context.airport.code})</div><div className="text-muted-foreground">{Math.round(context.airportDistance)} km · {estimateTravelTime(context.airportDistance)}</div></div></div>
                  <div className="flex gap-2"><Anchor className="mt-0.5 h-4 w-4" /><div><div className="font-medium">{context.port.name}</div><div className="text-muted-foreground">{Math.round(context.port.distance)} km · {context.port.type}</div></div></div>
                  <div className="flex gap-2"><Trees className="mt-0.5 h-4 w-4" /><div><div className="font-medium">{context.park.name}</div><div className="text-muted-foreground">{Math.round(context.park.distance)} km</div></div></div>
                  <div className="flex gap-2"><Mountain className="mt-0.5 h-4 w-4" /><div><div className="font-medium">{context.climate?.name || "Zona climática no determinada"}</div><div className="text-muted-foreground">{context.climate?.description || ""}</div></div></div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-xl border p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Roles y ubicaciones del KMZ</h3>
            <div className="mb-3 flex flex-wrap gap-1">
              {(kmz.rol_numbers || []).length ? kmz.rol_numbers.map((rol) => <Badge key={rol} variant="outline">{rol}</Badge>) : <span className="text-sm text-muted-foreground">Sin roles asociados.</span>}
            </div>
            {loadingLocations ? (
              <p className="text-sm text-muted-foreground">Cargando ubicaciones…</p>
            ) : locations.length ? (
              <div className="max-h-52 divide-y overflow-y-auto rounded border">
                {locations.slice(0, 100).map((location) => (
                  <div key={location.id} className="grid gap-1 px-3 py-2 text-sm md:grid-cols-[1fr_auto]">
                    <div><div className="font-medium">{location.name || "Sin nombre"}</div><div className="text-xs text-muted-foreground">{[location.city, location.region, location.address].filter(Boolean).join(" · ") || location.type || "Sin detalle territorial"}</div></div>
                    <div className="font-mono text-xs text-muted-foreground">{Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin ubicaciones indexadas.</p>}
          </section>

          <div className="text-xs text-muted-foreground">
            Última actualización del registro: {kmz.updated_at ? new Date(kmz.updated_at).toLocaleString("es-CL") : "No informada"}.
            Los datos de ciudades, distancias y entorno son contexto derivado desde la coordenada operativa; la geometría original del KMZ permanece separada.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
