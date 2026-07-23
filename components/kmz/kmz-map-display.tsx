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
  bounds: [number, number][]
  description?: string | null
  geometrySource?: "placemark" | "collection-bounds" | "selected-center"
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
}

const COLORS = ["#2f6f55", "#2f6484", "#8a6336", "#6c5c8d", "#397167", "#7a4f45"]

function getColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
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

function selectedFileMatches(file: any, selectedId: string) {
  return [file?.id, file?.dbId, file?.metadata?.id]
    .filter((value) => value !== null && value !== undefined)
    .map(String)
    .includes(selectedId)
}

function isValidBounds(bounds: any) {
  return Boolean(bounds) && [bounds.north, bounds.south, bounds.east, bounds.west].every((value) => Number.isFinite(Number(value)))
}

function getFileDescription(file: any) {
  const placemarkDescription = Array.isArray(file?.placemarks)
    ? file.placemarks.map((placemark: any) => cleanDescription(placemark?.description)).find(Boolean)
    : null
  return (
    placemarkDescription ||
    cleanDescription(file?.description) ||
    cleanDescription(file?.metadata?.description) ||
    cleanDescription(file?.metadata?.sii_point_resolution?.record?.direccion) ||
    cleanDescription(file?.metadata?.sii_point_resolution?.record?.raw?.direccion) ||
    null
  )
}

function buildPopup(layer: LayerInfo, center: { lat: number; lng: number }, details?: ChileanLocationDetails) {
  const location = details ? [details.comuna, details.provincia, details.region].filter(Boolean).join(", ") : null
  const sourceMessage =
    layer.geometrySource === "collection-bounds"
      ? "Los límites mostrados provienen del encuadre persistido del archivo y no sustituyen el polígono original."
      : layer.geometrySource === "selected-center"
        ? "Punto de referencia calculado desde la ubicación disponible para el archivo seleccionado."
        : null

  return `<div style="min-width:260px;max-width:360px;font-family:system-ui,sans-serif;color:#17211c">
    <h4 style="margin:0 0 8px;font-size:14px;font-weight:700;color:${layer.color}">${escapeHtml(layer.name)}</h4>
    <p style="margin:0 0 4px;font-size:12px"><strong>Archivo:</strong> ${escapeHtml(layer.fileName)}</p>
    <p style="margin:0 0 4px;font-size:12px"><strong>Coordenadas:</strong> ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</p>
    ${location ? `<p style="margin:0 0 4px;font-size:12px"><strong>Ubicación:</strong> ${escapeHtml(location)}</p>` : ""}
    ${layer.description ? `<div style="margin-top:9px;padding-top:9px;border-top:1px solid #dfe5e1;font-size:12px;line-height:1.45;white-space:pre-wrap">${escapeHtml(layer.description)}</div>` : ""}
    ${sourceMessage ? `<div style="margin-top:9px;padding:8px;border-radius:6px;background:#fff7df;color:#6f5012;font-size:11px;line-height:1.4">${escapeHtml(sourceMessage)}</div>` : ""}
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
  const renderedRef = useRef<any[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(true)

  const displayFiles = useMemo(() => {
    const safeFiles = Array.isArray(kmzFiles) ? (kmzFiles as any[]) : []
    if (!selectedKmzId) return safeFiles
    const matched = safeFiles.filter((file) => selectedFileMatches(file, String(selectedKmzId)))
    if (matched.length > 0) return matched
    return safeFiles.length === 1 ? safeFiles : []
  }, [kmzFiles, selectedKmzId])

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    if (!document.querySelector('link[data-sur-realista-leaflet="css"]')) {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      css.dataset.surRealistaLeaflet = "css"
      document.head.appendChild(css)
    }

    const existingScript = document.querySelector('script[data-sur-realista-leaflet="script"]') as HTMLScriptElement | null
    if (existingScript) {
      if ((window as any).L) setLeafletLoaded(true)
      else existingScript.addEventListener("load", () => setLeafletLoaded(true), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.dataset.surRealistaLeaflet = "script"
    script.onload = () => setLeafletLoaded(Boolean((window as any).L))
    script.onerror = () => setError("No se pudo cargar el motor del mapa.")
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapNodeRef.current || mapRef.current) return
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
      setMapReady(true)
      window.requestAnimationFrame(() => map.invalidateSize())
    } catch (mapError) {
      console.error("[KMZ map] initialization failed", mapError)
      setError("No se pudo inicializar el mapa.")
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return

    let cancelled = false
    setLoading(true)
    renderedRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer)
    })
    renderedRef.current = []

    const nextLayers: LayerInfo[] = []
    const allBounds: [number, number][] = []

    const addLayer = async (
      file: any,
      name: string,
      shape: any,
      bounds: [number, number][],
      description: string | null,
      geometrySource: LayerInfo["geometrySource"],
      pinAtCenter = false,
    ) => {
      const color = getColor(`${file.fileName}-${name}`)
      const centerPoint = L.latLngBounds(bounds).getCenter()
      const info: LayerInfo = {
        name,
        fileName: file.fileName || "Archivo KMZ",
        layer: shape,
        visible: true,
        color,
        bounds,
        description,
        geometrySource,
        isLoadingLocation: enableGeocoding,
      }

      shape.bindPopup(buildPopup(info, centerPoint))
      shape.on("click", () => onPlacemarkSelect?.(info))
      renderedRef.current.push(shape)
      nextLayers.push(info)
      allBounds.push(...bounds)

      if (pinAtCenter) {
        const pin = L.circleMarker([centerPoint.lat, centerPoint.lng], {
          radius: 7,
          color: "#ffffff",
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
          isKMZ: true,
        }).addTo(map)
        pin.bindPopup(buildPopup(info, centerPoint))
        pin.on("click", () => {
          onPlacemarkSelect?.(info)
          shape.openPopup?.()
        })
        renderedRef.current.push(pin)
      }

      if (enableGeocoding) {
        try {
          const details = await reverseGeocoder.getLocationDetails(centerPoint.lat, centerPoint.lng)
          if (cancelled) return
          info.locationDetails = details
          info.isLoadingLocation = false
          const popup = buildPopup(info, centerPoint, details)
          shape.setPopupContent(popup)
        } catch {
          info.isLoadingLocation = false
        }
      }
    }

    const render = async () => {
      for (const file of displayFiles) {
        const placemarks = Array.isArray(file?.placemarks) ? file.placemarks : []
        let geometryCount = 0

        for (const placemark of placemarks) {
          const coordinates = Array.isArray(placemark?.coordinates) ? placemark.coordinates : []
          const description = cleanDescription(placemark?.description) || getFileDescription(file)
          const color = getColor(`${file.fileName}-${placemark?.name || "capa"}`)

          if (placemark?.type === "Point" && coordinates.length > 0) {
            const [lng, lat] = coordinates[0] || []
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue
            const marker = L.marker([Number(lat), Number(lng)], { isKMZ: true }).addTo(map)
            await addLayer(file, placemark.name || "Punto", marker, [[Number(lat), Number(lng)]], description, "placemark")
            geometryCount++
            continue
          }

          const latLngs = coordinates
            .map(([lng, lat]: [number, number]) => [Number(lat), Number(lng)] as [number, number])
            .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))
          if (latLngs.length < 2) continue

          const shape =
            placemark?.type === "Polygon"
              ? L.polygon(latLngs, { color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.22, isKMZ: true }).addTo(map)
              : L.polyline(latLngs, { color, weight: 3, opacity: 0.9, isKMZ: true }).addTo(map)
          await addLayer(file, placemark.name || placemark.type || "Capa", shape, latLngs, description, "placemark", true)
          geometryCount++
        }

        if (geometryCount === 0 && isValidBounds(file?.bounds)) {
          const bounds = file.bounds
          const latLngs: [number, number][] = [
            [Number(bounds.south), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.east)],
            [Number(bounds.south), Number(bounds.east)],
          ]
          const color = getColor(file.fileName || "kmz")
          const rectangle = L.polygon(latLngs, {
            color,
            weight: 2,
            dashArray: "7 6",
            opacity: 0.95,
            fillColor: color,
            fillOpacity: 0.12,
            isKMZ: true,
          }).addTo(map)
          await addLayer(
            file,
            `${file.fileName || "KMZ"} · ubicación`,
            rectangle,
            latLngs,
            getFileDescription(file),
            "collection-bounds",
            true,
          )
        }
      }

      if (nextLayers.length === 0 && centerCoordinates && Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.lng)) {
        const file = displayFiles[0] || { fileName: "KMZ seleccionado" }
        const color = getColor(file.fileName || "selected")
        const marker = L.marker([centerCoordinates.lat, centerCoordinates.lng], { isKMZ: true }).addTo(map)
        await addLayer(
          file,
          file.fileName || "Ubicación del KMZ",
          marker,
          [[centerCoordinates.lat, centerCoordinates.lng]],
          getFileDescription(file),
          "selected-center",
        )
      }

      if (cancelled) return
      setLayers([...nextLayers])
      setLoading(false)
      if (allBounds.length === 1) map.setView(allBounds[0], 14)
      else if (allBounds.length > 1) map.fitBounds(L.latLngBounds(allBounds), { padding: [48, 48], maxZoom: 15 })
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [mapReady, displayFiles, centerCoordinates, enableGeocoding, onPlacemarkSelect])

  useEffect(() => {
    if (!mapReady || !containerRef.current) return
    const observer = new ResizeObserver(() => window.requestAnimationFrame(() => mapRef.current?.invalidateSize()))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [mapReady])

  useEffect(() => {
    const handler = () => {
      setFullscreen(Boolean(document.fullscreenElement))
      window.setTimeout(() => mapRef.current?.invalidateSize(), 100)
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
    if (!map || !L) return
    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 15)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [48, 48], maxZoom: 16 })
    entry.layer.openPopup?.()
    onPlacemarkSelect?.(entry)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await containerRef.current.requestFullscreen()
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-destructive/5" style={{ height }}>
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <p className="font-medium text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-muted" style={{ height: fullscreen ? "100vh" : height }}>
      <div ref={mapNodeRef} className="h-full w-full" />

      {!mapReady || loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/45 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando ubicación y capas…
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
            <div className="p-3 text-sm text-muted-foreground">No hay geometría ni ubicación disponible para este archivo.</div>
          ) : (
            layers.map((entry, index) => (
              <div key={`${entry.fileName}-${entry.name}-${index}`} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/60">
                <button type="button" className="mt-0.5" onClick={() => toggleLayer(index)} aria-label={entry.visible ? "Ocultar capa" : "Mostrar capa"}>
                  {entry.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomLayer(entry)}>
                  <span className="block truncate text-sm font-medium">{entry.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {entry.geometrySource === "placemark" ? entry.fileName : "Ubicación recuperada"}
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
