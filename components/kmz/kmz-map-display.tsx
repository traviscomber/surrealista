"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, Layers3, Loader2, Maximize, Minimize } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { reverseGeocoder, type ChileanLocationDetails } from "@/lib/geocoding/reverse-geocode"
import { Button } from "@/components/ui/button"

interface KMZMapDisplayProps {
  kmzFiles?: KMZData[]
  height?: string
  centerCoordinates?: { lat: number; lng: number }
  onPlacemarkSelect?: (placemark: LayerInfo | null) => void
  enableGeocoding?: boolean
  selectedKmzId?: string | null
}

export interface LayerInfo {
  name: string
  fileName: string
  layer: any
  visible: boolean
  color: string
  bounds: any[]
  description?: string | null
  geometrySource?: "placemark" | "collection-bounds"
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
}

const PALETTE = ["#2f6f55", "#2f6484", "#8a6336", "#6c5c8d", "#397167", "#7a4f45"]

function stableColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function cleanDescription(value: unknown): string | null {
  if (!value || typeof value !== "string") return null
  const cleaned = value
    .replace(/<!\[CDATA\[|\]\]>/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return cleaned || null
}

function fileDescription(file: any): string | null {
  return cleanDescription(
    file?.metadata?.description ||
      file?.description ||
      file?.metadata?.sii_point_resolution?.record?.direccion ||
      file?.metadata?.sii_point_resolution?.record?.raw?.direccion ||
      null,
  )
}

function matchesSelected(file: any, selectedId: string) {
  return [file?.id, file?.dbId, file?.metadata?.id]
    .filter((value) => value !== null && value !== undefined)
    .map(String)
    .includes(selectedId)
}

function validBounds(bounds: any) {
  if (!bounds) return false
  return [bounds.north, bounds.south, bounds.east, bounds.west].every((value) => Number.isFinite(Number(value)))
}

function popupHtml(layer: LayerInfo, center: { lat: number; lng: number }, details?: ChileanLocationDetails) {
  const location = details
    ? [details.comuna, details.provincia, details.region].filter(Boolean).join(", ")
    : null
  const sourceNote =
    layer.geometrySource === "collection-bounds"
      ? "Vista de respaldo construida con los límites persistidos del archivo. No representa el trazado exacto del polígono original."
      : null

  return `<div style="min-width:260px;max-width:360px;font-family:system-ui,sans-serif;color:#17211c">
    <h4 style="margin:0 0 8px;font-size:14px;font-weight:700;color:${layer.color}">${escapeHtml(layer.name)}</h4>
    <p style="margin:0 0 4px;font-size:12px"><strong>Archivo:</strong> ${escapeHtml(layer.fileName)}</p>
    <p style="margin:0 0 4px;font-size:12px"><strong>Centro:</strong> ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</p>
    ${location ? `<p style="margin:0 0 4px;font-size:12px"><strong>Ubicación:</strong> ${escapeHtml(location)}</p>` : ""}
    ${layer.description ? `<div style="margin-top:9px;padding-top:9px;border-top:1px solid #dfe5e1;font-size:12px;line-height:1.45;white-space:pre-wrap">${escapeHtml(layer.description)}</div>` : ""}
    ${sourceNote ? `<div style="margin-top:9px;padding:8px;border-radius:6px;background:#fff7df;color:#6f5012;font-size:11px;line-height:1.4">${escapeHtml(sourceNote)}</div>` : ""}
  </div>`
}

export function KMZMapDisplay({
  kmzFiles = [],
  height = "600px",
  centerCoordinates,
  onPlacemarkSelect,
  enableGeocoding = true,
  selectedKmzId = null,
}: KMZMapDisplayProps) {
  const mapNodeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const renderedLayersRef = useRef<any[]>([])
  const clientMarkerRef = useRef<any>(null)
  const [leafletReady, setLeafletReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(true)

  const displayFiles = useMemo(() => {
    const safe = Array.isArray(kmzFiles) ? kmzFiles : []
    if (!selectedKmzId) return safe
    const selected = safe.filter((file: any) => matchesSelected(file, String(selectedKmzId)))
    return selected.length > 0 ? selected : safe.length === 1 ? safe : []
  }, [kmzFiles, selectedKmzId])

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).L) {
      setLeafletReady(true)
      return
    }

    const existingCss = document.querySelector('link[data-sur-realista-leaflet="true"]')
    if (!existingCss) {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      css.dataset.surRealistaLeaflet = "true"
      document.head.appendChild(css)
    }

    const existingScript = document.querySelector('script[data-sur-realista-leaflet="true"]') as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletReady(true), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.dataset.surRealistaLeaflet = "true"
    script.onload = () => setLeafletReady(true)
    script.onerror = () => setMapError("No se pudo cargar el motor del mapa.")
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapNodeRef.current || mapRef.current) return
    const L = (window as any).L
    if (!L) return

    try {
      const map = L.map(mapNodeRef.current, { center: [-41, -72.5], zoom: 7, zoomControl: false })
      const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri", maxZoom: 19 },
      )
      L.control.layers({ Calles: streets, Satélite: satellite }, undefined, { position: "topright" }).addTo(map)
      L.control.zoom({ position: "topright" }).addTo(map)
      mapRef.current = map
      window.requestAnimationFrame(() => map.invalidateSize())
    } catch (error) {
      console.error("[KMZ map] init error", error)
      setMapError("No se pudo inicializar el mapa.")
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [leafletReady])

  useEffect(() => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return

    setLoading(true)
    renderedLayersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer)
    })
    renderedLayersRef.current = []

    const nextLayers: LayerInfo[] = []
    const allCoordinates: [number, number][] = []

    const register = async (
      file: any,
      name: string,
      leafletLayer: any,
      bounds: [number, number][],
      description: string | null,
      geometrySource: LayerInfo["geometrySource"],
    ) => {
      const color = stableColor(`${file.fileName}-${name}`)
      const centerBounds = L.latLngBounds(bounds)
      const center = centerBounds.getCenter()
      const layerInfo: LayerInfo = {
        name,
        fileName: file.fileName,
        layer: leafletLayer,
        visible: true,
        color,
        bounds,
        description,
        geometrySource,
        isLoadingLocation: enableGeocoding,
      }
      leafletLayer.bindPopup(popupHtml(layerInfo, center))
      leafletLayer.on("click", () => {
        onPlacemarkSelect?.(layerInfo)
      })
      nextLayers.push(layerInfo)
      renderedLayersRef.current.push(leafletLayer)
      allCoordinates.push(...bounds)

      if (enableGeocoding) {
        try {
          const details = await reverseGeocoder.getLocationDetails(center.lat, center.lng)
          layerInfo.locationDetails = details
          layerInfo.isLoadingLocation = false
          leafletLayer.setPopupContent(popupHtml(layerInfo, center, details))
          setLayers([...nextLayers])
        } catch {
          layerInfo.isLoadingLocation = false
        }
      }
    }

    const render = async () => {
      for (const file of displayFiles as any[]) {
        const placemarks = Array.isArray(file?.placemarks) ? file.placemarks : []
        let rendered = 0

        for (const placemark of placemarks) {
          const coords = Array.isArray(placemark?.coordinates) ? placemark.coordinates : []
          const color = stableColor(`${file.fileName}-${placemark?.name || "capa"}`)
          const description = cleanDescription(placemark?.description) || fileDescription(file)

          if (placemark?.type === "Point" && coords.length > 0) {
            const [lng, lat] = coords[0] || []
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
            const marker = L.marker([lat, lng], { isKMZ: true }).addTo(map)
            await register(file, placemark.name || "Punto", marker, [[lat, lng]], description, "placemark")
            rendered++
            continue
          }

          const latLngs = coords
            .map(([lng, lat]: [number, number]) => [Number(lat), Number(lng)] as [number, number])
            .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))
          if (latLngs.length < 2) continue

          const shape =
            placemark?.type === "Polygon"
              ? L.polygon(latLngs, { color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.22, isKMZ: true }).addTo(map)
              : L.polyline(latLngs, { color, weight: 3, opacity: 0.9, isKMZ: true }).addTo(map)
          await register(file, placemark.name || placemark.type || "Capa", shape, latLngs, description, "placemark")
          rendered++
        }

        if (rendered === 0 && validBounds(file?.bounds)) {
          const bounds = file.bounds
          const latLngs: [number, number][] = [
            [Number(bounds.south), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.east)],
            [Number(bounds.south), Number(bounds.east)],
          ]
          const color = stableColor(file.fileName || "kmz")
          const rectangle = L.polygon(latLngs, {
            color,
            weight: 2,
            dashArray: "7 6",
            opacity: 0.95,
            fillColor: color,
            fillOpacity: 0.12,
            isKMZ: true,
          }).addTo(map)
          const description = fileDescription(file)
          await register(
            file,
            `${file.fileName || "KMZ"} · límites disponibles`,
            rectangle,
            latLngs,
            description,
            "collection-bounds",
          )
        }
      }

      setLayers(nextLayers)
      setLoading(false)
      if (allCoordinates.length > 0) {
        map.fitBounds(L.latLngBounds(allCoordinates), { padding: [48, 48], maxZoom: 15 })
      }
    }

    void render()
  }, [displayFiles, enableGeocoding, onPlacemarkSelect])

  useEffect(() => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L || !centerCoordinates) return
    if (!Number.isFinite(centerCoordinates.lat) || !Number.isFinite(centerCoordinates.lng)) return

    if (clientMarkerRef.current && map.hasLayer(clientMarkerRef.current)) map.removeLayer(clientMarkerRef.current)
    clientMarkerRef.current = L.circleMarker([centerCoordinates.lat, centerCoordinates.lng], {
      radius: 6,
      color: "#1f5d48",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 1,
    }).addTo(map)
    map.panTo([centerCoordinates.lat, centerCoordinates.lng])
  }, [centerCoordinates])

  useEffect(() => {
    const map = mapRef.current
    const node = containerRef.current
    if (!map || !node) return
    const observer = new ResizeObserver(() => window.requestAnimationFrame(() => map.invalidateSize()))
    observer.observe(node)
    return () => observer.disconnect()
  }, [leafletReady])

  useEffect(() => {
    const handler = () => {
      setFullscreen(Boolean(document.fullscreenElement))
      window.setTimeout(() => mapRef.current?.invalidateSize(), 120)
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const toggleLayer = (index: number) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry
        if (entry.visible) map.removeLayer(entry.layer)
        else entry.layer.addTo(map)
        return { ...entry, visible: !entry.visible }
      }),
    )
  }

  const zoomLayer = (entry: LayerInfo) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L || entry.bounds.length === 0) return
    map.fitBounds(L.latLngBounds(entry.bounds), { padding: [48, 48], maxZoom: 16 })
    entry.layer.openPopup?.()
    onPlacemarkSelect?.(entry)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await containerRef.current.requestFullscreen()
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center bg-destructive/5" style={{ height }}>
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <p className="font-medium text-destructive">{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-muted" style={{ height: fullscreen ? "100vh" : height }}>
      <div ref={mapNodeRef} className="h-full w-full" />

      {!leafletReady || loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando geometría y ubicación…
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-[600] flex gap-2">
        <Button type="button" size="sm" variant="outline" className="bg-background/95" onClick={() => setLayersOpen((value) => !value)}>
          <Layers3 className="mr-2 h-4 w-4" />
          {layers.length} {layers.length === 1 ? "capa" : "capas"}
        </Button>
        <Button type="button" size="icon" variant="outline" className="bg-background/95" onClick={toggleFullscreen} aria-label={fullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {layersOpen ? (
        <div className="absolute left-3 top-14 z-[600] max-h-[55%] w-80 overflow-y-auto rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
          {layers.length === 0 && !loading ? (
            <div className="p-3 text-sm text-muted-foreground">No hay geometría ni límites disponibles para este archivo.</div>
          ) : (
            layers.map((entry, index) => (
              <div key={`${entry.fileName}-${entry.name}-${index}`} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/60">
                <button type="button" className="mt-0.5" onClick={() => toggleLayer(index)} aria-label={entry.visible ? "Ocultar capa" : "Mostrar capa"}>
                  {entry.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomLayer(entry)}>
                  <span className="block truncate text-sm font-medium">{entry.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {entry.geometrySource === "collection-bounds" ? "Límites de respaldo" : entry.fileName}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
