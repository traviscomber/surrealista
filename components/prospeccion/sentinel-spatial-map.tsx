"use client"

import { useEffect, useRef, useState } from "react"

type Bounds = [number, number, number, number]
type Polygon = { type: "Polygon"; coordinates: number[][][] }

export function SentinelSpatialMap({
  imageDataUrl,
  bounds,
  polygon,
}: {
  imageDataUrl: string
  bounds: Bounds
  polygon: Polygon
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const [leafletReady, setLeafletReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).L) {
      setLeafletReady(true)
      return
    }

    if (!document.querySelector('link[data-sur-realista-leaflet="css"]')) {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      css.dataset.surRealistaLeaflet = "css"
      document.head.appendChild(css)
    }

    const existing = document.querySelector('script[data-sur-realista-leaflet="script"]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => setLeafletReady(Boolean((window as any).L)), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.dataset.surRealistaLeaflet = "script"
    script.onload = () => setLeafletReady(Boolean((window as any).L))
    script.onerror = () => setError("No se pudo cargar el mapa.")
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletReady || !nodeRef.current) return
    const L = (window as any).L
    if (!L) return

    mapRef.current?.remove()
    mapRef.current = null

    try {
      const map = L.map(nodeRef.current, {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
      })
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 },
      ).addTo(map)

      const overlayBounds = L.latLngBounds(
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]],
      )
      const overlay = L.imageOverlay(imageDataUrl, overlayBounds, { opacity: 0.9, interactive: false }).addTo(map)
      const leafletRings = polygon.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]))
      const outline = L.polygon(leafletRings, {
        color: "#f5f5f4",
        weight: 2,
        opacity: 0.9,
        fill: false,
      }).addTo(map)

      L.control.layers({ Satélite: satellite }, { "Cambio NDVI": overlay, "Polígono CIREN": outline }, { position: "topright" }).addTo(map)
      L.control.zoom({ position: "topright" }).addTo(map)
      map.fitBounds(overlayBounds, { padding: [18, 18], maxZoom: 17 })
      mapRef.current = map
      window.requestAnimationFrame(() => map.invalidateSize())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo inicializar el mapa.")
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [leafletReady, imageDataUrl, bounds, polygon])

  if (error) return <div className="flex h-[360px] items-center justify-center border border-border text-sm text-muted-foreground">{error}</div>

  return <div ref={nodeRef} className="h-[360px] w-full overflow-hidden border border-border bg-muted/20" aria-label="Mapa espacial de cambio NDVI dentro del polígono CIREN" />
}
