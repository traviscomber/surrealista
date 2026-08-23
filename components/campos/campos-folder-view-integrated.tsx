"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Loader2, MapPin, RefreshCw, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KMZMapDisplay, type LayerInfo } from "@/components/kmz/kmz-map-display"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  loadKmzInventory,
  loadKmzInventoryRegionSummary,
  type KmzInventoryRecord,
  type KmzInventoryRegionSummary,
} from "@/lib/kmz/kmz-inventory-service"
import { CAMPOSFolderView } from "@/components/campos/campos-folder-view"

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  real_geometry: { label: "Capa KMZ", className: "border-primary/25 bg-primary/8 text-primary" },
  sii_reference: { label: "Centro SII", className: "border-[hsl(var(--sr-water)/0.3)] bg-[hsl(var(--sr-water)/0.1)] text-[hsl(var(--sr-water))]" },
  bounds_reference: { label: "Centro del KMZ", className: "border-border bg-muted/55 text-foreground" },
  direct_reference: { label: "Punto", className: "border-primary/20 bg-primary/5 text-primary" },
  metadata_reference: { label: "Punto territorial", className: "border-[hsl(var(--sr-earth)/0.3)] bg-[hsl(var(--sr-earth)/0.1)] text-[hsl(var(--sr-earth))]" },
  real_or_reference: { label: "Ubicación KMZ", className: "border-border bg-muted/45 text-foreground" },
  missing: { label: "Ubicación pendiente", className: "border-amber-600/25 bg-amber-600/8 text-amber-700 dark:text-amber-300" },
}

function geometryBadge(record: KmzInventoryRecord) {
  return STATUS_STYLE[record.geometry_status] || STATUS_STYLE.real_or_reference
}

function toPointPlacemark(record: KmzInventoryRecord) {
  const status = geometryBadge(record)
  return {
    name: `${record.file_name} · ${status.label}`,
    type: "Point",
    coordinates: [[Number(record.longitude), Number(record.latitude)]],
    description: `${status.label} del inventario Surrealista`,
    properties: {
      geometryStatus: record.geometry_status,
      referenceLabel: status.label,
      isReferenceLocation: record.geometry_status !== "real_geometry",
      rol: record.rol_numbers?.[0] || "",
      category: record.category || "general",
    },
  }
}

function normalizeCoordinates(value: unknown): number[][] {
  if (!Array.isArray(value)) return []
  const direct = value
    .filter((item) => Array.isArray(item) && item.length >= 2)
    .map((item) => [Number(item[0]), Number(item[1])])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))
  if (direct.length > 0) return direct
  if (value.length === 1) return normalizeCoordinates(value[0])
  return []
}

function inferType(coordinates: number[][], declared?: string | null) {
  if (declared === "Polygon" || declared === "LineString" || declared === "Point") return declared
  if (coordinates.length <= 1) return "Point"
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  return coordinates.length >= 4 && first?.[0] === last?.[0] && first?.[1] === last?.[1] ? "Polygon" : "LineString"
}

function isRenderablePolygon(coordinates: number[][]) {
  if (coordinates.length < 4) return false
  const unique = new Set(coordinates.map(([lng, lat]) => `${lng.toFixed(8)}:${lat.toFixed(8)}`))
  return unique.size >= 3
}

function centerFromBounds(bounds: any, fallback: { lat: number; lng: number }) {
  const north = Number(bounds?.north)
  const south = Number(bounds?.south)
  const east = Number(bounds?.east)
  const west = Number(bounds?.west)
  if ([north, south, east, west].every(Number.isFinite)) {
    return { lat: (north + south) / 2, lng: (east + west) / 2 }
  }
  return fallback
}

export function CAMPOSFolderViewIntegrated() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [summaries, setSummaries] = useState<KmzInventoryRegionSummary[]>([])
  const [recordsByRegion, setRecordsByRegion] = useState<Record<string, KmzInventoryRecord[]>>({})
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set())
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<KmzInventoryRecord | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null)
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [search, setSearch] = useState("")
  const [loadingRegions, setLoadingRegions] = useState<Set<string>>(new Set())
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMap, setLoadingMap] = useState(false)
  const [fatalError, setFatalError] = useState(false)

  const loadSummaries = useCallback(async () => {
    setLoadingInitial(true)
    try {
      setSummaries(await loadKmzInventoryRegionSummary(supabase))
      setFatalError(false)
    } catch (error) {
      console.error("[CAMPOS] unified inventory summary failed", error)
      setFatalError(true)
    } finally {
      setLoadingInitial(false)
    }
  }, [supabase])

  useEffect(() => { void loadSummaries() }, [loadSummaries])

  const ensureRegionRecords = useCallback(async (region: string) => {
    if (recordsByRegion[region]) return recordsByRegion[region]
    setLoadingRegions((current) => new Set(current).add(region))
    try {
      const records = await loadKmzInventory(supabase, { regions: [region] })
      setRecordsByRegion((current) => ({ ...current, [region]: records }))
      return records
    } finally {
      setLoadingRegions((current) => {
        const next = new Set(current)
        next.delete(region)
        return next
      })
    }
  }, [recordsByRegion, supabase])

  const loadRegionMap = useCallback(async (region: string) => {
    setSelectedRegion(region)
    setSelectedRecord(null)
    setSelectedLayer(null)
    setLoadingMap(true)
    try {
      const records = await ensureRegionRecords(region)
      const ids = records.map((record) => record.id)
      const chunks: string[][] = []
      for (let index = 0; index < ids.length; index += 150) chunks.push(ids.slice(index, index + 150))

      const placemarkResponses = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from("kmz_placemarks")
            .select("kmz_id,name,description,coordinates,type,style_url,properties")
            .in("kmz_id", chunk)
            .eq("type", "Polygon")
            .limit(5000),
        ),
      )

      const polygonsByKmz = new Map<string, any[]>()
      placemarkResponses.forEach(({ data, error }) => {
        if (error) throw error
        ;(data || []).forEach((placemark: any) => {
          const coordinates = normalizeCoordinates(placemark.coordinates)
          if (!isRenderablePolygon(coordinates)) return
          const key = String(placemark.kmz_id)
          const current = polygonsByKmz.get(key) || []
          current.push({
            name: placemark.name || "Polígono KMZ",
            type: "Polygon",
            coordinates,
            description: placemark.description || "",
            styleUrl: placemark.style_url || undefined,
            properties: { ...(placemark.properties || {}), geometryStatus: "real_geometry", isReferenceLocation: false },
          })
          polygonsByKmz.set(key, current)
        })
      })

      setKmzFiles(records.map((record) => {
        const polygons = polygonsByKmz.get(String(record.id)) || []
        return {
          id: record.id,
          dbId: record.id,
          fileName: record.file_name,
          placemarks: polygons.length > 0 ? polygons : [toPointPlacemark(record)],
          bounds: record.bounds,
          metadata: {
            id: record.id,
            region: record.region,
            geometryStatus: polygons.length > 0 ? "real_geometry" : record.geometry_status,
            geometryLabel: polygons.length > 0 ? "Polígono KMZ" : geometryBadge(record).label,
            rolNumbers: record.rol_numbers || [],
            polygonCount: polygons.length,
          },
        }
      }))

      const summary = summaries.find((item) => item.region === region)
      setMapCenter({
        lat: Number(summary?.center_latitude || records[0]?.latitude || -39.8),
        lng: Number(summary?.center_longitude || records[0]?.longitude || -73.2),
      })
    } catch (error) {
      console.error("[CAMPOS] region inventory failed", error)
      setKmzFiles([])
    } finally {
      setLoadingMap(false)
    }
  }, [ensureRegionRecords, summaries, supabase])

  const toggleRegion = useCallback(async (region: string) => {
    const isOpen = openRegions.has(region)
    setOpenRegions((current) => {
      const next = new Set(current)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
    if (!isOpen) await ensureRegionRecords(region)
  }, [ensureRegionRecords, openRegions])

  const loadSelectedKmz = useCallback(async (record: KmzInventoryRecord) => {
    setSelectedRecord(record)
    setSelectedRegion(record.region)
    setSelectedLayer(null)
    setLoadingMap(true)
    setMapCenter({ lat: Number(record.latitude), lng: Number(record.longitude) })

    try {
      const [{ data: collection, error: collectionError }, { data: storedPlacemarks }] = await Promise.all([
        supabase.from("kmz_collection").select("*").eq("id", record.id).single(),
        supabase.from("kmz_placemarks").select("*").eq("kmz_id", record.id).limit(5000),
      ])
      if (collectionError || !collection) throw collectionError

      const placemarks = (storedPlacemarks || []).flatMap((placemark: any) => {
        const coordinates = normalizeCoordinates(placemark.coordinates)
        if (coordinates.length === 0) return []
        const type = inferType(coordinates, placemark.type)
        if (type === "Polygon" && !isRenderablePolygon(coordinates)) return []
        return [{
          name: placemark.name || record.file_name,
          type,
          coordinates,
          description: placemark.description || collection.description || "",
          styleUrl: placemark.style_url || undefined,
          properties: { ...(placemark.properties || {}), geometryStatus: "real_geometry", isReferenceLocation: false },
        }]
      })

      if (placemarks.length === 0 && Array.isArray(collection.coordinates)) {
        collection.coordinates.forEach((raw: unknown, index: number) => {
          const coordinates = normalizeCoordinates(raw)
          if (coordinates.length === 0) return
          const type = inferType(coordinates)
          if (type === "Polygon" && !isRenderablePolygon(coordinates)) return
          placemarks.push({
            name: `${record.file_name} · Capa ${index + 1}`,
            type,
            coordinates,
            description: collection.description || "",
            properties: { geometryStatus: "real_geometry", isReferenceLocation: false },
          })
        })
      }

      if (placemarks.length === 0) placemarks.push(toPointPlacemark(record))
      setKmzFiles([{
        id: record.id,
        dbId: record.id,
        fileName: record.file_name,
        placemarks,
        bounds: collection.bounds || record.bounds,
        metadata: {
          id: record.id,
          region: record.region,
          geometryStatus: record.geometry_status,
          geometryLabel: geometryBadge(record).label,
          rolNumbers: record.rol_numbers || [],
        },
      }])
      setMapCenter(centerFromBounds(collection.bounds, { lat: Number(record.latitude), lng: Number(record.longitude) }))
    } catch (error) {
      console.error("[CAMPOS] selected KMZ failed", error)
      setKmzFiles([{
        id: record.id,
        dbId: record.id,
        fileName: record.file_name,
        placemarks: [toPointPlacemark(record)],
        bounds: record.bounds,
        metadata: { id: record.id, region: record.region },
      }])
    } finally {
      setLoadingMap(false)
    }
  }, [supabase])

  const handlePlacemarkSelect = useCallback((layer: LayerInfo | null) => {
    setSelectedLayer(layer)
    if (!layer || selectedRecord || !selectedRegion) return
    const record = (recordsByRegion[selectedRegion] || []).find((item) => String(item.id) === String(layer.fileId))
    if (record) void loadSelectedKmz(record)
  }, [loadSelectedKmz, recordsByRegion, selectedRecord, selectedRegion])

  const filteredSummaries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es")
    if (!query) return summaries
    return summaries.filter((summary) => summary.region.toLocaleLowerCase("es").includes(query))
  }, [search, summaries])

  const visibleRegionRecords = useCallback((region: string) => {
    const records = recordsByRegion[region] || []
    const query = search.trim().toLocaleLowerCase("es")
    if (!query) return records
    return records.filter((record) =>
      [record.file_name, record.region, record.owner, ...(record.rol_numbers || [])]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(query)),
    )
  }, [recordsByRegion, search])

  if (fatalError) return <CAMPOSFolderView />

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-[352px] min-w-[352px] flex-col border-r bg-card">
        <div className="space-y-4 border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sr-meta">Inventario territorial</p>
              <h2 className="sr-panel-title mt-1">Colección de campos</h2>
              <p className="mt-1 text-sm text-muted-foreground">{summaries.reduce((sum, item) => sum + Number(item.total_kmz || 0), 0)} KMZ · {summaries.length} regiones</p>
            </div>
            <Button variant="outline" size="icon" onClick={loadSummaries} disabled={loadingInitial} aria-label="Actualizar inventario">
              <RefreshCw className={`h-4 w-4 ${loadingInitial ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar región, KMZ o ROL" className="pl-9" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loadingInitial ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando inventario...</div>
          ) : filteredSummaries.map((summary) => {
            const isOpen = openRegions.has(summary.region)
            const isLoading = loadingRegions.has(summary.region)
            const records = visibleRegionRecords(summary.region)
            const isSelected = selectedRegion === summary.region
            return (
              <div key={summary.region} className="mb-1 border-b border-border/60 pb-1 last:border-b-0">
                <div className={`flex items-center gap-1 rounded-md px-1 ${isSelected ? "bg-secondary" : ""}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRegion(summary.region)}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start px-2 py-2" onClick={() => loadRegionMap(summary.region)}>
                    {isOpen ? <FolderOpen className="mr-2 h-4 w-4 shrink-0 text-primary" /> : <Folder className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{summary.region}</span>
                    <span className="ml-3 text-xs tabular-nums text-muted-foreground">{summary.total_kmz}</span>
                  </Button>
                </div>
                {isOpen ? (
                  <div className="ml-5 border-l border-border/70 py-1 pl-3">
                    {records.map((record) => {
                      const badge = geometryBadge(record)
                      const active = selectedRecord?.id === record.id
                      return (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => loadSelectedKmz(record)}
                          className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/70 ${active ? "bg-secondary text-foreground" : "text-foreground"}`}
                        >
                          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-xs">{record.file_name}</span>
                          <Badge variant="outline" className={`shrink-0 text-[11px] ${badge.className}`}>{badge.label}</Badge>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 items-center justify-between border-b bg-card px-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">CAMPOS</h1>
            <p className="truncate text-xs text-muted-foreground">
              {selectedRecord ? selectedRecord.file_name : selectedRegion ? `${selectedRegion} · ${kmzFiles.length} KMZ visibles` : "Selecciona una región"}
            </p>
          </div>
          {selectedRecord ? <Badge variant="outline" className={geometryBadge(selectedRecord).className}>{geometryBadge(selectedRecord).label}</Badge> : null}
        </header>

        <div className="relative min-h-0 flex-1">
          {loadingMap ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : null}
          {kmzFiles.length > 0 && mapCenter ? (
            <KMZMapDisplay
              kmzFiles={kmzFiles}
              centerCoordinates={mapCenter}
              height="100%"
              enableGeocoding
              selectedKmzId={selectedRecord?.id || null}
              onPlacemarkSelect={handlePlacemarkSelect}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary/35">
              <div className="max-w-sm text-center text-muted-foreground"><MapPin className="mx-auto mb-4 h-10 w-10 text-primary" /><p className="text-sm">Selecciona una región para ver sus KMZ en el mapa.</p></div>
            </div>
          )}
        </div>

        {selectedRecord ? (
          <section className="border-t bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="sr-meta">KMZ seleccionado</p>
                <h2 className="mt-1 truncate text-base font-semibold">{selectedRecord.file_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{selectedRecord.region}</span><span aria-hidden="true">·</span>
                  <span>{selectedRecord.rol_numbers?.[0] ? `ROL ${selectedRecord.rol_numbers[0]}` : "ROL pendiente"}</span><span aria-hidden="true">·</span>
                  <span>{selectedRecord.owner || "Propietario pendiente"}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant="outline" className={geometryBadge(selectedRecord).className}>{geometryBadge(selectedRecord).label}</Badge>
                <Badge variant="outline">{Math.round(Number(selectedRecord.completeness_score || 0))}% completo</Badge>
                {selectedLayer ? <Badge variant="outline">{selectedLayer.name}</Badge> : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}