"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Focus,
  Layers3,
  Loader2,
  MapPin,
  Maximize,
  Minimize,
  Minus,
  MousePointer2,
  Route,
  Shapes,
  Square,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { reverseGeocoder, type ChileanLocationDetails } from "@/lib/geocoding/reverse-geocode"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { createBrowserClient } from "@/lib/supabase/client"

interface KMZMapDisplayProps {
  kmzFiles?: KMZData[]
  height?: string
  centerCoordinates?: { lat: number; lng: number }
  onPlacemarkSelect?: (placemark: LayerInfo | null) => void
  enableGeocoding?: boolean
  selectedKmzId?: string | null
}

interface PropertyRecord {
  id?: string
  file_name?: string
  description?: string | null
  owner?: string | null
  region?: string | null
  category?: string | null
  rol_numbers?: string[] | null
  placemarks_count?: number | null
  bounds?: any
  metadata?: Record<string, any> | null
  tags?: string[] | null
}

type GeometryKind = "polygon" | "line" | "point" | "reference"

export interface GeometryMetrics {
  areaSquareMeters: number | null
  perimeterMeters: number | null
  lengthMeters: number | null
  centroid: { lat: number; lng: number }
  vertices: number
  approximate: boolean
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
  geometryKind?: GeometryKind
  geometryMetrics?: GeometryMetrics
  locationDetails?: ChileanLocationDetails
  isLoadingLocation?: boolean
  property?: PropertyRecord | null
}

const COLORS = ["#2f6f55", "#2f6484", "#8a6336", "#6c5c8d", "#397167", "#7a4f45"]
const EARTH_RADIUS_METERS = 6_371_008.8

function getColor(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function haversineDistance(a: [number, number], b: [number, number]) {
  const [lat1, lng1] = a
  const [lat2, lng2] = b
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)
  const latitude1 = toRadians(lat1)
  const latitude2 = toRadians(lat2)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

function calculateCentroid(points: [number, number][]) {
  if (points.length === 0) return { lat: 0, lng: 0 }
  const totals = points.reduce(
    (accumulator, [lat, lng]) => ({ lat: accumulator.lat + lat, lng: accumulator.lng + lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: totals.lat / points.length, lng: totals.lng / points.length }
}

function calculatePolygonArea(points: [number, number][]) {
  if (points.length < 3) return null
  const referenceLatitude = toRadians(points.reduce((sum, [lat]) => sum + lat, 0) / points.length)
  const projected = points.map(([lat, lng]) => ({
    x: EARTH_RADIUS_METERS * toRadians(lng) * Math.cos(referenceLatitude),
    y: EARTH_RADIUS_METERS * toRadians(lat),
  }))
  let signedArea = 0
  for (let index = 0; index < projected.length; index++) {
    const current = projected[index]
    const next = projected[(index + 1) % projected.length]
    signedArea += current.x * next.y - next.x * current.y
  }
  return Math.abs(signedArea) / 2
}

function calculateGeometryMetrics(
  points: [number, number][],
  kind: GeometryKind,
  approximate: boolean,
): GeometryMetrics {
  const centroid = calculateCentroid(points)
  if (points.length <= 1) {
    return {
      areaSquareMeters: null,
      perimeterMeters: null,
      lengthMeters: null,
      centroid,
      vertices: points.length,
      approximate,
    }
  }

  let openLength = 0
  for (let index = 1; index < points.length; index++) {
    openLength += haversineDistance(points[index - 1], points[index])
  }

  const polygon = kind === "polygon" || (kind === "reference" && points.length >= 3)
  const closingDistance = polygon ? haversineDistance(points[points.length - 1], points[0]) : 0
  return {
    areaSquareMeters: polygon ? calculatePolygonArea(points) : null,
    perimeterMeters: polygon ? openLength + closingDistance : null,
    lengthMeters: kind === "line" ? openLength : null,
    centroid,
    vertices: points.length,
    approximate,
  }
}

function formatMetricArea(value?: number | null) {
  if (!value || !Number.isFinite(value)) return null
  if (value >= 10_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value / 10_000)} ha`
  }
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)} m²`
}

function formatMetricDistance(value?: number | null) {
  if (!value || !Number.isFinite(value)) return null
  if (value >= 1_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value / 1_000)} km`
  }
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)} m`
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

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? "").trim()).filter(Boolean)
}

function formatRecordArea(record?: PropertyRecord | null) {
  const metadata = record?.metadata || {}
  const area = [
    metadata.area_hectares,
    metadata.hectares,
    metadata.superficie_hectareas,
    metadata.surface_hectares,
    metadata.area_ha,
  ]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0)

  if (area) return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(area)} ha`

  const squareMeters = Number(metadata.area_m2 || metadata.superficie_m2 || metadata.surface_m2)
  if (Number.isFinite(squareMeters) && squareMeters > 0) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(squareMeters)} m²`
  }
  return null
}

function getAddress(record?: PropertyRecord | null) {
  const metadata = record?.metadata || {}
  return (
    metadata.sii_point_resolution?.record?.direccion ||
    metadata.sii_point_resolution?.record?.raw?.direccion ||
    metadata.address ||
    metadata.direccion ||
    null
  )
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

function getFileDescription(file: any, property?: PropertyRecord | null) {
  const placemarkDescription = Array.isArray(file?.placemarks)
    ? file.placemarks.map((placemark: any) => cleanDescription(placemark?.description)).find(Boolean)
    : null

  return (
    placemarkDescription ||
    cleanDescription(property?.description) ||
    cleanDescription(property?.metadata?.description) ||
    cleanDescription(file?.description) ||
    cleanDescription(file?.metadata?.description) ||
    null
  )
}

function detailRow(label: string, value: unknown) {
  if (value === null || value === undefined || value === "") return ""
  return `<div style="display:grid;grid-template-columns:92px 1fr;gap:10px;padding:5px 0;border-bottom:1px solid #edf1ee;font-size:12px;line-height:1.35">
    <span style="color:#68756e;font-weight:600">${escapeHtml(label)}</span>
    <span style="color:#17211c;font-weight:500;overflow-wrap:anywhere">${escapeHtml(value)}</span>
  </div>`
}

function buildPopup(layer: LayerInfo, center: { lat: number; lng: number }, details?: ChileanLocationDetails) {
  const property = layer.property
  const metadata = property?.metadata || {}
  const roles = normalizeList(property?.rol_numbers || metadata.rolNumbers || metadata.rol_numbers)
  const location = details ? [details.comuna, details.provincia, details.region].filter(Boolean).join(", ") : null
  const description = layer.description || cleanDescription(property?.description) || cleanDescription(metadata.description)
  const metrics = layer.geometryMetrics
  const sourceMessage =
    layer.geometrySource === "collection-bounds"
      ? "Límite de referencia construido desde los bounds persistidos; sus métricas son aproximadas y no reemplazan el trazado original."
      : layer.geometrySource === "selected-center"
        ? "Punto de referencia construido desde la ubicación disponible."
        : "Geometría persistida del archivo KMZ."

  return `<div style="width:330px;max-width:calc(100vw - 72px);font-family:system-ui,-apple-system,sans-serif;color:#17211c">
    <div style="padding-bottom:10px;border-bottom:1px solid #dfe5e1">
      <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69766f">Ficha geométrica</div>
      <h4 style="margin:4px 0 0;font-size:15px;line-height:1.3;font-weight:750;color:${layer.color};overflow-wrap:anywhere">${escapeHtml(layer.name)}</h4>
    </div>
    <div style="margin-top:8px">
      ${detailRow("Archivo", layer.fileName)}
      ${detailRow("Tipo", layer.geometryKind || "capa")}
      ${detailRow("Área", formatMetricArea(metrics?.areaSquareMeters) || formatRecordArea(property) || "No aplica")}
      ${detailRow("Perímetro", formatMetricDistance(metrics?.perimeterMeters))}
      ${detailRow("Longitud", formatMetricDistance(metrics?.lengthMeters))}
      ${detailRow("Vértices", metrics?.vertices)}
      ${detailRow("Centroide", metrics ? `${metrics.centroid.lat.toFixed(6)}, ${metrics.centroid.lng.toFixed(6)}` : null)}
      ${detailRow("Rol", roles.length > 0 ? roles.join(", ") : "Sin rol confirmado")}
      ${detailRow("Propietario", property?.owner || metadata.confirmed_owner || metadata.web_owner || "Sin propietario confirmado")}
      ${detailRow("Región", property?.region || details?.region || "Sin dato")}
      ${detailRow("Comuna", details?.comuna || metadata.comuna || "Sin dato")}
      ${detailRow("Dirección", getAddress(property))}
      ${detailRow("Punto mapa", `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`)}
    </div>
    ${description ? `<div style="margin-top:10px;max-height:128px;overflow:auto;border-radius:7px;background:#f5f7f5;padding:9px;font-size:11px;line-height:1.5;white-space:pre-wrap;color:#435049">${escapeHtml(description)}</div>` : ""}
    <div style="margin-top:9px;padding:8px;border-radius:7px;background:${layer.geometrySource === "placemark" ? "#edf6f1" : "#fff7df"};color:${layer.geometrySource === "placemark" ? "#285a43" : "#6f5012"};font-size:10px;line-height:1.45">${escapeHtml(sourceMessage)}</div>
    ${location ? `<div style="margin-top:7px;font-size:10px;color:#68756e">Ubicación: ${escapeHtml(location)}</div>` : ""}
  </div>`
}

function GeometryIcon({ kind }: { kind?: GeometryKind }) {
  if (kind === "polygon") return <Square className="h-3.5 w-3.5" aria-hidden="true" />
  if (kind === "line") return <Route className="h-3.5 w-3.5" aria-hidden="true" />
  if (kind === "point") return <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
  return <Focus className="h-3.5 w-3.5" aria-hidden="true" />
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
  const [activeLayerKey, setActiveLayerKey] = useState<string | null>(null)
  const [propertyRecord, setPropertyRecord] = useState<PropertyRecord | null>(null)

  const supabase = useMemo(() => createBrowserClient(), [])

  const displayFiles = useMemo(() => {
    const safeFiles = Array.isArray(kmzFiles) ? (kmzFiles as any[]) : []
    if (!selectedKmzId) return safeFiles
    const matched = safeFiles.filter((file) => selectedFileMatches(file, String(selectedKmzId)))
    if (matched.length > 0) return matched
    return safeFiles.length === 1 ? safeFiles : []
  }, [kmzFiles, selectedKmzId])

  const visibleCount = layers.filter((entry) => entry.visible).length
  const layerKey = (entry: LayerInfo, index: number) => `${entry.fileName}-${entry.name}-${index}`
  const activeLayer = useMemo(() => {
    if (!activeLayerKey) return null
    return layers.find((entry, index) => layerKey(entry, index) === activeLayerKey) || null
  }, [activeLayerKey, layers])

  useEffect(() => {
    let cancelled = false
    const loadProperty = async () => {
      if (!selectedKmzId) {
        setPropertyRecord(null)
        return
      }
      const { data, error: propertyError } = await supabase
        .from("kmz_collection")
        .select("id, file_name, description, owner, region, category, rol_numbers, placemarks_count, bounds, metadata, tags")
        .eq("id", selectedKmzId)
        .maybeSingle()
      if (!cancelled) setPropertyRecord(propertyError ? null : data)
    }
    void loadProperty()
    return () => {
      cancelled = true
    }
  }, [selectedKmzId, supabase])

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
    setActiveLayerKey(null)
    onPlacemarkSelect?.(null)

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
      geometryKind: GeometryKind,
      pinAtCenter = false,
    ) => {
      const color = getColor(`${file.fileName}-${name}`)
      const centerPoint = L.latLngBounds(bounds).getCenter()
      const info: LayerInfo = {
        name,
        fileName: file.fileName || propertyRecord?.file_name || "Archivo KMZ",
        layer: shape,
        visible: true,
        color,
        bounds,
        description,
        geometrySource,
        geometryKind,
        geometryMetrics: calculateGeometryMetrics(bounds, geometryKind, geometrySource !== "placemark"),
        isLoadingLocation: enableGeocoding,
        property: propertyRecord,
      }

      const popupOptions = { autoPan: false, maxWidth: 380, minWidth: 310, closeButton: true, className: "kmz-property-popup" }
      shape.bindPopup(buildPopup(info, centerPoint), popupOptions)
      shape.on("click", () => {
        const index = nextLayers.indexOf(info)
        setActiveLayerKey(layerKey(info, Math.max(index, 0)))
        onPlacemarkSelect?.(info)
      })
      renderedRef.current.push(shape)
      nextLayers.push(info)
      allBounds.push(...bounds)

      if (pinAtCenter) {
        const pin = L.circleMarker([centerPoint.lat, centerPoint.lng], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
          isKMZ: true,
        }).addTo(map)
        pin.bindPopup(buildPopup(info, centerPoint), popupOptions)
        pin.on("click", () => onPlacemarkSelect?.(info))
        renderedRef.current.push(pin)
      }

      if (enableGeocoding) {
        try {
          const details = await reverseGeocoder.getLocationDetails(centerPoint.lat, centerPoint.lng)
          if (cancelled) return
          info.locationDetails = details
          info.isLoadingLocation = false
          shape.setPopupContent(buildPopup(info, centerPoint, details))
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
          const description = cleanDescription(placemark?.description) || getFileDescription(file, propertyRecord)
          const color = getColor(`${file.fileName}-${placemark?.name || "capa"}`)

          if (placemark?.type === "Point" && coordinates.length > 0) {
            const [lng, lat] = coordinates[0] || []
            if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) continue
            const marker = L.marker([Number(lat), Number(lng)], { isKMZ: true }).addTo(map)
            await addLayer(file, placemark.name || "Punto", marker, [[Number(lat), Number(lng)]], description, "placemark", "point")
            geometryCount++
            continue
          }

          const latLngs = coordinates
            .map(([lng, lat]: [number, number]) => [Number(lat), Number(lng)] as [number, number])
            .filter(([lat, lng]: [number, number]) => Number.isFinite(lat) && Number.isFinite(lng))

          if (latLngs.length < 2) continue
          const isPolygon = placemark?.type === "Polygon"
          const shape = isPolygon
            ? L.polygon(latLngs, { color, weight: 2.5, opacity: 0.95, fillColor: color, fillOpacity: 0.22, isKMZ: true }).addTo(map)
            : L.polyline(latLngs, { color, weight: 3, opacity: 0.95, isKMZ: true }).addTo(map)

          await addLayer(
            file,
            placemark.name || placemark.type || "Capa",
            shape,
            latLngs,
            description,
            "placemark",
            isPolygon ? "polygon" : "line",
            true,
          )
          geometryCount++
        }

        if (geometryCount === 0 && isValidBounds(file?.bounds || propertyRecord?.bounds)) {
          const bounds = file?.bounds || propertyRecord?.bounds
          const latLngs: [number, number][] = [
            [Number(bounds.south), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.west)],
            [Number(bounds.north), Number(bounds.east)],
            [Number(bounds.south), Number(bounds.east)],
          ]
          const color = getColor(file.fileName || propertyRecord?.file_name || "kmz")
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
            `${file.fileName || propertyRecord?.file_name || "KMZ"} · límite de referencia`,
            rectangle,
            latLngs,
            getFileDescription(file, propertyRecord),
            "collection-bounds",
            "reference",
            true,
          )
        }
      }

      if (nextLayers.length === 0 && centerCoordinates && Number.isFinite(centerCoordinates.lat) && Number.isFinite(centerCoordinates.lng)) {
        const file = displayFiles[0] || { fileName: propertyRecord?.file_name || "KMZ seleccionado" }
        const marker = L.marker([centerCoordinates.lat, centerCoordinates.lng], { isKMZ: true }).addTo(map)
        await addLayer(
          file,
          propertyRecord?.file_name || file.fileName || "Ubicación del KMZ",
          marker,
          [[centerCoordinates.lat, centerCoordinates.lng]],
          getFileDescription(file, propertyRecord),
          "selected-center",
          "reference",
        )
      }

      if (cancelled) return
      setLayers([...nextLayers])
      setLoading(false)
      if (allBounds.length === 1) map.setView(allBounds[0], 13)
      else if (allBounds.length > 1) map.fitBounds(L.latLngBounds(allBounds), { padding: [80, 80], maxZoom: 13 })
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [mapReady, displayFiles, centerCoordinates, enableGeocoding, onPlacemarkSelect, propertyRecord])

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

  const setLayerVisibility = (index: number, visible: boolean) => {
    const map = mapRef.current
    if (!map) return

    setLayers((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const setAllLayers = (visible: boolean) => {
    const map = mapRef.current
    if (!map) return
    setLayers((current) =>
      current.map((entry) => {
        if (visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map)
        if (!visible && map.hasLayer(entry.layer)) map.removeLayer(entry.layer)
        return { ...entry, visible }
      }),
    )
  }

  const activateLayer = (entry: LayerInfo, index: number, isolate = false) => {
    const map = mapRef.current
    const L = (window as any).L
    if (!map || !L) return

    if (isolate) {
      setLayers((current) =>
        current.map((candidate, candidateIndex) => {
          const visible = candidateIndex === index
          if (visible && !map.hasLayer(candidate.layer)) candidate.layer.addTo(map)
          if (!visible && map.hasLayer(candidate.layer)) map.removeLayer(candidate.layer)
          return { ...candidate, visible }
        }),
      )
    } else if (!map.hasLayer(entry.layer)) {
      entry.layer.addTo(map)
      setLayerVisibility(index, true)
    }

    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 14)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [80, 80], maxZoom: 15 })

    entry.layer.openPopup?.()
    setActiveLayerKey(layerKey(entry, index))
    onPlacemarkSelect?.(entry)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await containerRef.current.requestFullscreen()
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-xl border bg-destructive/5 ${height === "100%" ? "absolute inset-0" : ""}`} style={height !== "100%" ? { height } : undefined}>
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" aria-hidden="true" />
          <p className="font-medium text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const isFluid = !fullscreen && height === "100%"

  return (
    <div
      ref={containerRef}
      className={`${isFluid ? "absolute inset-0" : "relative"} min-h-0 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm`}
      style={fullscreen ? { height: "100vh" } : isFluid ? undefined : { height }}
    >
      <div ref={mapNodeRef} className="h-full w-full" />

      {!mapReady || loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/45 backdrop-blur-[1px]" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            Cargando geometrías y capas…
          </div>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-[600] flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-slate-300 bg-background/95 shadow-md backdrop-blur"
          onClick={() => setLayersOpen((value) => !value)}
          aria-expanded={layersOpen}
        >
          <Layers3 className="mr-2 h-4 w-4" aria-hidden="true" />
          Capas
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums">
            {visibleCount}/{layers.length}
          </span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="border-slate-300 bg-background/95 shadow-md backdrop-blur"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Salir de pantalla completa" : "Ver mapa en pantalla completa"}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {layersOpen ? (
        <aside
          className="absolute bottom-3 left-3 top-14 z-[600] flex w-[min(24rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95 shadow-2xl backdrop-blur"
          aria-label="Capas del mapa"
        >
          <div className="border-b px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Capas del mapa</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {visibleCount} visibles de {layers.length}
                </p>
              </div>
              <Shapes className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setAllLayers(true)} disabled={layers.length === 0 || visibleCount === layers.length}>
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Todas
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setAllLayers(false)} disabled={layers.length === 0 || visibleCount === 0}>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Ocultar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                disabled={!activeLayerKey}
                onClick={() => {
                  const index = layers.findIndex((entry, entryIndex) => layerKey(entry, entryIndex) === activeLayerKey)
                  if (index >= 0) activateLayer(layers[index], index, true)
                }}
              >
                <MousePointer2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Solo activa
              </Button>
            </div>
          </div>

          {activeLayer?.geometryMetrics ? (
            <div className="border-b bg-emerald-500/[0.06] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Ficha geométrica activa</p>
                  <p className="mt-1 truncate text-sm font-semibold">{activeLayer.name}</p>
                </div>
                {activeLayer.geometryMetrics.approximate ? (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">Aproximada</span>
                ) : (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800">KMZ real</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border bg-background/80 p-2">
                  <p className="text-muted-foreground">Área</p>
                  <p className="mt-0.5 font-semibold">{formatMetricArea(activeLayer.geometryMetrics.areaSquareMeters) || "No aplica"}</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-2">
                  <p className="text-muted-foreground">{activeLayer.geometryKind === "line" ? "Longitud" : "Perímetro"}</p>
                  <p className="mt-0.5 font-semibold">
                    {formatMetricDistance(
                      activeLayer.geometryKind === "line"
                        ? activeLayer.geometryMetrics.lengthMeters
                        : activeLayer.geometryMetrics.perimeterMeters,
                    ) || "No aplica"}
                  </p>
                </div>
                <div className="rounded-lg border bg-background/80 p-2">
                  <p className="text-muted-foreground">Vértices</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{activeLayer.geometryMetrics.vertices}</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-2">
                  <p className="text-muted-foreground">Centroide</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] font-semibold">
                    {activeLayer.geometryMetrics.centroid.lat.toFixed(5)}, {activeLayer.geometryMetrics.centroid.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {layers.length === 0 && !loading ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center">
                <Minus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Sin capas disponibles</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  El KMZ seleccionado no contiene geometrías renderizables ni una ubicación de referencia.
                </p>
              </div>
            ) : (
              layers.map((entry, index) => {
                const key = layerKey(entry, index)
                const active = key === activeLayerKey
                return (
                  <div
                    key={key}
                    className={`group mb-1.5 rounded-xl border p-2.5 transition-colors ${active ? "border-emerald-500/50 bg-emerald-500/10" : "border-transparent hover:border-border hover:bg-muted/60"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border bg-background"
                        onClick={() => setLayerVisibility(index, !entry.visible)}
                        aria-label={entry.visible ? `Ocultar ${entry.name}` : `Mostrar ${entry.name}`}
                        aria-pressed={entry.visible}
                      >
                        {entry.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>

                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => activateLayer(entry, index)}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="truncate text-sm font-medium">{entry.name}</span>
                          {active ? <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" aria-hidden="true" /> : null}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GeometryIcon kind={entry.geometryKind} />
                          <span className="capitalize">{entry.geometryKind === "reference" ? "referencia" : entry.geometryKind || "capa"}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{entry.fileName}</span>
                        </span>
                        {entry.geometryMetrics && entry.geometryKind === "polygon" ? (
                          <span className="mt-1 block text-[11px] font-medium text-emerald-700">
                            {formatMetricArea(entry.geometryMetrics.areaSquareMeters) || "Área no calculable"}
                          </span>
                        ) : null}
                        {entry.locationDetails?.comuna ? (
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {entry.locationDetails.comuna}
                            {entry.locationDetails.region ? `, ${entry.locationDetails.region}` : ""}
                          </span>
                        ) : null}
                      </button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 flex-shrink-0 opacity-70 group-hover:opacity-100"
                        onClick={() => activateLayer(entry, index, true)}
                        aria-label={`Mostrar solo ${entry.name}`}
                      >
                        <Focus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
