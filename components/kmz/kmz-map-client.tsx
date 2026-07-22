"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Loader2, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("No fue posible cargar las ubicaciones.")
  return response.json()
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function isValidCoordinate(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export default function KMZMapClient() {
  const searchParams = useSearchParams()
  const kmzId = searchParams.get("kmzId")
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const endpoint = kmzId ? `/api/kmz/get-by-id?kmzId=${encodeURIComponent(kmzId)}` : "/api/kmz/search?q="
  const { data, error, isLoading } = useSWR(endpoint, fetcher, { revalidateOnFocus: false })

  const rawLocations = kmzId ? data?.locations : data?.results?.filter((item: any) => item.type === "location")
  const locations = Array.isArray(rawLocations)
    ? rawLocations.filter((item: any) => isValidCoordinate(item.latitude, item.longitude))
    : []
  const kmzName = kmzId && data?.kmz?.name ? String(data.kmz.name) : null

  useEffect(() => {
    if (typeof window === "undefined") return

    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    const existingCss = document.querySelector<HTMLLinkElement>('link[data-sur-realista-leaflet="css"]')
    if (!existingCss) {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      css.crossOrigin = ""
      css.dataset.surRealistaLeaflet = "css"
      document.head.appendChild(css)
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-sur-realista-leaflet="script"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletLoaded(true), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    script.crossOrigin = ""
    script.dataset.surRealistaLeaflet = "script"
    script.onload = () => setLeafletLoaded(Boolean((window as any).L))
    script.onerror = () => setMapError("No fue posible cargar el proveedor cartográfico.")
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const L = (window as any).L
      const map = L.map(mapRef.current, { center: [-41, -72.5], zoom: 8 })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)
      mapInstanceRef.current = map
    } catch {
      setMapError("No fue posible inicializar el mapa.")
    }

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [leafletLoaded])

  useEffect(() => {
    const map = mapInstanceRef.current
    const L = typeof window !== "undefined" ? (window as any).L : null
    if (!map || !L) return

    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer)
    })

    const bounds: [number, number][] = []

    locations.forEach((location: any) => {
      const latitude = Number(location.latitude)
      const longitude = Number(location.longitude)
      bounds.push([latitude, longitude])

      const marker = L.circleMarker([latitude, longitude], {
        radius: 6,
        fillColor: "hsl(150 25% 45%)",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map)

      const name = escapeHtml(location.name || "Ubicación sin nombre")
      const region = escapeHtml(location.region || "Sin dato")
      const address = location.address
        ? `<p style="margin:4px 0 0;font-size:12px;"><strong>Dirección:</strong> ${escapeHtml(location.address)}</p>`
        : ""

      marker.bindPopup(
        `<div style="min-width:220px"><strong>${name}</strong><p style="margin:6px 0 0;font-size:12px"><strong>Región:</strong> ${region}</p><p style="margin:4px 0 0;font-size:12px"><strong>Coordenadas:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>${address}</div>`,
      )
    })

    if (bounds.length === 1) map.setView(bounds[0], 13)
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] })
  }, [locations])

  const visibleError = mapError || (error instanceof Error ? error.message : null)

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Cobertura territorial"
        title={kmzName ? `Ubicaciones de ${kmzName}` : "Mapa de ubicaciones KMZ"}
        description="Visualiza únicamente ubicaciones indexadas que incluyen coordenadas válidas."
        outcome="El mapa permite verificar distribución territorial y abrir el detalle básico de cada punto."
        actions={kmzId ? <Button variant="outline" onClick={() => window.history.back()}><X className="mr-2 h-4 w-4" />Volver</Button> : undefined}
      />

      <Card className="overflow-hidden border-border/70">
        <div className="relative h-[600px] bg-muted">
          <div ref={mapRef} className="h-full w-full" />

          {(isLoading || !leafletLoaded) && !visibleError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="mt-3 text-sm font-medium">Cargando cobertura territorial…</p>
              </div>
            </div>
          ) : null}

          {visibleError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 px-6 text-center">
              <div>
                <MapPin className="mx-auto h-6 w-6 text-destructive" />
                <p className="mt-3 font-medium">{visibleError}</p>
                <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardContent className="py-5 text-sm text-muted-foreground">
          Se muestran <strong className="text-foreground">{locations.length}</strong> ubicaciones con coordenadas válidas
          {kmzName ? ` del archivo ${kmzName}` : " en la consulta actual"}.
        </CardContent>
      </Card>
    </main>
  )
}
