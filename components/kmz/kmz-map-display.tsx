"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Focus,
  Layers3,
  Loader2,
  MapPin,
  Maximize,
  Minimize,
  MousePointer2,
  Pentagon,
  Route,
  Square,
  Trash2,
} from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { reverseGeocoder, type ChileanLocationDetails } from "@/lib/geocoding/reverse-geocode"
import { Button } from "@/components/ui/button"
import {
  getGeometryStatusPresentation,
  getPlacemarkGeometryStatus,
  type GeometryStatus,
} from "@/lib/kmz/geometry-status"

interface SpatialSelection {
  type: "rectangle" | "polygon" | "radius"
  bounds?: { north: number; south: number; east: number; west: number }
  coordinates?: Array<[number, number]>
  center?: { lat: number; lng: number }
  radiusMeters?: number
  matchedFileIds: string[]
}

interface KMZMapDisplayProps {
  kmzFiles?: KMZData[]
  height?: string
  centerCoordinates?: { lat: number; lng: number }
  onPlacemarkSelect?: (placemark: LayerInfo | null) => void
  enableGeocoding?: boolean
  selectedKmzId?: string | null
  onSpatialSelectionChange?: (selection: SpatialSelection | null) => void
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
  geometryStatus?: GeometryStatus
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

type SelectionMode = "none" | "rectangle" | "polygon" | "radius"

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

function pointInsidePolygon(point: [number, number], polygon: Array<[number, number]>) {
  const [lat, lng] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i]
    const [latJ, lngJ] = polygon[j]
    const intersects = lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI || 1e-12) + latI
    if (intersects) inside = !inside
  }
  return inside
}

function layerCenter(bounds: [number, number][]) {
  if (bounds.length === 0) return null
  const lat = bounds.reduce((sum, item) => sum + item[0], 0) / bounds.length
  const lng = bounds.reduce((sum, item) => sum + item[1], 0) / bounds.length
  return { lat, lng }
}

export function KMZMapDisplay({
  kmzFiles = [],
  height = "600px",
  centerCoordinates,
  onPlacemarkSelect,
  enableGeocoding = true,
  selectedKmzId = null,
  onSpatialSelectionChange,
}: KMZMapDisplayProps) {
  const mapNodeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const renderedRef = useRef<any[]>([])
  const selectionLayerRef = useRef<any>(null)
  const selectionPointsRef = useRef<Array<[number, number]>>([])
  const radiusCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 })
  const [fullscreen, setFullscreen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [showReferences, setShowReferences] = useState(true)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [selectedLayerKey, setSelectedLayerKey] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none")
  const [selectionHint, setSelectionHint] = useState<string | null>(null)
  const [selectionResultCount, setSelectionResultCount] = useState<number | null>(null)

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

  const realLayers = useMemo(() => layers.filter((entry) => entry.geometryStatus === "real_geometry"), [layers])
  const referenceLayers = useMemo(() => layers.filter((entry) => entry.geometryStatus !== "real_geometry"), [layers])
  const polygonCount = realLayers.filter((entry) => entry.geometryType === "Polygon").length
  const lineCount = realLayers.filter((entry) => entry.geometryType === "LineString").length
  const pointCount = realLayers.filter((entry) => entry.geometryType === "Point").length
  const visibleCount = layers.filter((entry) => entry.visible).length

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
      if (entry.geometryStatus === "real_geometry") current.realCount++
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
      const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenTopoMap",
        maxZoom: 17,
      })
      L.control.layers({ Calles: streets, Satélite: satellite, Terreno: terrain }, undefined, { position: "topright" }).addTo(map)
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
    const allBounds: [number, number][] = []
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
          // Geocoding is secondary.
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
      geometryStatus: GeometryStatus,
      index: number,
      description?: string | null,
    ) => {
      const fileName = file.fileName || "Archivo KMZ"
      const key = `${fileId}:${geometrySource}:${index}:${name}`
      const info: LayerInfo = {
        key,
        fileId,
        name,
        fileName,
        layer: shape,
        visible: true,
        color: getColor(fileId),
        bounds,
        description,
        geometryType,
        geometrySource,
        geometryStatus,
      }
      shape.on("click", () => void selectLayer(info))
      shape.addTo(map)
      renderedRef.current.push(shape)
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
          const geometryType = getGeometryType(placemark)
          const geometryStatus = getPlacemarkGeometryStatus(placemark)
          const presentation = getGeometryStatusPresentation(geometryStatus)
          const description = cleanDescription(placemark?.description) || getFileDescription(file)

          if (geometryType === "Point" && coordinates.length > 0) {
            const [lng, lat] = coordinates[0] || []
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue
            const markerStyle = presentation.marker
            const marker = L.circleMarker([Number(lat), Number(lng)], {
              radius: markerStyle.radius,
              color: markerStyle.color,
              weight: markerStyle.weight,
              fillColor: geometryStatus === "real_geometry" ? fileColor : markerStyle.fillColor,
              fillOpacity: markerStyle.fillOpacity,
              dashArray: markerStyle.dashArray,
              renderer: L.canvas(),
            })
            addLayer(
              file,
              fileId,
              placemark.name || presentation.label,
              marker,
              [[Number(lat), Number(lng)]],
              "Point",
              "placemark",
              geometryStatus,
              placemarkIndex,
              description,
            )
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
            addLayer(file, fileId, placemark.name || `${geometryType} ${placemarkIndex + 1}`, shape, latLngs, geometryType, "placemark", "real_geometry", placemarkIndex, description)
            geometryCount++
          }

          if (renderedCount > 0 && renderedCount % RENDER_BATCH_SIZE === 0) {
            setLayers([...nextLayers])
            setRenderProgress({ current: renderedCount, total: expectedTotal })
            await nextFrame()
          }
        }

        if (geometryCount === 0 && isValidBounds(file?.bounds)) {
          const bounds = file.bounds
          const lat = (Number(bounds.north) + Number(bounds.south)) / 2
          const lng = (Number(bounds.east) + Number(bounds.west)) / 2
          const presentation = getGeometryStatusPresentation("bounds_reference")
          const marker = L.circleMarker([lat, lng], { ...presentation.marker, renderer: L.canvas() })
          addLayer(file, fileId, "Centro aproximado", marker, [[lat, lng]], "Reference", "collection-bounds", "bounds_reference", 0, getFileDescription(file))
        }
      }

      if (nextLayers.length === 0 && centerCoordinates && Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.lng)) {
        const file = displayFiles[0] || { fileName: "KMZ seleccionado" }
        const fileId = getFileId(file)
        const presentation = getGeometryStatusPresentation("bounds_reference")
        const marker = L.circleMarker([centerCoordinates.lat, centerCoordinates.lng], { ...presentation.marker })
        addLayer(file, fileId, "Centro aproximado", marker, [[centerCoordinates.lat, centerCoordinates.lng]], "Reference", "selected-center", "bounds_reference", 0, getFileDescription(file))
      }

      if (cancelled) return
      setLayers([...nextLayers])
      setRenderProgress({ current: renderedCount, total: expectedTotal })
      setExpandedFiles(new Set(selectedKmzId && nextLayers.length <= 80 ? nextLayers.map((entry) => entry.fileId) : []))
      setLoading(false)

      if (allBounds.length === 1) map.setView(allBounds[0], 14)
      else if (allBounds.length > 1) map.fitBounds(L.latLngBounds(allBounds), { padding: [48, 48], maxZoom: selectedKmzId ? 15 : 10 })
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
      if (showReferences && entry.visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
      if (!showReferences && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
    })
  }, [showReferences, referenceLayers, mapReady])

  const clearSelection = () => {
    const map = mapRef.current
    if (selectionLayerRef.current && map?.hasLayer(selectionLayerRef.current)) map.removeLayer(selectionLayerRef.current)
    selectionLayerRef.current = null
    selectionPointsRef.current = []
    radiusCenterRef.current = null
    setSelectionMode("none")
    setSelectionHint(null)
    setSelectionResultCount(null)
    onSpatialSelectionChange?.(null)
  }

  const calculateMatchedFiles = (predicate: (center: { lat: number; lng: number }) => boolean) => {
    const ids = new Set<string>()
    layers.forEach((entry) => {
      const center = layerCenter(entry.bounds)
      if (center && predicate(center)) ids.add(entry.fileId)
    })
    return Array.from(ids)
  }

  useEffect(() => {
    if (!mapReady || selectionMode === "none") return
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return

    map.getContainer().style.cursor = "crosshair"

    const finishRectangle = (second: any) => {
      const first = selectionPointsRef.current[0]
      if (!first) return
      const bounds = L.latLngBounds(first, [second.lat, second.lng])
      const rectangle = L.rectangle(bounds, { color: "#0f766e", weight: 2, fillOpacity: 0.08 }).addTo(map)
      selectionLayerRef.current = rectangle
      const north = bounds.getNorth()
      const south = bounds.getSouth()
      const east = bounds.getEast()
      const west = bounds.getWest()
      const matchedFileIds = calculateMatchedFiles((center) => center.lat <= north && center.lat >= south && center.lng <= east && center.lng >= west)
      setSelectionResultCount(matchedFileIds.length)
      onSpatialSelectionChange?.({ type: "rectangle", bounds: { north, south, east, west }, matchedFileIds })
      setSelectionMode("none")
      setSelectionHint(null)
    }

    const finishPolygon = () => {
      const points = selectionPointsRef.current
      if (points.length < 3) return
      const polygon = L.polygon(points, { color: "#0f766e", weight: 2, fillOpacity: 0.08 }).addTo(map)
      selectionLayerRef.current = polygon
      const matchedFileIds = calculateMatchedFiles((center) => pointInsidePolygon([center.lat, center.lng], points))
      setSelectionResultCount(matchedFileIds.length)
      onSpatialSelectionChange?.({ type: "polygon", coordinates: points, matchedFileIds })
      setSelectionMode("none")
      setSelectionHint(null)
    }

    const finishRadius = (second: any) => {
      const center = radiusCenterRef.current
      if (!center) return
      const radiusMeters = map.distance([center.lat, center.lng], [second.lat, second.lng])
      const circle = L.circle([center.lat, center.lng], { radius: radiusMeters, color: "#0f766e", weight: 2, fillOpacity: 0.08 }).addTo(map)
      selectionLayerRef.current = circle
      const matchedFileIds = calculateMatchedFiles((candidate) => map.distance([center.lat, center.lng], [candidate.lat, candidate.lng]) <= radiusMeters)
      setSelectionResultCount(matchedFileIds.length)
      onSpatialSelectionChange?.({ type: "radius", center, radiusMeters, matchedFileIds })
      setSelectionMode("none")
      setSelectionHint(null)
    }

    const onClick = (event: any) => {
      if (selectionMode === "rectangle") {
        if (selectionPointsRef.current.length === 0) {
          selectionPointsRef.current = [[event.latlng.lat, event.latlng.lng]]
          setSelectionHint("Haz click en la esquina opuesta")
        } else finishRectangle(event.latlng)
      } else if (selectionMode === "polygon") {
        selectionPointsRef.current = [...selectionPointsRef.current, [event.latlng.lat, event.latlng.lng]]
        setSelectionHint(`${selectionPointsRef.current.length} puntos · doble click para terminar`)
      } else if (selectionMode === "radius") {
        if (!radiusCenterRef.current) {
          radiusCenterRef.current = { lat: event.latlng.lat, lng: event.latlng.lng }
          setSelectionHint("Haz click para definir el radio")
        } else finishRadius(event.latlng)
      }
    }

    const onDoubleClick = (event: any) => {
      if (selectionMode !== "polygon") return
      event.originalEvent?.preventDefault?.()
      finishPolygon()
    }

    map.on("click", onClick)
    map.on("dblclick", onDoubleClick)
    return () => {
      map.off("click", onClick)
      map.off("dblclick", onDoubleClick)
      map.getContainer().style.cursor = ""
    }
  }, [mapReady, selectionMode, layers, onSpatialSelectionChange])

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
        const referenceAllowed = entry.geometryStatus === "real_geometry" || showReferences
        if (visible && referenceAllowed && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
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
        const referenceAllowed = entry.geometryStatus === "real_geometry" || showReferences
        if (visible && referenceAllowed && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const setAllVisibility = (visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        const referenceAllowed = entry.geometryStatus === "real_geometry" || showReferences
        if (visible && referenceAllowed && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const isolateFile = (fileId: string) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        const visible = entry.fileId === fileId
        const referenceAllowed = entry.geometryStatus === "real_geometry" || showReferences
        if (visible && referenceAllowed && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
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
    if (entry.geometryStatus !== "real_geometry") setShowReferences(true)
    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 15)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [48, 48], maxZoom: 16 })
    setSelectedLayerKey(entry.key)
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

  const startSelection = (mode: SelectionMode) => {
    clearSelection()
    setSelectionMode(mode)
    setSelectionHint(
      mode === "rectangle"
        ? "Haz click en dos esquinas"
        : mode === "polygon"
          ? "Haz clicks para dibujar y doble click para terminar"
          : "Haz click en el centro y luego en el borde",
    )
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

  const geometryLabel = [
    polygonCount ? `${polygonCount} polígonos` : null,
    lineCount ? `${lineCount} líneas` : null,
    pointCount ? `${pointCount} puntos` : null,
    referenceLayers.length ? `${referenceLayers.length} referencias` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Sin capas"

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
            {renderProgress.total > 0 ? <p className="mt-1 text-xs text-muted-foreground">{renderProgress.current} de {renderProgress.total}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-[600] flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-9 bg-background/95 px-3 shadow-sm" onClick={() => setLayersOpen((value) => !value)}>
          <Layers3 className="mr-2 h-4 w-4" />
          {geometryLabel}
        </Button>
        <Button type="button" size="sm" variant={selectionMode === "rectangle" ? "default" : "outline"} className="h-9 bg-background/95 px-3 shadow-sm" onClick={() => startSelection("rectangle")}>
          <Square className="mr-2 h-4 w-4" /> Rectángulo
        </Button>
        <Button type="button" size="sm" variant={selectionMode === "polygon" ? "default" : "outline"} className="h-9 bg-background/95 px-3 shadow-sm" onClick={() => startSelection("polygon")}>
          <Pentagon className="mr-2 h-4 w-4" /> Polígono
        </Button>
        <Button type="button" size="sm" variant={selectionMode === "radius" ? "default" : "outline"} className="h-9 bg-background/95 px-3 shadow-sm" onClick={() => startSelection("radius")}>
          <Circle className="mr-2 h-4 w-4" /> Radio
        </Button>
        {(selectionLayerRef.current || selectionMode !== "none") ? (
          <Button type="button" size="icon" variant="outline" className="h-9 w-9 bg-background/95 shadow-sm" onClick={clearSelection} aria-label="Limpiar selección">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button type="button" size="icon" variant="outline" className="h-9 w-9 bg-background/95 shadow-sm" onClick={toggleFullscreen} aria-label={fullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}>
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {selectionHint ? (
        <div className="absolute left-1/2 top-16 z-[610] -translate-x-1/2 rounded-lg border bg-background/95 px-3 py-2 text-xs font-medium shadow-lg">
          <MousePointer2 className="mr-2 inline h-3.5 w-3.5" />
          {selectionHint}
        </div>
      ) : null}

      {selectionResultCount !== null ? (
        <div className="absolute bottom-4 left-1/2 z-[610] -translate-x-1/2 rounded-lg border bg-background/95 px-4 py-2 text-sm font-semibold shadow-lg">
          {selectionResultCount} KMZ seleccionados
        </div>
      ) : null}

      {layersOpen ? (
        <div className="absolute left-3 top-14 z-[600] flex max-h-[72%] w-[min(27rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border bg-background/97 shadow-xl backdrop-blur">
          <div className="border-b px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Capas del inventario Surrealista</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{visibleCount}/{layers.length} visibles · {fileGroups.length} KMZ</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAllVisibility(true)}>Mostrar</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAllVisibility(false)}>Ocultar</Button>
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showReferences} onChange={(event) => setShowReferences(event.target.checked)} />
              Mostrar centros y referencias
            </label>
            {excludedRegionalFiles.length > 0 ? <p className="mt-2 text-[11px] text-muted-foreground">{excludedRegionalFiles.length} vuelos o trazas excesivas omitidos.</p> : null}
          </div>

          <div className="overflow-y-auto p-2">
            {fileGroups.map((group) => {
              const expanded = expandedFiles.has(group.fileId)
              const allVisible = group.layers.length > 0 && group.layers.every((entry) => entry.visible)
              const stateLabel = group.realCount > 0 ? `${group.realCount} capas KMZ` : `${group.referenceCount} referencias`
              return (
                <div key={group.fileId} className="mb-2 overflow-hidden rounded-lg border bg-background">
                  <div className="flex items-center gap-1 px-2 py-2">
                    <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => setExpandedFiles((current) => {
                      const next = new Set(current)
                      if (next.has(group.fileId)) next.delete(group.fileId)
                      else next.add(group.fileId)
                      return next
                    })}>
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => setFileVisibility(group.fileId, !allVisible)}>
                      {allVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => zoomFile(group)}>
                      <span className="block truncate text-sm font-medium text-foreground">{group.fileName}</span>
                      <span className={`block text-xs ${group.realCount > 0 ? "text-emerald-700" : "text-sky-700"}`}>{stateLabel}</span>
                    </button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => isolateFile(group.fileId)}>Aislar</Button>
                    <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => zoomFile(group)} aria-label="Centrar archivo">
                      <Focus className="h-4 w-4" />
                    </button>
                  </div>

                  {expanded ? (
                    <div className="border-t bg-muted/20 p-1">
                      {group.layers.map((entry) => {
                        const presentation = getGeometryStatusPresentation(entry.geometryStatus)
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
                              <span className={`mt-0.5 block text-[10px] ${presentation.kind === "real" ? "text-muted-foreground" : "text-sky-700"}`}>
                                {presentation.label}
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
