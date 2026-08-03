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
}

interface FileLayerGroup {
  fileId: string
  fileName: string
  layers: LayerInfo[]
  visibleCount: number
  realCount: number
  referenceCount: number
}

const COLORS = ["#2f6f55", "#2f6484", "#8a6336", "#6c5c8d", "#397167", "#7a4f45", "#92684f", "#46647b"]
const RENDER_BATCH_SIZE = 150
const FLIGHT_FILE_PATTERN = /(^|\b)(vuelo|vuelos|flight|drone|avion|avión|helicoptero|helicóptero|radio de vuelo)(\b|$)/i

function getColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getFileId(file: any, index = 0) {
  return String(file?.id ?? file?.dbId ?? file?.metadata?.id ?? `${file?.fileName || "kmz"}-${index}`)
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

function getGeometryType(placemark: any): LayerInfo["geometryType"] {
  const type = String(placemark?.type || "").toLowerCase()
  if (type.includes("polygon")) return "Polygon"
  if (type.includes("line")) return "LineString"
  return "Point"
}

function getFileDescription(file: any) {
  const placemarkDescription = Array.isArray(file?.placemarks)
    ? file.placemarks.map((placemark: any) => cleanDescription(placemark?.description)).find(Boolean)
    : null
  return placemarkDescription || cleanDescription(file?.description) || cleanDescription(file?.metadata?.description) || null
}

function getMapExclusionReason(file: any): string | null {
  const name = String(file?.fileName || file?.file_name || "")
  if (FLIGHT_FILE_PATTERN.test(name)) return "vuelo"

  const placemarks = Array.isArray(file?.placemarks) ? file.placemarks : []
  let polygons = 0
  let lines = 0
  let vertices = 0
  placemarks.forEach((placemark: any) => {
    const type = getGeometryType(placemark)
    if (type === "Polygon") polygons++
    if (type === "LineString") lines++
    vertices += Array.isArray(placemark?.coordinates) ? placemark.coordinates.length : 0
  })

  const lineDominant = lines >= Math.max(4, polygons * 4)
  if (lineDominant && (placemarks.length > 500 || vertices > 50000)) return "traza excesiva"

  const bounds = file?.bounds
  if (polygons === 0 && isValidBounds(bounds)) {
    const width = Math.abs(Number(bounds.east) - Number(bounds.west))
    const height = Math.abs(Number(bounds.north) - Number(bounds.south))
    if (Math.max(width, height) > 12) return "traza excesiva"
  }

  return null
}

function GeometryIcon({ type }: { type?: LayerInfo["geometryType"] }) {
  if (type === "Polygon") return <Square className="h-3.5 w-3.5" />
  if (type === "LineString") return <Route className="h-3.5 w-3.5" />
  return <MapPin className="h-3.5 w-3.5" />
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
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 })
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [selectedLayerKey, setSelectedLayerKey] = useState<string | null>(null)

  const safeFiles = useMemo(() => (Array.isArray(kmzFiles) ? (kmzFiles as any[]) : []), [kmzFiles])
  const excludedRegionalFiles = useMemo(
    () => (selectedKmzId ? [] : safeFiles.filter((file) => Boolean(getMapExclusionReason(file)))),
    [safeFiles, selectedKmzId],
  )

  const displayFiles = useMemo(() => {
    if (selectedKmzId) {
      const matched = safeFiles.filter((file) => selectedFileMatches(file, String(selectedKmzId)))
      if (matched.length > 0) return matched
      return safeFiles.length === 1 ? safeFiles : []
    }
    return safeFiles.filter((file) => !getMapExclusionReason(file))
  }, [safeFiles, selectedKmzId])

  const realLayers = useMemo(() => layers.filter((entry) => entry.geometrySource === "placemark"), [layers])
  const referenceLayers = useMemo(() => layers.filter((entry) => entry.geometrySource !== "placemark"), [layers])
  const polygonCount = realLayers.filter((entry) => entry.geometryType === "Polygon").length
  const lineCount = realLayers.filter((entry) => entry.geometryType === "LineString").length
  const pointCount = realLayers.filter((entry) => entry.geometryType === "Point").length
  const visibleRealCount = realLayers.filter((entry) => entry.visible).length

  const fileGroups = useMemo<FileLayerGroup[]>(() => {
    const grouped = new Map<string, FileLayerGroup>()
    layers.forEach((entry) => {
      const current = grouped.get(entry.fileId) || {
        fileId: entry.fileId,
        fileName: entry.fileName,
        layers: [],
        visibleCount: 0,
        realCount: 0,
        referenceCount: 0,
      }
      current.layers.push(entry)
      if (entry.visible) current.visibleCount++
      if (entry.geometrySource === "placemark") current.realCount++
      else current.referenceCount++
      grouped.set(entry.fileId, current)
    })
    return Array.from(grouped.values()).sort((a, b) => a.fileName.localeCompare(b.fileName, "es"))
  }, [layers])

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

    const expectedTotal = displayFiles.reduce((sum, file) => {
      const count = Array.isArray(file?.placemarks) ? file.placemarks.length : 0
      return sum + Math.max(count, isValidBounds(file?.bounds) ? 1 : 0)
    }, 0)
    setRenderProgress({ current: 0, total: expectedTotal })

    const nextLayers: LayerInfo[] = []
    const realBounds: [number, number][] = []
    const referenceBounds: [number, number][] = []
    let renderedCount = 0

    const selectLayer = async (info: LayerInfo) => {
      setSelectedLayerKey(info.key)
      onPlacemarkSelect?.(info)

      if (enableGeocoding && !info.locationDetails && info.bounds.length > 0) {
        const center = L.latLngBounds(info.bounds).getCenter()
        try {
          const details = await reverseGeocoder.getLocationDetails(center.lat, center.lng)
          if (cancelled) return
          info.locationDetails = details
          setLayers((current) => current.map((entry) => (entry.key === info.key ? { ...entry, locationDetails: details } : entry)))
        } catch {
          // Geocoding is secondary; geometry remains usable.
        }
      }
    }

    const addLayer = (
      file: any,
      fileId: string,
      name: string,
      shape: any,
      bounds: [number, number][],
      geometryType: LayerInfo["geometryType"],
      geometrySource: LayerInfo["geometrySource"],
      index: number,
      description?: string | null,
    ) => {
      const fileName = file.fileName || "Archivo KMZ"
      const color = getColor(fileId)
      const key = `${fileId}:${geometrySource}:${index}:${name}`
      const isReference = geometrySource !== "placemark"
      const info: LayerInfo = {
        key,
        fileId,
        name,
        fileName,
        layer: shape,
        visible: !isReference,
        color,
        bounds,
        description,
        geometryType,
        geometrySource,
      }

      shape.on("click", () => void selectLayer(info))
      if (!isReference) shape.addTo(map)
      renderedRef.current.push(shape)
      nextLayers.push(info)
      if (isReference) referenceBounds.push(...bounds)
      else realBounds.push(...bounds)
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
          const geometryType = getGeometryType(placemark)
          const description = cleanDescription(placemark?.description) || getFileDescription(file)

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
            })
            addLayer(file, fileId, placemark.name || `Punto ${placemarkIndex + 1}`, marker, [[Number(lat), Number(lng)]], "Point", "placemark", placemarkIndex, description)
            geometryCount++
          } else {
            const latLngs = coordinates
              .map(([lng, lat]: [number, number]) => [Number(lat), Number(lng)] as [number, number])
              .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))
            if (latLngs.length < 2) continue

            const shape =
              geometryType === "Polygon"
                ? L.polygon(latLngs, { color: fileColor, weight: 2, opacity: 0.95, fillColor: fileColor, fillOpacity: 0.18, renderer: L.canvas() })
                : L.polyline(latLngs, { color: fileColor, weight: 2.5, opacity: 0.9, renderer: L.canvas() })
            addLayer(file, fileId, placemark.name || `${geometryType} ${placemarkIndex + 1}`, shape, latLngs, geometryType, "placemark", placemarkIndex, description)
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
            color: "#7b847f",
            weight: 1.5,
            dashArray: "7 6",
            opacity: 0.8,
            fillColor: "#7b847f",
            fillOpacity: 0.04,
            renderer: L.canvas(),
          })
          addLayer(file, fileId, "Solo ubicación aproximada", rectangle, latLngs, "Bounds", "collection-bounds", 0, getFileDescription(file))
        }
      }

      if (nextLayers.length === 0 && centerCoordinates && Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.lng)) {
        const file = displayFiles[0] || { fileName: "KMZ seleccionado" }
        const fileId = getFileId(file)
        const marker = L.circleMarker([centerCoordinates.lat, centerCoordinates.lng], {
          radius: 7,
          color: "#ffffff",
          weight: 3,
          fillColor: "#7b847f",
          fillOpacity: 1,
        })
        addLayer(file, fileId, "Solo ubicación aproximada", marker, [[centerCoordinates.lat, centerCoordinates.lng]], "Reference", "selected-center", 0, getFileDescription(file))
      }

      if (cancelled) return
      setLayers([...nextLayers])
      setRenderProgress({ current: renderedCount, total: expectedTotal })
      setExpandedFiles(new Set(selectedKmzId && nextLayers.length <= 80 ? nextLayers.map((entry) => entry.fileId) : []))
      setLoading(false)

      const fitBounds = realBounds.length > 0 ? realBounds : referenceBounds
      if (fitBounds.length === 1) map.setView(fitBounds[0], 14)
      else if (fitBounds.length > 1) map.fitBounds(L.latLngBounds(fitBounds), { padding: [48, 48], maxZoom: selectedKmzId ? 15 : 10 })
    }

    void render().catch((renderError) => {
      console.error("[KMZ map] render failed", renderError)
      if (!cancelled) {
        setError("No se pudieron representar las geometrías del KMZ.")
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [mapReady, displayFiles, centerCoordinates, enableGeocoding, onPlacemarkSelect, selectedKmzId])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    referenceLayers.forEach((entry) => {
      const shouldShow = showReferences && entry.visible
      if (shouldShow && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
      if (!shouldShow && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
    })
  }, [showReferences, referenceLayers, mapReady])

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
        const canRender = entry.geometrySource === "placemark" || showReferences
        if (visible && canRender && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
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
        const canRender = entry.geometrySource === "placemark" || showReferences
        if (visible && canRender && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const setAllRealVisibility = (visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        if (entry.geometrySource !== "placemark") return entry
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const zoomLayer = (entry: LayerInfo) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return
    if (!entry.visible) setLayerVisibility(entry.key, true)
    if (entry.geometrySource !== "placemark") setShowReferences(true)
    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 15)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [48, 48], maxZoom: 16 })
    setSelectedLayerKey(entry.key)
    onPlacemarkSelect?.(entry)
  }

  const zoomFile = (group: FileLayerGroup) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return
    const real = group.layers.filter((entry) => entry.geometrySource === "placemark")
    const source = real.length > 0 ? real : group.layers
    const bounds = source.flatMap((entry) => entry.bounds)
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

  const geometryLabel = realLayers.length > 0
    ? [polygonCount ? `${polygonCount} polígonos` : null, lineCount ? `${lineCount} líneas` : null, pointCount ? `${pointCount} puntos` : null].filter(Boolean).join(" · ")
    : "Sin geometría real"

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-muted" style={{ height: fullscreen ? "100vh" : height }}>
      <div ref={mapNodeRef} className="h-full w-full" />

      {!mapReady || loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
          <div className="min-w-64 rounded-lg border bg-background/95 px-4 py-3 text-sm shadow-lg">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Representando geometrías
            </div>
            {renderProgress.total > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{renderProgress.current} de {renderProgress.total}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-[600] flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-9 bg-background/95 px-3 shadow-sm" onClick={() => setLayersOpen((value) => !value)}>
          <Layers3 className="mr-2 h-4 w-4" />
          {geometryLabel}
        </Button>
        {referenceLayers.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`h-9 bg-background/95 px-3 shadow-sm ${showReferences ? "border-amber-400 text-amber-700" : "text-muted-foreground"}`}
            onClick={() => setShowReferences((value) => !value)}
          >
            {showReferences ? "Ocultar referencias" : `${referenceLayers.length} referencias`}
          </Button>
        ) : null}
        <Button type="button" size="icon" variant="outline" className="h-9 w-9 bg-background/95 shadow-sm" onClick={toggleFullscreen} aria-label={fullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {realLayers.length === 0 && !loading ? (
        <div className="absolute bottom-4 left-1/2 z-[550] w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-amber-300 bg-background/95 px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">Este KMZ no tiene geometría real recuperada</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Solo existe una ubicación aproximada. El rectángulo de referencia está oculto para no confundirlo con un polígono.</p>
        </div>
      ) : null}

      {layersOpen ? (
        <div className="absolute left-3 top-14 z-[600] flex max-h-[68%] w-[min(25rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border bg-background/97 shadow-xl backdrop-blur">
          <div className="border-b px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Geometrías del mapa</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{visibleRealCount}/{realLayers.length} reales visibles · {fileGroups.length} KMZ</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAllRealVisibility(true)}>Mostrar</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAllRealVisibility(false)}>Ocultar</Button>
              </div>
            </div>
            {excludedRegionalFiles.length > 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">{excludedRegionalFiles.length} vuelos o trazas excesivas omitidos.</p>
            ) : null}
          </div>

          <div className="overflow-y-auto p-2">
            {fileGroups.map((group) => {
              const expanded = expandedFiles.has(group.fileId)
              const realGroupLayers = group.layers.filter((entry) => entry.geometrySource === "placemark")
              const allRealVisible = realGroupLayers.length > 0 && realGroupLayers.every((entry) => entry.visible)
              const stateLabel = group.realCount > 0 ? `${group.realCount} geometrías reales` : "Solo ubicación"

              return (
                <div key={group.fileId} className="mb-2 overflow-hidden rounded-lg border bg-background">
                  <div className="flex items-center gap-1 px-2 py-2">
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-muted"
                      onClick={() => setExpandedFiles((current) => {
                        const next = new Set(current)
                        if (next.has(group.fileId)) next.delete(group.fileId)
                        else next.add(group.fileId)
                        return next
                      })}
                    >
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 hover:bg-muted disabled:opacity-40"
                      disabled={realGroupLayers.length === 0}
                      onClick={() => setFileVisibility(group.fileId, !allRealVisible)}
                    >
                      {allRealVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomFile(group)}>
                      <span className="block truncate text-sm font-medium text-foreground">{group.fileName}</span>
                      <span className={`block text-xs ${group.realCount > 0 ? "text-emerald-700" : "text-amber-700"}`}>{stateLabel}</span>
                    </button>
                    <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => zoomFile(group)} aria-label="Centrar archivo">
                      <Focus className="h-4 w-4" />
                    </button>
                  </div>

                  {expanded ? (
                    <div className="border-t bg-muted/20 p-1">
                      {group.layers.map((entry) => {
                        const isReference = entry.geometrySource !== "placemark"
                        return (
                          <div key={entry.key} className={`flex items-start gap-1 rounded-md p-1.5 ${selectedLayerKey === entry.key ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/70"}`}>
                            <button type="button" className="mt-0.5 rounded p-1" onClick={() => setLayerVisibility(entry.key, !entry.visible)}>
                              {entry.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomLayer(entry)}>
                              <span className="flex items-center gap-1.5 truncate text-xs font-medium">
                                <GeometryIcon type={entry.geometryType} />
                                <span className="truncate">{entry.name}</span>
                              </span>
                              <span className={`mt-0.5 block text-[10px] ${isReference ? "text-amber-700" : "text-muted-foreground"}`}>
                                {isReference ? "Referencia, no polígono" : entry.geometryType}
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
