"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Loader2, MapPin, RefreshCw, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CampoIntelligencePanelV2 } from "@/components/campos/campo-intelligence-panel-v2"
import { KMZMapDisplay, type LayerInfo } from "@/components/kmz/kmz-map-display"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  loadKmzInventory,
  loadKmzInventoryRegionSummary,
  type KmzInventoryRecord,
  type KmzInventoryRegionSummary,
} from "@/lib/kmz/kmz-inventory-service"
import { extractKmzGeometry, isRenderableKmzPolygon, type KmzRenderablePlacemark } from "@/lib/kmz/kmz-geometry-compat"

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  real_geometry: { label: "Capa KMZ", className: "border-primary/25 bg-primary/8 text-primary" },
  sii_reference: { label: "Centro SII", className: "border-[hsl(var(--sr-water)/0.3)] bg-[hsl(var(--sr-water)/0.1)] text-[hsl(var(--sr-water))]" },
  bounds_reference: { label: "Centro del KMZ", className: "border-border bg-muted/55 text-foreground" },
  direct_reference: { label: "Punto", className: "border-primary/20 bg-primary/5 text-primary" },
  metadata_reference: { label: "Punto territorial", className: "border-[hsl(var(--sr-earth)/0.3)] bg-[hsl(var(--sr-earth)/0.1)] text-[hsl(var(--sr-earth))]" },
  real_or_reference: { label: "Ubicación KMZ", className: "border-border bg-muted/45 text-foreground" },
  missing: { label: "Ubicación pendiente", className: "border-amber-600/25 bg-amber-600/8 text-amber-700 dark:text-amber-300" },
}

type CirenNeighbor = {
  sourceObjectId: string
  rol: string | null
  comuna: string | null
  relation: "same_property" | "adjacent" | "nearby"
  distanceM: number
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }
}

type CirenDatasetContext = {
  sourceService?: string
  sourceYear?: number | null
  layerId?: number | null
  layerName?: string | null
  catalogMode?: "live" | "fallback" | null
  unsupported?: boolean
  cached?: boolean
  upstreamUnavailable?: boolean
  fetchedAt?: string
}

type CirenContext = {
  kmzId: string
  region: string
  geometryScope?: "largest_polygon" | "single_polygon"
  polygonCount?: number
  properties: (CirenDatasetContext & { neighbors?: CirenNeighbor[] }) | null
  soils: (CirenDatasetContext & { classes?: string[]; featureCount?: number }) | null
}

function geometryBadge(record: KmzInventoryRecord) {
  return STATUS_STYLE[record.geometry_status] || STATUS_STYLE.real_or_reference
}

function toPointPlacemark(record: KmzInventoryRecord): KmzRenderablePlacemark {
  const status = geometryBadge(record)
  return {
    name: `${record.file_name} · ${status.label}`,
    type: "Point",
    coordinates: [[Number(record.longitude), Number(record.latitude)]],
    description: `${status.label} del inventario Surrealista`,
    properties: {
      geometryStatus: record.geometry_status,
      referenceLabel: status.label,
      isReferenceLocation: true,
      rol: record.rol_numbers?.[0] || "",
      category: record.category || "general",
    },
  }
}

function toRegionalPointFile(record: KmzInventoryRecord) {
  return {
    id: record.id,
    dbId: record.id,
    fileName: record.file_name,
    placemarks: [toPointPlacemark(record)],
    bounds: record.bounds,
    metadata: {
      id: record.id,
      region: record.region,
      geometryStatus: record.geometry_status,
      geometryLabel: geometryBadge(record).label,
      rolNumbers: record.rol_numbers || [],
      regionalPreview: true,
    },
  }
}

function regionalPointFiles(records: KmzInventoryRecord[], excludedId?: string | number | null) {
  return records
    .filter((record) => Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude)))
    .filter((record) => excludedId == null || String(record.id) !== String(excludedId))
    .map(toRegionalPointFile)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function centerFromBounds(bounds: unknown, fallback: { lat: number; lng: number }) {
  const value = bounds && typeof bounds === "object" ? bounds as Record<string, unknown> : {}
  const north = Number(value.north)
  const south = Number(value.south)
  const east = Number(value.east)
  const west = Number(value.west)
  if ([north, south, east, west].every(Number.isFinite)) {
    return { lat: (north + south) / 2, lng: (east + west) / 2 }
  }
  return fallback
}

function cirenOuterRings(geometry: CirenNeighbor["geometry"]) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [] as number[][][]
  if (geometry.type === "Polygon") {
    const ring = (geometry.coordinates as unknown[]).find((value) => Array.isArray(value))
    return Array.isArray(ring) ? [ring as number[][]] : []
  }
  return (geometry.coordinates as unknown[]).flatMap((polygon) => {
    if (!Array.isArray(polygon)) return []
    const ring = polygon.find((value) => Array.isArray(value))
    return Array.isArray(ring) ? [ring as number[][]] : []
  })
}

function cirenNeighborPlacemarks(context: CirenContext | null): KmzRenderablePlacemark[] {
  const sourceYear = context?.properties?.sourceYear
  return (context?.properties?.neighbors || []).flatMap((neighbor, neighborIndex) =>
    cirenOuterRings(neighbor.geometry).map((coordinates, polygonIndex): KmzRenderablePlacemark => ({
      name: neighbor.relation === "same_property"
        ? `CIREN · Predio asociado${neighbor.rol ? ` · ROL ${neighbor.rol}` : ""}`
        : `CIREN · Predio cercano${neighbor.rol ? ` · ROL ${neighbor.rol}` : ""}`,
      type: "Polygon",
      coordinates: coordinates
        .filter((pair) => Array.isArray(pair) && pair.length >= 2)
        .map((pair) => [Number(pair[0]), Number(pair[1])]),
      description: [
        "Cartografía complementaria CIREN / IDE Minagri",
        neighbor.comuna ? `Comuna: ${neighbor.comuna}` : null,
        sourceYear ? `Cartografía ${sourceYear}` : null,
        neighbor.relation === "adjacent" ? "Próximo al límite del KMZ" : null,
        neighbor.relation === "nearby" ? `Aprox. ${neighbor.distanceM} m del KMZ` : null,
      ].filter(Boolean).join(" · "),
      properties: {
        geometryStatus: "real_geometry",
        isReferenceLocation: false,
        source: "ciren",
        relation: neighbor.relation,
        rol: neighbor.rol || "",
        comuna: neighbor.comuna || "",
        sourceYear: sourceYear || null,
        neighborIndex,
        polygonIndex,
      },
    })).filter((placemark) => isRenderableKmzPolygon(placemark.coordinates)),
  )
}

export function CAMPOSFolderViewIntegrated() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const cirenRequestRef = useRef(0)
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
  const [, setLoadingCiren] = useState(false)
  const [cirenContext, setCirenContext] = useState<CirenContext | null>(null)
  const [, setCirenError] = useState(false)
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
    cirenRequestRef.current += 1
    setCirenContext(null)
    setCirenError(false)
    setLoadingCiren(false)
    setSelectedRegion(region)
    setSelectedRecord(null)
    setSelectedLayer(null)
    setLoadingMap(true)

    try {
      const records = await ensureRegionRecords(region)
      const pointFiles = regionalPointFiles(records)
      setKmzFiles(pointFiles)

      const summary = summaries.find((item) => item.region === region)
      const firstPoint = records.find(
        (record) => Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude)),
      )
      setMapCenter({
        lat: Number(summary?.center_latitude || firstPoint?.latitude || -39.8),
        lng: Number(summary?.center_longitude || firstPoint?.longitude || -73.2),
      })
    } catch (error) {
      console.error("[CAMPOS] region inventory failed", error)
      setKmzFiles([])
    } finally {
      setLoadingMap(false)
    }
  }, [ensureRegionRecords, summaries])

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

  const loadCirenContext = useCallback(async (record: KmzInventoryRecord, requestToken: number) => {
    setLoadingCiren(true)
    setCirenError(false)
    try {
      const response = await fetch(`/api/kmz/ciren-context?kmzId=${encodeURIComponent(String(record.id))}&radiusM=1200`, {
        cache: "no-store",
      })
      if (cirenRequestRef.current !== requestToken) return
      if (!response.ok) {
        if (response.status !== 422) console.warn("[CAMPOS] CIREN context unavailable", response.status)
        setCirenContext(null)
        setCirenError(response.status !== 422)
        return
      }

      const context = await response.json() as CirenContext
      if (cirenRequestRef.current !== requestToken) return
      setCirenContext(context)
      const overlayPlacemarks = cirenNeighborPlacemarks(context)

      setKmzFiles((current) => {
        if (cirenRequestRef.current !== requestToken) return current
        const base = current.filter((file) => file?.metadata?.source !== "ciren")
        const hasSelectedBase = base.some((file) => String(file?.id ?? file?.dbId) === String(record.id))
        if (!hasSelectedBase || overlayPlacemarks.length === 0) return base
        return [...base, {
          id: `ciren:${record.id}`,
          dbId: String(record.id),
          fileName: "Referencia CIREN",
          placemarks: overlayPlacemarks,
          metadata: {
            source: "ciren",
            overlayForKmzId: String(record.id),
            sourceYear: context.properties?.sourceYear || null,
            sourceLayer: context.properties?.layerName || null,
          },
        }]
      })
    } catch (error) {
      if (cirenRequestRef.current !== requestToken) return
      console.warn("[CAMPOS] CIREN context failed", error)
      setCirenContext(null)
      setCirenError(true)
    } finally {
      if (cirenRequestRef.current === requestToken) setLoadingCiren(false)
    }
  }, [])

  const loadSelectedKmz = useCallback(async (record: KmzInventoryRecord) => {
    const requestToken = cirenRequestRef.current + 1
    cirenRequestRef.current = requestToken
    setCirenContext(null)
    setCirenError(false)
    setLoadingCiren(false)
    setSelectedRecord(record)
    setSelectedRegion(record.region)
    setSelectedLayer(null)
    setLoadingMap(true)
    setMapCenter({ lat: Number(record.latitude), lng: Number(record.longitude) })

    const regionRecords = await ensureRegionRecords(record.region)
    const surroundingPoints = regionalPointFiles(regionRecords, record.id)

    try {
      const [{ data: collection, error: collectionError }, { data: storedPlacemarks, error: placemarkError }] = await Promise.all([
        supabase.from("kmz_collection").select("*").eq("id", record.id).single(),
        supabase.from("kmz_placemarks").select("*").eq("kmz_id", record.id).limit(5000),
      ])
      if (collectionError || !collection) throw collectionError || new Error("KMZ collection record missing")
      if (placemarkError) console.warn("[CAMPOS] placemark lookup failed; using legacy geometry", placemarkError)

      const collectionRow = asRecord(collection)
      const collectionDescription = asString(collectionRow.description)
      const collectionCoordinates = collectionRow.coordinates
      const collectionBounds = collectionRow.bounds

      const placemarks = (storedPlacemarks || []).flatMap((placemark: any) =>
        extractKmzGeometry(placemark.coordinates, {
          name: placemark.name || record.file_name,
          description: placemark.description || collectionDescription,
          declaredType: placemark.type,
          styleUrl: placemark.style_url || undefined,
          properties: placemark.properties || {},
        }),
      )

      if (placemarks.length === 0) {
        placemarks.push(...extractKmzGeometry(collectionCoordinates, {
          name: record.file_name,
          description: collectionDescription,
        }))
      }

      if (placemarks.length === 0) placemarks.push(toPointPlacemark(record))
      const hasRealGeometry = placemarks.some((placemark) => placemark.properties?.isReferenceLocation === false)
      setKmzFiles([...surroundingPoints, {
        id: record.id,
        dbId: record.id,
        fileName: record.file_name,
        placemarks,
        bounds: collectionBounds || record.bounds,
        metadata: {
          id: record.id,
          region: record.region,
          geometryStatus: hasRealGeometry ? "real_geometry" : record.geometry_status,
          geometryLabel: hasRealGeometry ? "Geometría KMZ" : geometryBadge(record).label,
          rolNumbers: record.rol_numbers || [],
          selectedDetail: true,
        },
      }])
      setMapCenter(centerFromBounds(collectionBounds, { lat: Number(record.latitude), lng: Number(record.longitude) }))
      if (hasRealGeometry) void loadCirenContext(record, requestToken)
    } catch (error) {
      console.error("[CAMPOS] selected KMZ failed", error)
      setKmzFiles([...surroundingPoints, toRegionalPointFile(record)])
    } finally {
      setLoadingMap(false)
    }
  }, [ensureRegionRecords, loadCirenContext, supabase])

  const handlePlacemarkSelect = useCallback((layer: LayerInfo | null) => {
    setSelectedLayer(layer)
    if (!layer || !selectedRegion) return
    const record = (recordsByRegion[selectedRegion] || []).find((item) => String(item.id) === String(layer.fileId))
    if (record && String(record.id) !== String(selectedRecord?.id || "")) void loadSelectedKmz(record)
  }, [loadSelectedKmz, recordsByRegion, selectedRecord?.id, selectedRegion])

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
      [record.file_name, record.region, ...(record.rol_numbers || [])]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(query)),
    )
  }, [recordsByRegion, search])

  const cirenNeighbors = cirenContext?.properties?.neighbors || []
  const cirenSameProperty = cirenNeighbors.find((neighbor) => neighbor.relation === "same_property") || null

  if (fatalError) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md">
          <MapPin className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
          <h2 className="text-base font-semibold">No se pudo cargar el inventario territorial</h2>
          <p className="mt-2 text-sm text-muted-foreground">CAMPOS no mostrará datos parciales ni simulados. Reintenta la carga cuando la fuente esté disponible.</p>
          <Button className="mt-4" variant="outline" onClick={loadSummaries}>Reintentar</Button>
        </div>
      </div>
    )
  }

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
          <section className="max-h-[46vh] overflow-y-auto border-t bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="sr-meta">KMZ seleccionado</p>
                <h2 className="mt-1 truncate text-base font-semibold">{selectedRecord.file_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{selectedRecord.region}</span>
                  {selectedRecord.rol_numbers?.[0] ? <><span aria-hidden="true">·</span><span>ROL {selectedRecord.rol_numbers[0]}</span></> : null}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Datos documentados del campo y evidencia territorial disponible.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant="outline" className={geometryBadge(selectedRecord).className}>{geometryBadge(selectedRecord).label}</Badge>
                {selectedLayer ? <Badge variant="outline">{selectedLayer.name}</Badge> : null}
              </div>
            </div>

            <CampoIntelligencePanelV2
              record={selectedRecord}
              ciren={{
                samePropertyRol: cirenSameProperty?.rol || null,
                neighborCount: cirenNeighbors.length,
              }}
            />
          </section>
        ) : null}
      </main>
    </div>
  )
}
