"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Focus,
  Layers3,
  Loader2,
  MapPin,
  Maximize,
  Minimize,
  Route,
  Shapes,
  Square,
} from "lucide-react"
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
  key: string
  fileId: string
  name: string
  fileName: string
  layer: any
  visible: boolean
  color: string
  bounds: [number, number][]
  description?: string | null
  geometryType?: "Polygon" | "LineString" | "Point" | "Bounds" | "Reference"
  geometrySource?: "placemark" | "collection-bounds" | "selected-center"
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
}

interface FileLayerGroup {
  fileId: string
  fileName: string
  color: string
  layers: LayerInfo[]
  visibleCount: number
}

const COLORS = ["#2f6f55", "#2f6484", "#8a6336", "#6c5c8d", "#397167", "#7a4f45", "#92684f", "#46647b"]
const RENDER_BATCH_SIZE = 120

function getColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getFileId(file: any, index = 0) {
  return String(file?.id ?? file?.dbId ?? file?.metadata?.id ?? `${file?.fileName || "kmz"}-${index}`)
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
  return placemarkDescription || cleanDescription(file?.description) || cleanDescription(file?.metadata?.description) || null
}

function getGeometryType(placemark: any): LayerInfo["geometryType"] {
  const type = String(placemark?.type || "").toLowerCase()
  if (type.includes("polygon")) return "Polygon"
  if (type.includes("line")) return "LineString"
  return "Point"
}

function GeometryIcon({ type }: { type?: LayerInfo["geometryType"] }) {
  if (type === "Polygon") return <Square className="h-3.5 w-3.5" />
  if (type === "LineString") return <Route className="h-3.5 w-3.5" />
  if (type === "Point" || type === "Reference") return <MapPin className="h-3.5 w-3.5" />
  return <Shapes className="h-3.5 w-3.5" />
}

function buildPopup(layer: LayerInfo, center: { lat: number; lng: number }, details?: ChileanLocationDetails) {
  const location = details ? [details.comuna, details.provincia, details.region].filter(Boolean).join(", ") : null
  const sourceMessage =
    layer.geometrySource === "collection-bounds"
      ? "Este rectángulo es solo el encuadre persistido. No reemplaza el polígono original del KMZ."
      : layer.geometrySource === "selected-center"
        ? "Punto de referencia calculado desde la ubicación disponible."
        : null

  return `<div style="min-width:260px;max-width:360px;font-family:system-ui,sans-serif;color:#17211c">
    <h4 style="margin:0 0 8px;font-size:14px;font-weight:700;color:${layer.color}">${escapeHtml(layer.name)}</h4>
    <p style="margin:0 0 4px;font-size:12px"><strong>Archivo:</strong> ${escapeHtml(layer.fileName)}</p>
    <p style="margin:0 0 4px;font-size:12px"><strong>Geometría:</strong> ${escapeHtml(layer.geometryType || "Capa")}</p>
    <p style="margin:0 0 4px;font-size:12px"><strong>Coordenadas:</strong> ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</p>
    ${location ? `<p style="margin:0 0 4px;font-size:12px"><strong>Ubicación:</strong> ${escapeHtml(location)}</p>` : ""}
    ${layer.description ? `<div style="margin-top:9px;padding-top:9px;border-top:1px solid #dfe5e1;font-size:12px;line-height:1.45;white-space:pre-wrap">${escapeHtml(layer.description)}</div>` : ""}
    ${sourceMessage ? `<div style="margin-top:9px;padding:8px;border-radius:6px;background:#fff7df;color:#6f5012;font-size:11px;line-height:1.4">${escapeHtml(sourceMessage)}</div>` : ""}
  </div>`
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
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
  const layerByKeyRef = useRef<Map<string, LayerInfo>>(new Map())
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 })
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(true)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [selectedLayerKey, setSelectedLayerKey] = useState<string | null>(null)

  const displayFiles = useMemo(() => {
    const safeFiles = Array.isArray(kmzFiles) ? (kmzFiles as any[]) : []
    if (!selectedKmzId) return safeFiles
    const matched = safeFiles.filter((file) => selectedFileMatches(file, String(selectedKmzId)))
    if (matched.length > 0) return matched
    return safeFiles.length === 1 ? safeFiles : []
  }, [kmzFiles, selectedKmzId])

  const fileGroups = useMemo<FileLayerGroup[]>(() => {
    const grouped = new Map<string, FileLayerGroup>()
    layers.forEach((entry) => {
      const current = grouped.get(entry.fileId) || {
        fileId: entry.fileId,
        fileName: entry.fileName,
        color: entry.color,
        layers: [],
        visibleCount: 0,
      }
      current.layers.push(entry)
      if (entry.visible) current.visibleCount++
      grouped.set(entry.fileId, current)
    })
    return Array.from(grouped.values()).sort((a, b) => a.fileName.localeCompare(b.fileName, "es"))
  }, [layers])

  const visibleCount = layers.filter((entry) => entry.visible).length

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
      const map = L.map(mapNodeRef.current, { center: [-41, -72.5], zoom: 7, zoomControl: false, preferCanvas: true })
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
    setRenderProgress({ current: 0, total: 0 })
    setSelectedLayerKey(null)
    onPlacemarkSelect?.(null)

    renderedRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer)
    })
    renderedRef.current = []
    layerByKeyRef.current.clear()

    const expectedTotal = displayFiles.reduce((sum, file) => {
      const count = Array.isArray(file?.placemarks) ? file.placemarks.length : 0
      return sum + Math.max(count, isValidBounds(file?.bounds) ? 1 : 0)
    }, 0)
    setRenderProgress({ current: 0, total: expectedTotal })

    const nextLayers: LayerInfo[] = []
    const allBounds: [number, number][] = []
    let renderedCount = 0

    const selectLayer = async (info: LayerInfo, openPopup = true) => {
      setSelectedLayerKey(info.key)
      onPlacemarkSelect?.(info)
      const centerPoint = L.latLngBounds(info.bounds).getCenter()
      if (openPopup) info.layer.openPopup?.()

      if (enableGeocoding && !info.locationDetails && !info.isLoadingLocation) {
        info.isLoadingLocation = true
        try {
          const details = await reverseGeocoder.getLocationDetails(centerPoint.lat, centerPoint.lng)
          if (cancelled) return
          info.locationDetails = details
          info.layer.setPopupContent(buildPopup(info, centerPoint, details))
          setLayers((current) => current.map((entry) => (entry.key === info.key ? { ...entry, locationDetails: details, isLoadingLocation: false } : entry)))
        } catch {
          info.isLoadingLocation = false
        }
      }
    }

    const addLayer = (
      file: any,
      fileId: string,
      name: string,
      shape: any,
      bounds: [number, number][],
      description: string | null,
      geometryType: LayerInfo["geometryType"],
      geometrySource: LayerInfo["geometrySource"],
      index: number,
    ) => {
      const fileName = file.fileName || "Archivo KMZ"
      const color = getColor(fileId)
      const key = `${fileId}:${geometrySource}:${index}:${name}`
      const centerPoint = L.latLngBounds(bounds).getCenter()
      const info: LayerInfo = {
        key,
        fileId,
        name,
        fileName,
        layer: shape,
        visible: true,
        color,
        bounds,
        description,
        geometryType,
        geometrySource,
        isLoadingLocation: false,
      }

      shape.bindPopup(buildPopup(info, centerPoint))
      shape.on("click", () => void selectLayer(info, false))
      renderedRef.current.push(shape)
      layerByKeyRef.current.set(key, info)
      nextLayers.push(info)
      allBounds.push(...bounds)
      renderedCount++
    }

    const render = async () => {
      for (let fileIndex = 0; fileIndex < displayFiles.length; fileIndex++) {
        if (cancelled) return
        const file = displayFiles[fileIndex]
        const fileId = getFileId(file, fileIndex)
        const fileColor = getColor(fileId)
        const placemarks = Array.isArray(file?.placemarks) ? file.placemarks : []
        let geometryCount = 0

        for (let placemarkIndex = 0; placemarkIndex < placemarks.length; placemarkIndex++) {
          if (cancelled) return
          const placemark = placemarks[placemarkIndex]
          const coordinates = Array.isArray(placemark?.coordinates) ? placemark.coordinates : []
          const description = cleanDescription(placemark?.description) || getFileDescription(file)
          const geometryType = getGeometryType(placemark)

          if (geometryType === "Point" && coordinates.length > 0) {
            const [lng, lat] = coordinates[0] || []
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue
            const marker = L.circleMarker([Number(lat), Number(lng)], {
              radius: 5,
              color: "#ffffff",
              weight: 2,
              fillColor: fileColor,
              fillOpacity: 1,
              renderer: L.canvas(),
            }).addTo(map)
            addLayer(file, fileId, placemark.name || `Punto ${placemarkIndex + 1}`, marker, [[Number(lat), Number(lng)]], description, "Point", "placemark", placemarkIndex)
            geometryCount++
          } else {
            const latLngs = coordinates
              .map(([lng, lat]: [number, number]) => [Number(lat), Number(lng)] as [number, number])
              .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))
            if (latLngs.length < 2) continue

            const shape =
              geometryType === "Polygon"
                ? L.polygon(latLngs, { color: fileColor, weight: 2, opacity: 0.92, fillColor: fileColor, fillOpacity: 0.2, renderer: L.canvas() }).addTo(map)
                : L.polyline(latLngs, { color: fileColor, weight: 2.5, opacity: 0.9, renderer: L.canvas() }).addTo(map)
            addLayer(file, fileId, placemark.name || `${geometryType} ${placemarkIndex + 1}`, shape, latLngs, description, geometryType, "placemark", placemarkIndex)
            geometryCount++
          }

          if (renderedCount % RENDER_BATCH_SIZE === 0) {
            setLayers([...nextLayers])
            setRenderProgress({ current: renderedCount, total: expectedTotal })
            await nextFrame()
          }
        }

        if (geometryCount === 0 && isValidBounds(file?.bounds)) {
          const bounds = file.bounds
          const latLngs: [number, number][] = [
            [Number(bounds.south), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.east)],
            [Number(bounds.south), Number(bounds.east)],
          ]
          const rectangle = L.polygon(latLngs, {
            color: fileColor,
            weight: 2,
            dashArray: "7 6",
            opacity: 0.95,
            fillColor: fileColor,
            fillOpacity: 0.1,
            renderer: L.canvas(),
          }).addTo(map)
          addLayer(file, fileId, `${file.fileName || "KMZ"} · encuadre`, rectangle, latLngs, getFileDescription(file), "Bounds", "collection-bounds", 0)
        }
      }

      if (nextLayers.length === 0 && centerCoordinates && Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.lng)) {
        const file = displayFiles[0] || { fileName: "KMZ seleccionado" }
        const fileId = getFileId(file)
        const marker = L.circleMarker([centerCoordinates.lat, centerCoordinates.lng], {
          radius: 7,
          color: "#ffffff",
          weight: 3,
          fillColor: getColor(fileId),
          fillOpacity: 1,
        }).addTo(map)
        addLayer(file, fileId, file.fileName || "Ubicación del KMZ", marker, [[centerCoordinates.lat, centerCoordinates.lng]], getFileDescription(file), "Reference", "selected-center", 0)
      }

      if (cancelled) return
      setLayers([...nextLayers])
      setRenderProgress({ current: renderedCount, total: expectedTotal })
      setExpandedFiles(new Set(nextLayers.length <= 120 ? nextLayers.map((entry) => entry.fileId) : selectedKmzId ? nextLayers.map((entry) => entry.fileId) : []))
      setLoading(false)
      if (allBounds.length === 1) map.setView(allBounds[0], 14)
      else if (allBounds.length > 1) map.fitBounds(L.latLngBounds(allBounds), { padding: [48, 48], maxZoom: selectedKmzId ? 15 : 10 })
    }

    void render().catch((renderError) => {
      console.error("[KMZ map] render failed", renderError)
      if (!cancelled) {
        setError("No se pudieron representar las capas del KMZ.")
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [mapReady, displayFiles, centerCoordinates, enableGeocoding, onPlacemarkSelect, selectedKmzId])

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

  const setLayerVisibility = (key: string, visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        if (entry.key !== key) return entry
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        entry.visible = visible
        return { ...entry, visible }
      }),
    )
  }

  const setFileVisibility = (fileId: string, visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        if (entry.fileId !== fileId) return entry
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        entry.visible = visible
        return { ...entry, visible }
      }),
    )
  }

  const setAllVisibility = (visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        entry.visible = visible
        return { ...entry, visible }
      }),
    )
  }

  const isolateLayer = (key: string) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        const visible = entry.key === key
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        entry.visible = visible
        return { ...entry, visible }
      }),
    )
  }

  const zoomLayer = (entry: LayerInfo) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return
    if (!entry.visible) setLayerVisibility(entry.key, true)
    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 15)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [48, 48], maxZoom: 16 })
    setSelectedLayerKey(entry.key)
    entry.layer.openPopup?.()
    onPlacemarkSelect?.(entry)
  }

  const zoomFile = (group: FileLayerGroup) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return
    const bounds = group.layers.flatMap((entry) => entry.bounds)
    if (bounds.length === 1) map.setView(bounds[0], 14)
    else if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 14 })
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
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/35 backdrop-blur-[1px]">
          <div className="min-w-64 rounded-lg border bg-background/95 px-4 py-3 text-sm shadow-lg">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Representando capas KMZ
            </div>
            {renderProgress.total > 0 ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (renderProgress.current / renderProgress.total) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{renderProgress.current} de {renderProgress.total} geometrías</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-[600] flex gap-2">
        <Button type="button" size="sm" variant="outline" className="bg-background/95" onClick={() => setLayersOpen((value) => !value)}>
          <Layers3 className="mr-2 h-4 w-4" />
          {visibleCount}/{layers.length} capas · {fileGroups.length} KMZ
        </Button>
        <Button type="button" size="icon" variant="outline" className="bg-background/95" onClick={toggleFullscreen} aria-label={fullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {layersOpen ? (
        <div className="absolute left-3 top-14 z-[600] flex max-h-[72%] w-[min(28rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border bg-background/96 shadow-lg backdrop-blur">
          <div className="border-b p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Capas del mapa</p>
                <p className="text-xs text-muted-foreground">{fileGroups.length} archivos · {layers.length} geometrías detectadas</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setAllVisibility(true)}>Todas</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setAllVisibility(false)}>Ocultar</Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto p-2">
            {layers.length === 0 && !loading ? (
              <div className="p-3 text-sm text-muted-foreground">No hay geometría disponible. El archivo puede requerir reindexación desde su KMZ original.</div>
            ) : (
              fileGroups.map((group) => {
                const expanded = expandedFiles.has(group.fileId)
                const allVisible = group.visibleCount === group.layers.length
                return (
                  <div key={group.fileId} className="mb-2 overflow-hidden rounded-lg border bg-background">
                    <div className="flex items-center gap-1 p-2">
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-muted"
                        onClick={() => setExpandedFiles((current) => {
                          const next = new Set(current)
                          if (next.has(group.fileId)) next.delete(group.fileId)
                          else next.add(group.fileId)
                          return next
                        })}
                        aria-label={expanded ? "Contraer archivo" : "Expandir archivo"}
                      >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => setFileVisibility(group.fileId, !allVisible)} aria-label={allVisible ? "Ocultar archivo" : "Mostrar archivo"}>
                        {allVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomFile(group)}>
                        <span className="block truncate text-sm font-medium">{group.fileName}</span>
                        <span className="block text-xs text-muted-foreground">{group.visibleCount}/{group.layers.length} capas visibles</span>
                      </button>
                      <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => zoomFile(group)} aria-label="Centrar archivo">
                        <Focus className="h-4 w-4" />
                      </button>
                    </div>

                    {expanded ? (
                      <div className="border-t bg-muted/20 p-1">
                        {group.layers.map((entry) => (
                          <div key={entry.key} className={`flex items-start gap-1 rounded-md p-1.5 ${selectedLayerKey === entry.key ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/70"}`}>
                            <button type="button" className="mt-0.5 rounded p-1" onClick={() => setLayerVisibility(entry.key, !entry.visible)} aria-label={entry.visible ? "Ocultar capa" : "Mostrar capa"}>
                              {entry.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomLayer(entry)}>
                              <span className="flex items-center gap-1.5 truncate text-xs font-medium">
                                <GeometryIcon type={entry.geometryType} />
                                <span className="truncate">{entry.name}</span>
                              </span>
                              <span className="mt-0.5 block text-[10px] text-muted-foreground">{entry.geometryType}{entry.geometrySource !== "placemark" ? " · referencia" : ""}</span>
                            </button>
                            <button type="button" className="rounded p-1 hover:bg-background" onClick={() => isolateLayer(entry.key)} aria-label="Mostrar solo esta capa">
                              <Focus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
