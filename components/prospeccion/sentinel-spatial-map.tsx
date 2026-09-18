"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type SentinelPolygon = {
  type: "Polygon"
  coordinates: number[][][]
}

type Props = {
  polygon: SentinelPolygon
  currentImageUrl: string
  currentPeriodLabel: string
  baselineImageUrl?: string | null
  baselinePeriodLabel?: string | null
}

function boundsFor(polygon: SentinelPolygon) {
  const points = polygon.coordinates.flat().filter((point) =>
    Array.isArray(point) &&
    Number.isFinite(Number(point[0])) &&
    Number.isFinite(Number(point[1])),
  )
  if (!points.length) return null
  const lngs = points.map((point) => Number(point[0]))
  const lats = points.map((point) => Number(point[1]))
  return {
    west: Math.min(...lngs),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    north: Math.max(...lats),
  }
}

function ensureLeaflet() {
  if (typeof window === "undefined") return Promise.resolve(false)
  if ((window as any).L) return Promise.resolve(true)

  if (!document.querySelector('link[data-sur-realista-leaflet="css"]')) {
    const css = document.createElement("link")
    css.rel = "stylesheet"
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    css.crossOrigin = ""
    css.dataset.surRealistaLeaflet = "css"
    document.head.appendChild(css)
  }

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector('script[data-sur-realista-leaflet="script"]') as HTMLScriptElement | null
    if (existing) {
      if ((window as any).L) resolve(true)
      else {
        existing.addEventListener("load", () => resolve(Boolean((window as any).L)), { once: true })
        existing.addEventListener("error", () => resolve(false), { once: true })
      }
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.dataset.surRealistaLeaflet = "script"
    script.onload = () => resolve(Boolean((window as any).L))
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

export function SentinelSpatialMap({
  polygon,
  currentImageUrl,
  currentPeriodLabel,
  baselineImageUrl,
  baselinePeriodLabel,
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const objectUrlsRef = useRef<string[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const bounds = useMemo(() => boundsFor(polygon), [polygon])

  useEffect(() => {
    let cancelled = false

    async function render() {
      setStatus("loading")
      if (!nodeRef.current || !bounds) {
        setStatus("error")
        return
      }

      const [leafletReady, currentResponse, baselineResponse] = await Promise.all([
        ensureLeaflet(),
        fetch(currentImageUrl, { cache: "no-store", credentials: "same-origin" }).catch(() => null),
        baselineImageUrl
          ? fetch(baselineImageUrl, { cache: "no-store", credentials: "same-origin" }).catch(() => null)
          : Promise.resolve(null),
      ])

      if (cancelled) return
      if (!leafletReady || !currentResponse?.ok) {
        setStatus("error")
        return
      }

      const currentBlob = await currentResponse.blob()
      const baselineBlob = baselineResponse?.ok ? await baselineResponse.blob() : null
      if (cancelled) return
      const currentObjectUrl = URL.createObjectURL(currentBlob)
      const baselineObjectUrl = baselineBlob ? URL.createObjectURL(baselineBlob) : null
      objectUrlsRef.current = [currentObjectUrl, baselineObjectUrl].filter((value): value is string => Boolean(value))

      const L = (window as any).L
      if (!L || !nodeRef.current) {
        setStatus("error")
        return
      }

      mapRef.current?.remove()
      const center: [number, number] = [
        (bounds.south + bounds.north) / 2,
        (bounds.west + bounds.east) / 2,
      ]
      const map = L.map(nodeRef.current, {
        center,
        zoom: 15,
        zoomControl: false,
        preferCanvas: true,
        attributionControl: true,
      })

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 },
      ).addTo(map)
      const streets = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "© OpenStreetMap contributors", maxZoom: 19 },
      )
      const overlayBounds = [[bounds.south, bounds.west], [bounds.north, bounds.east]]
      const currentNdvi = L.imageOverlay(currentObjectUrl, overlayBounds, {
        opacity: 0.78,
        interactive: false,
        zIndex: 420,
      }).addTo(map)
      const previousNdvi = baselineObjectUrl
        ? L.imageOverlay(baselineObjectUrl, overlayBounds, {
            opacity: 0.78,
            interactive: false,
            zIndex: 419,
          })
        : null

      const leafletPolygon = polygon.coordinates.map((ring) =>
        ring.map((point) => [Number(point[1]), Number(point[0])]),
      )
      L.polygon(leafletPolygon, {
        color: "#d8eee5",
        weight: 2,
        opacity: 0.95,
        fill: false,
        interactive: false,
      }).addTo(map)

      const overlays: Record<string, any> = {
        [`NDVI actual · ${currentPeriodLabel}`]: currentNdvi,
      }
      if (previousNdvi && baselinePeriodLabel) {
        overlays[`NDVI año anterior · ${baselinePeriodLabel}`] = previousNdvi
      }
      L.control.layers(
        { Satélite: satellite, Calles: streets },
        overlays,
        { position: "topright", collapsed: false },
      ).addTo(map)
      L.control.zoom({ position: "topright" }).addTo(map)
      map.fitBounds(overlayBounds, { padding: [24, 24], maxZoom: 17 })
      mapRef.current = map
      requestAnimationFrame(() => map.invalidateSize())
      setStatus("ready")
    }

    void render()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [baselineImageUrl, baselinePeriodLabel, bounds, currentImageUrl, currentPeriodLabel, polygon])

  return (
    <div className="space-y-3">
      <div className="relative min-h-[420px] overflow-hidden border border-border bg-muted/20">
        <div
          ref={nodeRef}
          className="h-[420px] w-full"
          role="img"
          aria-label={`Mapa Sentinel-2 de comparación espacial NDVI para ${currentPeriodLabel}`}
        />
        {status === "loading" ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/65 text-sm text-muted-foreground">
            Cargando raster Sentinel-2…
          </div>
        ) : null}
        {status === "error" ? (
          <div className="absolute inset-0 grid place-items-center bg-background/90 p-8 text-center text-sm text-muted-foreground">
            No fue posible cargar la capa espacial para este período. La serie temporal y la memoria del ROL siguen disponibles.
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">NDVI</span>
          <span>menor señal</span>
          <span className="h-2.5 w-10 bg-[#383d47]" aria-hidden="true" />
          <span className="h-2.5 w-10 bg-[#3b8570]" aria-hidden="true" />
          <span className="h-2.5 w-10 bg-[#7bd18f]" aria-hidden="true" />
          <span>mayor señal</span>
        </div>
        <p className="md:text-right">
          Actual: {currentPeriodLabel}{baselinePeriodLabel ? ` · comparación: ${baselinePeriodLabel}` : ""}. Transparencia indica píxeles sin evidencia utilizable o enmascarados por nube.
        </p>
      </div>
    </div>
  )
}
