"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, Layers3, Loader2, Maximize, Minimize } from "lucide-react"
import type { KMZData } from "@/lib/kmz/kmz-reader"
import { createBrowserClient } from "@/lib/supabase/client"
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
  property?: PropertyRecord | null
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

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? "").trim()).filter(Boolean)
}

function formatArea(record?: PropertyRecord | null) {
  const metadata = record?.metadata || {}
  const candidates = [
    metadata.area_hectares,
    metadata.hectares,
    metadata.superficie_hectareas,
    metadata.surface_hectares,
    metadata.area_ha,
  ]
  const area = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0)
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
  const address = getAddress(property)
  const area = formatArea(property)
  const sourceMessage =
    layer.geometrySource === "collection-bounds"
      ? "Vista construida con los límites persistidos del archivo. No representa el trazado exacto del polígono original."
      : layer.geometrySource === "selected-center"
        ? "Punto de referencia construido desde la ubicación disponible para el archivo seleccionado."
        : "Geometría persistida del archivo KMZ."

  const description = layer.description || cleanDescription(property?.description) || cleanDescription(metadata.description)
  const status = roles.length > 0 ? "Rol identificado" : "Rol pendiente"

  return `<div style="width:320px;max-width:calc(100vw - 72px);font-family:system-ui,-apple-system,sans-serif;color:#17211c">
    <div style="padding-bottom:10px;border-bottom:1px solid #dfe5e1">
      <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69766f">Ficha territorial</div>
      <h4 style="margin:4px 0 0;font-size:15px;line-height:1.3;font-weight:750;color:${layer.color};overflow-wrap:anywhere">${escapeHtml(property?.file_name || layer.name)}</h4>
      <span style="display:inline-block;margin-top:7px;padding:3px 7px;border-radius:999px;background:${roles.length > 0 ? "#e8f5ee" : "#fff5db"};color:${roles.length > 0 ? "#216044" : "#75520b"};font-size:10px;font-weight:700">${status}</span>
    </div>

    <div style="margin-top:8px">
      ${detailRow("Archivo", layer.fileName)}
      ${detailRow("Rol", roles.length > 0 ? roles.join(", ") : "Sin rol confirmado")}
      ${detailRow("Propietario", property?.owner || metadata.confirmed_owner || metadata.web_owner || "Sin propietario confirmado")}
      ${detailRow("Superficie", area || "Sin superficie registrada")}
      ${detailRow("Región", property?.region || details?.region || "Sin dato")}
      ${detailRow("Comuna", details?.comuna || metadata.comuna || "Sin dato")}
      ${detailRow("Categoría", property?.category || metadata.category || "Sin categoría")}
      ${detailRow("Dirección", address)}
      ${detailRow("Coordenadas", `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`)}
      ${detailRow("Capas", property?.placemarks_count ?? metadata.placemarks_count)}
    </div>

    ${description ? `<div style="margin-top:10px;max-height:128px;overflow:auto;border-radius:7px;background:#f5f7f5;padding:9px;font-size:11px;line-height:1.5;white-space:pre-wrap;color:#435049">${escapeHtml(description)}</div>` : `<div style="margin-top:10px;border-radius:7px;background:#f5f7f5;padding:9px;font-size:11px;color:#68756e">No hay una descripción persistida para este archivo.</div>`}

    <div style="margin-top:9px;padding:8px;border-radius:7px;background:${layer.geometrySource === "placemark" ? "#edf6f1" : "#fff7df"};color:${layer.geometrySource === "placemark" ? "#285a43" : "#6f5012"};font-size:10px;line-height:1.45">${escapeHtml(sourceMessage)}</div>
    ${location ? `<div style="margin-top:7px;font-size:10px;color:#68756e">Ubicación geográfica: ${escapeHtml(location)}</div>` : ""}
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
  const [layersOpen, setLayersOpen] = useState(false)
  const [propertyRecord, setPropertyRecord] = useState<PropertyRecord | null>(null)

  const supabase = useMemo(() => createBrowserClient(), [])

  const displayFiles = useMemo(() => {
    const safeFiles = Array.isArray(kmzFiles) ? (kmzFiles as any[]) : []
    if (!selectedKmzId) return safeFiles
    const matched = safeFiles.filter((file) => selectedFileMatches(file, String(selectedKmzId)))
    if (matched.length > 0) return matched
    return safeFiles.length === 1 ? safeFiles : []
  }, [kmzFiles, selectedKmzId])

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
        fileName: file.fileName || propertyRecord?.file_name || "Archivo KMZ",
        layer: shape,
        visible: true,
        color,
        bounds,
        description,
        geometrySource,
        isLoadingLocation: enableGeocoding,
        property: propertyRecord,
      }
      const popupOptions = { autoPan: false, maxWidth: 360, minWidth: 300, closeButton: true, className: "kmz-property-popup" }
      shape.bindPopup(buildPopup(info, centerPoint), popupOptions)
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
          const description = cleanDescription(placemark?.description) || getFileDescription(file, propertyRecord)
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

          const shape = placemark?.type === "Polygon"
            ? L.polygon(latLngs, { color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.22, isKMZ: true }).addTo(map)
            : L.polyline(latLngs, { color, weight: 3, opacity: 0.9, isKMZ: true }).addTo(map)
          await addLayer(file, placemark.name || placemark.type || "Capa", shape, latLngs, description, "placemark", true)
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
            `${file.fileName || propertyRecord?.file_name || "KMZ"} · ubicación`,
            rectangle,
            latLngs,
            getFileDescription(file, propertyRecord),
            "collection-bounds",
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
    if (entry.bounds.length === 1) map.setView(entry.bounds[0], 13)
    else map.fitBounds(L.latLngBounds(entry.bounds), { padding: [80, 80], maxZoom: 13 })
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
      <div className={`flex items-center justify-center rounded-xl border bg-destructive/5 ${height === "100%" ? "absolute inset-0" : ""}`} style={height !== "100%" ? { height } : undefined}>
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <p className="font-medium text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  // When height is "100%", use absolute inset so Leaflet gets a real pixel height from its positioned ancestor.
  const isFluid = !fullscreen && height === "100%"

  return (
    <div
      ref={containerRef}
      className={`${isFluid ? "absolute inset-0" : "relative"} min-h-0 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm`}
      style={fullscreen ? { height: "100vh" } : isFluid ? undefined : { height }}
    >
      <div ref={mapNodeRef} className="h-full w-full" />

      {!mapReady || loading ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/45 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando ubicación y ficha…
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
