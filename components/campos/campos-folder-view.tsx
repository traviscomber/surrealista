"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback, memo, useDeferredValue } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { KMZMapDisplay } from "@/components/kmz/kmz-map-display"
import { OnboardingGuide } from "@/components/campos/onboarding-guide"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Folder,
  FolderOpen,
  File,
  Search,
  ChevronRight,
  ChevronDown,
  MapPin,
  RefreshCw,
  Menu,
  Upload,
  FileText,
  ExternalLink,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Building2,
  Globe2,
  ShieldCheck,
  SearchCode,
  Link2,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Copy,
} from "lucide-react"
import { kmzReader } from "@/lib/kmz/kmz-reader"
import { kmzStorageService } from "@/lib/kmz/kmz-storage-service"
import { kmzAdvancedFilterService } from "@/lib/kmz/kmz-advanced-filter-service"
import { regionRescanService, type RescanProgress } from "@/lib/kmz/region-rescan-service"
import { documentKMZLinker, type KMZDocumentLink } from "@/lib/documents/document-kmz-linker"
import { useToast } from "@/hooks/use-toast"
import { CAMPOSAIAgent } from "@/components/campos/campos-ai-agent"
import { AdvancedGeoSearch } from "@/components/features/advanced-geo-search/advanced-geo-search"

interface FolderItem {
  id: string
  name: string
  type: "folder" | "file"
  location?: { lat: number; lng: number }
  description?: string | null
  area?: string
  owner?: string
  google_docs_link?: string
  kmzFiles?: any[]
  children?: FolderItem[]
  isOpen?: boolean
  category?: string
  fileCount?: number
  dbId?: number
  isDriveFile?: boolean
  driveFileId?: string
  rolNumbers?: string[]
  metadata?: Record<string, any>
  placemarksCount?: number
  region?: string
}

const formatDateLabel = (value?: string | null) => {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

const formatCurrencyCLP = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

const formatMeasure = (value?: number | null, suffix = "m2") => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)} ${suffix}`
}

const normalizeList = (values?: unknown[]) => {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => `${value ?? ""}`.trim())
    .filter(Boolean)
}

const normalizeKmzDescription = (value?: string | null) => {
  if (!value) return null

  const cleaned = value
    .replace(/<!\[CDATA\[|\]\]>/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return cleaned || null
}

const extractDescriptionHighlights = (value?: string | null, limit = 4) => {
  const normalized = normalizeKmzDescription(value)
  if (!normalized) return []

  const ignored = new Set(["DESCRIPCION", "DESCRIPCIÓN", "DESCRIPTION"])
  return normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length > 6)
    .filter((line) => !ignored.has(line.toUpperCase()))
    .slice(0, limit)
}

const getPrimaryRole = (item: FolderItem | null) => {
  if (!item) return null
  const roles = normalizeList(item.rolNumbers)
  return roles[0] || null
}

const getRoleStatus = (item: FolderItem | null) => {
  const roles = normalizeList(item?.rolNumbers)
  const metadata = item?.metadata || {}

  if (roles.length > 0) {
    if (metadata.latest_cbr_owner_record || item?.owner?.trim()) {
      return {
        label: "Rol y dueno confirmados",
        tone: "emerald",
        icon: CheckCircle2,
      }
    }

    if (metadata.public_owner_candidate || metadata.latest_owner_evidence) {
      return {
        label: "Rol resuelto, dueno en investigacion",
        tone: "amber",
        icon: SearchCode,
      }
    }

    return {
      label: "Rol resuelto",
      tone: "sky",
      icon: ShieldCheck,
    }
  }

  return {
    label: "Rol pendiente",
    tone: "slate",
    icon: AlertCircle,
  }
}

const getToneClasses = (tone: string) => {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/30 bg-emerald-500/12 text-emerald-50"
    case "amber":
      return "border-amber-500/30 bg-amber-500/12 text-amber-50"
    case "sky":
      return "border-sky-500/30 bg-sky-500/12 text-sky-50"
    default:
      return "border-white/10 bg-white/[0.04] text-slate-100"
  }
}

const detailsCardClass = "border-white/10 bg-[#0f1724]/92 text-slate-100 shadow-[0_18px_48px_rgba(2,6,23,0.28)]"
const detailsPanelClass = "rounded-xl border border-white/10 bg-white/[0.04] p-3"
const detailsSubtlePanelClass = "rounded-xl border border-white/10 bg-white/[0.03] p-3"
const detailsLabelClass = "text-[11px] uppercase tracking-wide text-slate-400"
const detailsValueClass = "mt-1 text-sm font-medium text-slate-100"
const lightDetailsCardClass = "border-slate-200 bg-white shadow-none"

const extractOwnerResearchSummary = (metadata?: Record<string, any>) => {
  const queue = metadata?.owner_research_queue
  if (!queue) return null

  return {
    priorityTier: queue.priorityTier || null,
    priorityScore: queue.priorityScore ?? null,
    status: queue.status || null,
    suggestedNextStep: queue.suggestedNextStep || null,
    reasons: Array.isArray(queue.reasons) ? queue.reasons.slice(0, 4) : [],
    searchQueries: Array.isArray(queue.searchQueries) ? queue.searchQueries.slice(0, 4) : [],
    resolvedAt: queue.resolvedAt || null,
  }
}

const getCleanRegionName = (fullName: string): string => {
  if (!fullName) return fullName

  // Remove "Region de " or "Region del "
  return fullName.replace(/^Region de /i, "").replace(/^Region del /i, "")
}

// Search input with internal state to prevent focus loss - only syncs to parent on debounce
const SearchInput = memo(function SearchInput({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string
  onChange: (value: string) => void
  disabled?: boolean 
}) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync from parent only when value changes externally (e.g., reset)
  useEffect(() => {
    if (value !== localValue && value === "") {
      setLocalValue(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    
    // Debounce parent update to prevent re-renders while typing
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])


  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar ubicaciones, archivos KMZ..."
        value={localValue}
        onChange={handleChange}
        className="pl-9"
        disabled={disabled}
      />
    </div>
  )
})

export function CAMPOSFolderView() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null)
  const [editingOwner, setEditingOwner] = useState<string>("")
  const [editingGoogleDocsLink, setEditingGoogleDocsLink] = useState<string>("")
  const [isSavingOwner, setIsSavingOwner] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [kmzFiles, setKmzFiles] = useState<any[]>([])
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [isLoadingKMZ, setIsLoadingKMZ] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [regionLoadingProgress, setRegionLoadingProgress] = useState<Record<string, number>>({})
  const [isFolderSheetOpen, setIsFolderSheetOpen] = useState(false)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAIAgent, setShowAIAgent] = useState(false)
  const [totalFileCount, setTotalFileCount] = useState(0)

  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [isRescanning, setIsRescanning] = useState(false)
  const [rescanProgress, setRescanProgress] = useState<RescanProgress | null>(null)

  const [selectedItemDocuments, setSelectedItemDocuments] = useState<KMZDocumentLink[]>([])
  const [documentCount, setDocumentCount] = useState<number>(0)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [isLoadingFromURL, setIsLoadingFromURL] = useState(false)
  const [selectedKmzId, setSelectedKmzId] = useState<string | null>(null)
  const [isResearchExpanded, setIsResearchExpanded] = useState(false)
  const [isEditExpanded, setIsEditExpanded] = useState(false)
  const [isLoadedFilesExpanded, setIsLoadedFilesExpanded] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    priceMin: 0,
    priceMax: 10000000,
    areaMin: 0,
    areaMax: 50000,
    zones: [] as string[],
    propertyTypes: [] as string[],
  })

  const searchParams = useSearchParams()
  const kmzIdFromURL = searchParams?.get("kmz")

  const handleCopyValue = useCallback(
    async (value: string | null | undefined, label: string) => {
      const text = `${value ?? ""}`.trim()
      if (!text) return

      try {
        await navigator.clipboard.writeText(text)
        toast({
          title: `${label} copiado`,
          description: text.length > 96 ? `${text.slice(0, 93)}...` : text,
        })
      } catch {
        toast({
          title: `No se pudo copiar ${label.toLowerCase()}`,
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const DetailsPanel = () => {
    if (!selectedItem) {
      return (
        <>
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Detalles</h2>
          </div>
          <div className="p-6 text-center text-muted-foreground">
            <Folder className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-sm">Selecciona una region o un KMZ para ver el detalle operativo.</p>
          </div>
        </>
      )
    }

    const metadata = selectedItem.metadata || {}
    const roles = normalizeList(selectedItem.rolNumbers)
    const primaryRole = getPrimaryRole(selectedItem)
    const roleStatus = getRoleStatus(selectedItem)
    const toneClasses = getToneClasses(roleStatus.tone)
    const StatusIcon = roleStatus.icon
    const publicCandidate = metadata.public_owner_candidate || null
    const latestEvidence = metadata.latest_owner_evidence || null
    const latestCbr = metadata.latest_cbr_owner_record || null
    const manualRoleAssignment = metadata.manual_role_assignment || null
    const siiPointResolution = metadata.sii_point_resolution || null
    const siiRecord = siiPointResolution?.record || null
    const ownerQueue = extractOwnerResearchSummary(metadata)
    const webOwner = metadata.web_owner || null
    const webOwnerConfidence = metadata.web_owner_confidence || null
    const confirmedOwner = selectedItem.owner || latestCbr?.companyName || latestCbr?.ownerName || null
    const candidateOwner =
      publicCandidate?.owner ||
      latestEvidence?.ownerLabel ||
      latestEvidence?.companyName ||
      latestEvidence?.ownerName ||
      null
    const roleCount = roles.length
    const descriptionText = normalizeKmzDescription(selectedItem.description || metadata?.description || null)
    const descriptionHighlights = extractDescriptionHighlights(descriptionText)
    const evidenceLabel = manualRoleAssignment
      ? "Asignacion manual validada"
      : siiPointResolution
        ? "Cruce geoespacial SII"
        : roleCount > 0
          ? "Rol persistido"
          : "Sin evidencia todavia"
    const latestResolutionAt =
      manualRoleAssignment?.assigned_at ||
      siiPointResolution?.resolved_at ||
      ownerQueue?.resolvedAt ||
      null

    if (selectedItem.type === "folder") {
      return (
        <>
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Detalles</h2>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Estado</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight">{selectedItem.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">Region activa en exploracion de campos.</p>
                </div>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {selectedItem.fileCount || 0} archivos
                </Badge>
              </div>
            </div>

            {selectedItem.location ? (
              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-900">Predio</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p>Centro de region</p>
                    <p className="mt-1">Lat: {selectedItem.location.lat.toFixed(6)}</p>
                    <p>Lng: {selectedItem.location.lng.toFixed(6)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {selectedItem.children?.length ? (
              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-900">Archivos de la region</p>
                  </div>
                  <ScrollArea className="h-[240px] rounded-xl border">
                    <div className="space-y-1 p-2">
                      {selectedItem.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                          <File className="h-3 w-3" />
                          <span className="flex-1 truncate">{child.name}</span>
                          {child.area ? (
                            <Badge variant="outline" className="text-xs">
                              {child.area}
                            </Badge>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      )
    }

    return (
      <>
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Detalles</h2>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className={`overflow-hidden rounded-3xl border shadow-sm ${toneClasses}`}>
            <div className="border-b border-current/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Estado del KMZ</p>
              </div>
            </div>
            <div className="space-y-6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium opacity-90">{roleStatus.label}</p>
                  <div className="mt-3 rounded-3xl border border-white/15 bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-current/70">Rol</p>
                      {primaryRole ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 rounded-full border border-white/10 bg-black/10 px-3 text-current hover:bg-black/20"
                          onClick={() => handleCopyValue(primaryRole, "Rol")}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copiar
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">
                      {primaryRole || "Pendiente"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-current/75">
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1">
                        {roleCount === 1 ? "Rol principal unico" : `${roleCount} roles asociados`}
                      </span>
                      {latestResolutionAt ? (
                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1">
                          {formatDateLabel(latestResolutionAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <h3 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{selectedItem.name}</h3>
                  <p className="mt-2 text-sm opacity-80">{selectedItem.region || "Sin region"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-current/80">
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1">
                      {confirmedOwner ? "Dueno confirmado" : candidateOwner ? "Candidato publico" : "Dueno pendiente"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1">
                      {documentCount} documento{documentCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1">
                      {selectedItem.category || "Sin categoria"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {selectedItem.placemarksCount ? (
                    <Badge variant="outline" className="border-current/20 bg-white/60 px-3 py-1 text-current">
                      {selectedItem.placemarksCount} puntos
                    </Badge>
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          <Card className={detailsCardClass}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-50">Predio</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-full bg-white/10 px-3 text-slate-100 hover:bg-white/15"
                  onClick={() => handleCopyValue(selectedItem.name, "Nombre de KMZ")}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copiar nombre
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className={detailsPanelClass}>
                  <p className={detailsLabelClass}>Region</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{selectedItem.region || "Sin region"}</p>
                </div>
                <div className={detailsPanelClass}>
                  <p className={detailsLabelClass}>Categoria</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{selectedItem.category || "Sin categoria"}</p>
                </div>
                <div className={detailsPanelClass}>
                  <p className={detailsLabelClass}>Documentos</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{documentCount}</p>
                </div>
              </div>

              {descriptionText ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-50">Descripcion del KMZ</p>
                  </div>
                  {descriptionHighlights.length > 1 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {descriptionHighlights.map((line) => (
                        <Badge key={line} variant="secondary" className="max-w-full bg-white/10 text-slate-100">
                          <span className="truncate">{line}</span>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/10 p-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{descriptionText}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                  Este KMZ no trae una descripcion legible en su metadata actual.
                </div>
              )}

              {siiRecord ? (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sky-200" />
                      <p className="text-sm font-semibold text-sky-50">Ficha SII</p>
                    </div>
                    {siiRecord.direccion ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-full border border-sky-400/20 bg-black/10 px-3 text-sky-50 hover:bg-black/20"
                        onClick={() => handleCopyValue(siiRecord.direccion, "Direccion SII")}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copiar direccion
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Direccion SII</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{siiRecord.direccion || "Sin direccion"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Destino</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{siiRecord.destino || "Sin destino"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Avaluo total</p>
                      <p className="mt-2 text-2xl font-bold text-slate-50">{formatCurrencyCLP(siiRecord.avaluoTotal) || "Sin dato"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Periodo</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{siiRecord.periodo || "Sin periodo"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Afecto</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{formatCurrencyCLP(siiRecord.avaluoAfecto) || "Sin dato"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Exento</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{formatCurrencyCLP(siiRecord.avaluoExento) || "Sin dato"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Sup. terreno</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{formatMeasure(siiRecord.superficieTerreno) || "Sin dato"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Sup. construida</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{formatMeasure(siiRecord.superficieConstruida) || "Sin dato"}</p>
                    </div>
                  </div>

                  {siiRecord.areaHomogenea ? (
                    <div className="mt-4 rounded-2xl border border-sky-500/20 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-wide text-sky-200">Area homogenea</p>
                      <p className="mt-2 text-base font-semibold text-slate-50">{siiRecord.areaHomogenea}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {selectedItem.location ? (
                <div className={detailsPanelClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={detailsLabelClass}>Ubicacion del archivo</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-slate-300 hover:bg-white/10 hover:text-slate-100"
                      onClick={() =>
                        handleCopyValue(`${selectedItem.location?.lat.toFixed(6)}, ${selectedItem.location?.lng.toFixed(6)}`, "Coordenadas")
                      }
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Latitud</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">{selectedItem.location.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Longitud</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">{selectedItem.location.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {manualRoleAssignment ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <p className="text-sm font-medium text-sky-950">Ultima asignacion manual</p>
                  <p className="mt-1 text-sm text-sky-950">
                    {manualRoleAssignment.assigned_role || primaryRole || "Sin rol"} | {manualRoleAssignment.evidenceType || "manual-review"}
                  </p>
                  {manualRoleAssignment.notes ? (
                    <p className="mt-2 text-xs text-sky-900">{manualRoleAssignment.notes}</p>
                  ) : null}
                  {manualRoleAssignment.assigned_at ? (
                    <p className="mt-1 text-xs text-sky-800">{formatDateLabel(manualRoleAssignment.assigned_at)}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={lightDetailsCardClass}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-semibold text-slate-900">Dueno / Sociedad</p>
                </div>
                {(confirmedOwner || candidateOwner) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3"
                    onClick={() => handleCopyValue(confirmedOwner || candidateOwner, "Nombre")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar nombre
                  </Button>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Nombre principal</p>
                    <p className="mt-2 text-xl font-bold leading-tight text-slate-950">
                      {confirmedOwner || candidateOwner || "Aun sin nombre identificado"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {confirmedOwner
                        ? "Dueno o sociedad confirmado."
                        : candidateOwner
                          ? "Existe candidato publico pendiente de validacion."
                          : "Sin nombre confirmado todavia."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={confirmedOwner ? "default" : "secondary"} className={confirmedOwner ? "" : "bg-slate-200 text-slate-700"}>
                      {confirmedOwner ? "Confirmado" : "Sin confirmar"}
                    </Badge>
                    {candidateOwner && !confirmedOwner ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                        Candidato publico
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {!confirmedOwner && candidateOwner ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700">Candidato publico</p>
                    <p className="mt-1 text-sm font-medium text-amber-950">{candidateOwner}</p>
                  </div>
                ) : null}

                {webOwner ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-700">Descubrimiento web</p>
                    <p className="mt-1 text-sm font-medium text-emerald-950">{webOwner}</p>
                    {webOwnerConfidence && (
                      <p className="mt-2 text-xs text-emerald-700">
                        Confianza: {Math.round(webOwnerConfidence * 100)}%
                      </p>
                    )}
                  </div>
                ) : null}

                {(latestCbr?.documentType || latestEvidence?.documentType || publicCandidate?.confidence) ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Respaldo</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {latestCbr?.documentType || latestEvidence?.documentType || "Sin documento"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Confianza</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {publicCandidate?.confidence || latestEvidence?.confidence || (confirmedOwner ? "alta" : "pendiente")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Ultimo registro</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDateLabel(latestCbr?.savedAt || latestEvidence?.savedAt) || "Sin fecha"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {latestEvidence?.documentUrl ? (
                  <a
                    href={latestEvidence.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    Abrir respaldo publico
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-700" />
                  <p className="text-sm font-semibold text-slate-900">Trazabilidad SII</p>
                </div>
                {roles.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3"
                    onClick={() => handleCopyValue(roles.join(", "), "Roles")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar roles
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Fuente principal</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{evidenceLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Fecha util</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDateLabel(latestResolutionAt) || "Sin registro"}</p>
                </div>
              </div>

              {roles.length > 1 ? (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Roles relacionados</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Badge key={role} variant="secondary" className="bg-slate-100 text-slate-800">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {siiPointResolution?.matchedPoint ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-sky-700">Punto de cruce SII</p>
                  <p className="mt-1 text-sm text-sky-950">
                    {siiPointResolution.matchedPoint.label || "sample"} | lat {Number(siiPointResolution.matchedPoint.lat).toFixed(6)} | lng{" "}
                    {Number(siiPointResolution.matchedPoint.lng).toFixed(6)}
                  </p>
                </div>
              ) : null}

              {manualRoleAssignment?.sourceKmzFileName ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700">KMZ de referencia</p>
                  <p className="mt-1 text-sm text-amber-950">{manualRoleAssignment.sourceKmzFileName}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-900">Documentos</p>
                </div>
                {selectedItem.google_docs_link ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3"
                    onClick={() => handleCopyValue(selectedItem.google_docs_link, "Link de Google Docs")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar link
                  </Button>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {documentCount > 0
                  ? `${documentCount} documento${documentCount === 1 ? "" : "s"} asociado${documentCount === 1 ? "" : "s"} al KMZ.`
                  : "Sin documentos asociados por ahora."}
              </div>

              {selectedItem.google_docs_link ? (
                <a
                  href={selectedItem.google_docs_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-800 transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Google Docs</p>
                    <p className="mt-1 truncate font-medium">Abrir Google Docs del KMZ</p>
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                </a>
              ) : null}

              {loadingDocuments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-sage"></div>
                </div>
              ) : documentCount > 0 ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => {
                      const folderPath = documentKMZLinker.getDocumentFolderPath(selectedItem.name)
                      window.location.href = folderPath
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver carpeta de documentos ({documentCount})
                  </Button>

                  <ScrollArea className="h-28 rounded-xl border">
                    <div className="space-y-1 p-2">
                      {selectedItemDocuments.slice(0, 5).map((doc) => (
                        <div key={doc.documentId} className="flex items-start gap-2 rounded-lg p-2 hover:bg-accent/50">
                          <FileText className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs">{doc.documentTitle}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.documentType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground">
                  No hay documentos asociados a este campo.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-4">
              <button
                type="button"
                onClick={() => setIsResearchExpanded((value) => !value)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <SearchCode className="h-4 w-4 text-violet-700" />
                  <p className="text-sm font-semibold text-slate-900">Investigacion</p>
                </div>
                <div className="flex items-center gap-2">
                  {ownerQueue?.priorityTier ? (
                    <Badge variant="secondary" className="bg-violet-100 text-violet-900">
                      {ownerQueue.priorityTier}
                    </Badge>
                  ) : null}
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isResearchExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {ownerQueue ? (
                isResearchExpanded ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {ownerQueue.priorityScore !== null ? (
                        <Badge variant="outline" className="border-violet-300 text-violet-900">
                          Score {ownerQueue.priorityScore}
                        </Badge>
                      ) : null}
                      {ownerQueue.status ? (
                        <Badge variant="outline" className="border-violet-300 text-violet-900">
                          {ownerQueue.status}
                        </Badge>
                      ) : null}
                    </div>

                    {ownerQueue.suggestedNextStep ? (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-violet-700">Siguiente paso</p>
                        <p className="mt-1 text-sm text-violet-950">{ownerQueue.suggestedNextStep}</p>
                      </div>
                    ) : null}

                    {ownerQueue.reasons.length > 0 ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Motivos</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ownerQueue.reasons.map((reason) => (
                            <Badge key={reason} variant="secondary" className="bg-slate-100 text-slate-800">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {ownerQueue.searchQueries.length > 0 ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Consultas sugeridas</p>
                        <div className="mt-2 space-y-2">
                          {ownerQueue.searchQueries.map((query) => (
                            <div key={query} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                              <span className="min-w-0 flex-1 break-words">{query}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleCopyValue(query, "Consulta")}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {ownerQueue.suggestedNextStep || "Investigacion lista para abrir cuando se necesite."}
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Aun no hay cola de investigacion registrada para este KMZ.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-4">
              <button
                type="button"
                onClick={() => setIsEditExpanded((value) => !value)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-900">Edicion</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isEditExpanded ? "rotate-180" : ""}`} />
              </button>

              {isEditExpanded ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Propietario / Cliente</label>
                    <input
                      type="text"
                      value={editingOwner}
                      onChange={(e) => setEditingOwner(e.target.value)}
                      placeholder="Ingresa nombre del propietario o cliente"
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Nombre del dueno confirmado o cliente asociado.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Enlace Google Docs</label>
                    <input
                      type="text"
                      value={editingGoogleDocsLink}
                      onChange={(e) => setEditingGoogleDocsLink(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Ficha comercial, minuta o carpeta editable del campo.</p>
                    {editingGoogleDocsLink ? (
                      <a
                        href={editingGoogleDocsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir documento
                      </a>
                    ) : null}
                  </div>

                  <Button onClick={handleSaveOwnerAndDocsLink} disabled={isSavingOwner} className="w-full">
                    {isSavingOwner ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Propietario y enlace documental disponibles para edicion manual.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedRegion && kmzFiles.length > 0 ? (
            <Card className="border-slate-200 shadow-none">
              <CardContent className="space-y-4 p-4">
                <button
                  type="button"
                  onClick={() => setIsLoadedFilesExpanded((value) => !value)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <p className="text-sm font-medium text-slate-900">Archivos cargados en mapa ({kmzFiles.length})</p>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isLoadedFilesExpanded ? "rotate-180" : ""}`} />
                </button>
                {isLoadedFilesExpanded ? (
                  <ScrollArea className="h-[160px] rounded-xl border">
                    <div className="space-y-1 p-2">
                      {kmzFiles.map((file) => (
                        <div key={file.metadata.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="flex-1 truncate">{file.fileName}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.placemarks.length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </>
    )
  }

  const calculateCenterFromBounds = (bounds: any): { lat: number; lng: number } => {
    if (!bounds || !bounds.south || !bounds.north || !bounds.west || !bounds.east) {
      return { lat: -39.8196, lng: -73.2452 }
    }
    return {
      lat: (bounds.south + bounds.north) / 2,
      lng: (bounds.west + bounds.east) / 2,
    }
  }

  useEffect(() => {
    loadRegionMetadata()
  }, [])

  // Update editingOwner when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setEditingOwner(selectedItem.owner || "")
    }
  }, [selectedItem])

  // Load KMZ file from URL parameter if provided
  useEffect(() => {
    if (kmzIdFromURL && kmzIdFromURL.trim()) {
      setIsLoadingFromURL(true)
    }
  }, [kmzIdFromURL])

  // Once metadata is loaded and we have a kmzIdFromURL, load the KMZ
  useEffect(() => {
    if (isLoadingFromURL && !isLoadingMetadata && kmzIdFromURL && handleLoadKmzFromId) {
      handleLoadKmzFromId(kmzIdFromURL)
    }
  }, [isLoadingFromURL, isLoadingMetadata, kmzIdFromURL])

  // Load filtered KMZ when regions or filters change
  useEffect(() => {
    const loadFilteredData = async () => {
      if (selectedRegions.size === 0) {
        setKmzFiles([])
        return
      }

      setIsLoadingKMZ(true)
      try {
        const regions = Array.from(selectedRegions)
        const filtered = await kmzAdvancedFilterService.loadFilteredKMZ(
          regions,
          advancedFilters
        )

        setKmzFiles(
          filtered.map((kmz) => ({
            id: kmz.id,
            fileName: kmz.fileName,
            placemarks: kmz.placemarks,
            bounds: kmz.bounds,
            category: kmz.category,
          }))
        )
      } catch (error) {
        console.error("[v0] Error loading filtered KMZ:", error)
      } finally {
        setIsLoadingKMZ(false)
      }
    }

    loadFilteredData()
  }, [selectedRegions, advancedFilters])

  const loadRegionMetadata = async () => {
    setIsLoadingMetadata(true)

    try {
      const allData: any[] = []
      const pageSize = 1000
      let page = 0
      let hasMore = true

      // Fetch all metadata with pagination
      while (hasMore) {
        const start = page * pageSize
        const end = start + pageSize - 1
        
        
        const { data, error, count } = await supabase
          .from("kmz_collection")
          .select("id, file_name, description, region, placemarks_count, bounds, tags, file_path, owner, google_docs_link, rol_numbers, metadata, category", { count: 'exact' })
          .eq("is_active", true)
          .order("region", { ascending: true })
          .range(start, end)

        if (error) {
          break
        }

        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData.push(...data)
          page++
        }
      }

      if (allData.length > 0) {
        const uniqueRegions = new Set(allData.map(d => d.region).filter(r => r)).size
        setTotalFileCount(allData.length)
        buildRegionFolders(allData)
      } else {
        setFolders([])
        setTotalFileCount(0)
      }
    } catch (err) {
      setFolders([])
      setTotalFileCount(0)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  const handleRefresh = async () => {
    
    // Clear current selection
    setSelectedItem(null)
    setSelectedRegion(null)
    setKmzFiles([])
    setMapCenter(null)
    setSelectedItemDocuments([])
    setDocumentCount(0)
    
    // Reload metadata
    await loadRegionMetadata()
    
    toast({
      title: "Vista actualizada",
      description: "Se han recargado todas las regiones. Selecciona una para continuar.",
    })
  }

  const handleLoadKmzFromId = async (kmzId: string) => {
    setIsLoadingKMZ(true)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("id", kmzId)
        .single()

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el archivo KMZ",
          variant: "destructive",
        })
        setKmzFiles([])
        setIsLoadingFromURL(false)
        return
      }

      if (data) {

        // Set the region
        setSelectedRegion(data.region)

        // Calculate map center
        const center = calculateCenterFromBounds(data.bounds)
        setMapCenter(center)

        // Transform the KMZ file
        const placemarks = (data.coordinates || []).map((coordArray: any, index: number) => {
          let geometryType = "Point"
          let coordinates = coordArray

          if (Array.isArray(coordArray) && coordArray.length > 3) {
            if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
              geometryType = "Polygon"
              coordinates = coordArray
            }
          }

          return {
            name: `${data.file_name} - ${geometryType === "Polygon" ? "Poligono" : "Punto"} ${index + 1}`,
            type: geometryType,
            coordinates: coordinates,
            description: data.description || "",
            properties: {
              rol: data.rol_numbers?.[index] || "",
              category: data.category || "general",
            },
          }
        })

        const transformedKMZ = {
          fileName: data.file_name,
          placemarks: placemarks,
          bounds: data.bounds,
          metadata: {
            id: data.id,
            category: data.category,
            rolNumbers: data.rol_numbers || [],
            placemarks_count: data.placemarks_count,
          },
        }

        setKmzFiles([transformedKMZ])

        // Load documents for this KMZ
        try {
          const docs = await documentKMZLinker.getDocumentsForKMZ(data.id, data.file_name)
          const count = await documentKMZLinker.getDocumentCountForKMZ(data.id, data.file_name)
          setSelectedItemDocuments(docs)
          setDocumentCount(count)
        } catch (docError) {
          setSelectedItemDocuments([])
          setDocumentCount(0)
        }

        // Create and select a virtual item
        const virtualItem: FolderItem = {
          id: `file-${data.id}`,
          name: data.file_name,
          type: "file",
          dbId: data.id,
          location: center,
          description: data.description || data.metadata?.description || null,
          area: `${data.placemarks_count || 0} puntos`,
        }
        setSelectedItem(virtualItem)
        setIsDetailsSheetOpen(false)
        setIsLoadingFromURL(false)

        toast({
          title: "KMZ Cargado",
          description: `Se cargó ${data.file_name} desde la búsqueda`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al cargar el archivo KMZ",
        variant: "destructive",
      })
      setKmzFiles([])
      setIsLoadingFromURL(false)
    } finally {
      setIsLoadingKMZ(false)
    }
  }

  // Handle toggling region selection for multi-select
  const handleRegionToggle = (regionName: string) => {
    const newSelected = new Set(selectedRegions)
    if (newSelected.has(regionName)) {
      newSelected.delete(regionName)
    } else {
      newSelected.add(regionName)
    }
    setSelectedRegions(newSelected)
    
    // Clear old single region selection
    setSelectedRegion(null)
    setKmzFiles([])
  }

  // Load KMZ files progressively from multiple selected regions
  const loadMultipleRegionsKMZ = useCallback(async () => {
    if (selectedRegions.size === 0) {
      setKmzFiles([])
      return
    }

    setIsLoadingKMZ(true)
    const allKmzFiles: any[] = []
    const loadingProgress: Record<string, number> = {}

    try {
      // Create array of regions to load
      const regionsToLoad = Array.from(selectedRegions)
      
      // Load KMZ files for each selected region progressively
      for (const regionName of regionsToLoad) {
        loadingProgress[regionName] = 0
        setRegionLoadingProgress({...loadingProgress})

        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .eq("is_active", true)
          .eq("region", regionName)
          .limit(1000)

        if (!error && data) {
          // Process each KMZ file in the region
          for (let i = 0; i < data.length; i++) {
            const kmzData = data[i]
            
            try {
              // Read KMZ file content
              const kmzContent = await kmzStorageService.readKMZ(kmzData.file_path)
              const placemarks = await kmzReader.parseKMZContent(kmzContent)

              const transformedKMZ = {
                fileName: kmzData.file_name,
                placemarks: placemarks,
                bounds: kmzData.bounds,
                metadata: {
                  id: kmzData.id,
                  category: kmzData.category,
                  rolNumbers: kmzData.rol_numbers || [],
                  placemarks_count: kmzData.placemarks_count,
                  region: regionName,
                },
              }

              allKmzFiles.push(transformedKMZ)
              
              // Update progress for this region
              loadingProgress[regionName] = Math.round(((i + 1) / data.length) * 100)
              setRegionLoadingProgress({...loadingProgress})
            } catch (fileError) {
              console.error(`Error loading KMZ file ${kmzData.file_name}:`, fileError)
            }
          }
        }

        // Mark region as complete
        loadingProgress[regionName] = 100
        setRegionLoadingProgress({...loadingProgress})
      }

      setKmzFiles(allKmzFiles)

      if (allKmzFiles.length > 0) {
        toast({
          title: "Regiones Cargadas",
          description: `Se cargaron ${allKmzFiles.length} archivos de ${selectedRegions.size} región(es)`,
        })
      } else {
        toast({
          title: "Sin resultados",
          description: "No se encontraron archivos KMZ en las regiones seleccionadas",
          variant: "default",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al cargar los archivos KMZ",
        variant: "destructive",
      })
      setKmzFiles([])
    } finally {
      setIsLoadingKMZ(false)
      setRegionLoadingProgress({})
    }
  }, [selectedRegions, toast])

  // Trigger loading when regions are selected
  useEffect(() => {
    if (selectedRegions.size > 0) {
      loadMultipleRegionsKMZ()
    } else {
      setKmzFiles([])
    }
  }, [selectedRegions, loadMultipleRegionsKMZ])

  const buildRegionFolders = (metadata: any[]) => {
    const regionMap = new Map<string, any[]>()

    metadata.forEach((record) => {
      const region = record.region || "Sin Region"
      if (!regionMap.has(region)) {
        regionMap.set(region, [])
      }
      regionMap.get(region)?.push(record)
    })

    const regionDetails: string[] = []
    regionMap.forEach((files, region) => {
      regionDetails.push(`${region}: ${files.length} files`)
    })

    const folderItems: FolderItem[] = []
    let folderId = 1

    for (const [region, files] of regionMap.entries()) {
      let regionLat = 0
      let regionLng = 0
      let validFiles = 0

      files.forEach((file) => {
        const center = calculateCenterFromBounds(file.bounds)
        regionLat += center.lat
        regionLng += center.lng
        validFiles++
      })

      const regionCenter =
        validFiles > 0 ? { lat: regionLat / validFiles, lng: regionLng / validFiles } : { lat: -39.8196, lng: -73.2452 }

      const totalPlacemarks = files.reduce((sum, f) => sum + (f.placemarks_count || 0), 0)

      folderItems.push({
        id: `region-${folderId}`,
        name: region,
        type: "folder",
        location: regionCenter,
        category: region,
        fileCount: files.length,
        children: files.map((file, idx) => {
          const fileCenter = calculateCenterFromBounds(file.bounds)
          return {
            id: `file-${folderId}-${idx}`,
            name: file.file_name,
            type: "file" as const,
            description: file.description || file.metadata?.description || null,
            area: `${file.placemarks_count || 0} puntos`,
            location: fileCenter,
            dbId: file.id,
            owner: file.owner,
            google_docs_link: file.google_docs_link,
            rolNumbers: file.rol_numbers || [],
            metadata: file.metadata || {},
            placemarksCount: file.placemarks_count || 0,
            region: file.region || region,
            category: file.category || undefined,
          }
        }),
        isOpen: false,
      })
      folderId++
    }

    folderItems.sort((a, b) => (b.fileCount || 0) - (a.fileCount || 0))

    setFolders(folderItems)
  }

  const loadRegionKMZFiles = async (region: string) => {
    setIsLoadingKMZ(true)
    setSelectedRegion(region)

    try {
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("*")
        .eq("is_active", true)
        .eq("region", region)
        .order("file_name", { ascending: true })

      if (error) {
        setKmzFiles([])
      } else {
        const uniqueData = data?.filter(
          (record, index, self) => index === self.findIndex((r) => r.file_name === record.file_name),
        )

        const transformedKMZ = (uniqueData || []).map((record: any) => ({
          fileName: record.file_name,
          dbId: record.id, // Add dbId at top level for filtering in KMZMapDisplay
          id: record.id, // Also add id for direct access
          placemarks: (record.coordinates || []).map((coordArray: any, index: number) => ({
            name: `${record.file_name} - ${Array.isArray(coordArray) && coordArray.length > 3 ? "Poligono" : "Punto"} ${index + 1}`,
            type: Array.isArray(coordArray) && coordArray.length > 3 ? "Polygon" : "Point",
            coordinates: coordArray,
            description: record.description || "",
            properties: {
              rol: record.rol_numbers?.[index] || "",
              category: record.category || "general",
            },
          })),
          bounds: record.bounds,
          metadata: {
            id: record.id,
            category: record.category,
            rolNumbers: record.rol_numbers || [],
            placemarks_count: record.placemarks_count,
          },
        }))

        setKmzFiles(transformedKMZ)
        
        // Now rebuild folders with children to show files
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.name === region
              ? {
                  ...folder,
                  children: transformedKMZ.map((kmz, idx) => ({
                    id: `file-${folder.id}-${idx}`,
                    name: kmz.fileName,
                    type: "file" as const,
                    description: uniqueData?.[idx]?.description || uniqueData?.[idx]?.metadata?.description || null,
                    area: `${kmz.metadata.placemarks_count || 0} puntos`,
                    location: kmz.bounds ? calculateCenterFromBounds(kmz.bounds) : undefined,
                    dbId: kmz.metadata.id,
                    owner: uniqueData?.[idx]?.owner,
                    google_docs_link: uniqueData?.[idx]?.google_docs_link,
                    rolNumbers: uniqueData?.[idx]?.rol_numbers || [],
                    metadata: uniqueData?.[idx]?.metadata || {},
                    placemarksCount: uniqueData?.[idx]?.placemarks_count || 0,
                    region: uniqueData?.[idx]?.region || region,
                    category: uniqueData?.[idx]?.category || undefined,
                  })),
                }
              : folder,
          ),
        )
      }
    } catch (err) {
    } finally {
      setIsLoadingKMZ(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder)),
    )
  }

  const handleItemClick = async (item: FolderItem) => {
    setSelectedItem(item)
    setIsDetailsSheetOpen(true)

    // Si es archivo, cargar owner y google_docs_link
    if (item.type === "file") {
      setEditingOwner(item.owner || "")
      setEditingGoogleDocsLink(item.google_docs_link || "")
    }

    // If this is a FOLDER/REGION, load all KMZ files for that region AND toggle folder open/closed
    if (item.type === "folder") {
      // Clear selectedKmzId to show ALL capas when viewing a region
      setSelectedKmzId(null)
      setFolders((prevFolders) =>
        prevFolders.map((folder) => {
          if (folder.id === item.id) {
            const isNowOpen = !folder.isOpen
            // ALWAYS load region KMZ files when opening a folder to show ALL layers on the map
            if (isNowOpen) {
              loadRegionKMZFiles(folder.name)
            }
            return { ...folder, isOpen: isNowOpen }
          }
          return folder
        }),
      )
      return
    }

    // Otherwise, it's a file - load ONLY this file on the map
    if (item.location) {
      setMapCenter(item.location)
    }

    // Set selectedKmzId to filter the map display
    if (item.type === "file") {
      setSelectedKmzId(item.dbId?.toString() || item.name || null)
    }

    if (item.type === "file" && item.dbId) {
      setLoadingDocuments(true)
      try {
        const docs = await documentKMZLinker.getDocumentsForKMZ(item.dbId.toString(), item.name)
        const count = await documentKMZLinker.getDocumentCountForKMZ(item.dbId.toString(), item.name)
        setSelectedItemDocuments(docs)
        setDocumentCount(count)

        // Load ONLY this specific KMZ file on the map
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("*")
          .eq("is_active", true)
          .eq("id", item.dbId)
          .single()

        if (!error && data) {
          setSelectedItem((prev) =>
            prev
              ? {
                ...prev,
                owner: data.owner || null,
                google_docs_link: data.google_docs_link || null,
                description: data.description || data.metadata?.description || prev.description || null,
                rolNumbers: data.rol_numbers || [],
                metadata: data.metadata || {},
                placemarksCount: data.placemarks_count || 0,
                  region: data.region || prev.region,
                  category: data.category || prev.category,
                }
              : prev,
          )

          const placemarks = (data.coordinates || []).map((coordArray: any, index: number) => {
            let geometryType = "Point"
            let coordinates = coordArray

            if (Array.isArray(coordArray) && coordArray.length > 3) {
              if (Array.isArray(coordArray[0]) && coordArray[0].length >= 2 && typeof coordArray[0][0] === "number") {
                geometryType = "Polygon"
                coordinates = coordArray
              }
            }

            return {
              name: `${data.file_name} - ${geometryType === "Polygon" ? "Poligono" : "Punto"} ${index + 1}`,
              type: geometryType,
              coordinates: coordinates,
              description: data.description || "",
              properties: {
                rol: data.rol_numbers?.[index] || "",
                category: data.category || "general",
              },
            }
          })

          const transformedKMZ = {
            fileName: data.file_name,
            dbId: data.id, // Add dbId at top level for filtering
            id: data.id, // Also add id
            placemarks: placemarks,
            bounds: data.bounds,
            metadata: {
              id: data.id,
              category: data.category,
              rolNumbers: data.rol_numbers || [],
              placemarks_count: data.placemarks_count,
            },
          }

          setKmzFiles([transformedKMZ]) // Show ONLY this file on the map
        }
      } catch (error) {
        setSelectedItemDocuments([])
        setDocumentCount(0)
      } finally {
        setLoadingDocuments(false)
      }
    } else {
      setSelectedItemDocuments([])
      setDocumentCount(0)
    }
  }

  const handleOfflineKMZUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      let successCount = 0
      let errorCount = 0

      const {
        data: { user },
      } = await supabase.auth.getUser()

      for (const file of Array.from(files)) {
        try {

          // Parse KMZ file
          const kmzData = await kmzReader.readKMZFile(file)
          const rolNumbers = kmzReader.extractPropertyRoles(kmzData)

          // This automatically detects and sets the region using detectRegionFromBounds()
          const saveResult = await kmzStorageService.saveKMZ({
            file_name: file.name,
            file_path: `offline/${file.name}`,
            description: kmzData.metadata?.description,
            metadata: kmzData.metadata,
            placemarks_count: kmzData.placemarks.length,
            rol_numbers: rolNumbers,
            bounds: kmzData.bounds,
            coordinates: kmzData.placemarks.map((p: any) => p.coordinates),
            tags: ["offline"],
            category: "offline",
            created_by: user?.id,
            file_size: file.size,
          })

          if (!saveResult.success) {
            errorCount++
          } else {
            successCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      // Reload metadata after upload
      await loadRegionMetadata()

      // Show result
      if (successCount > 0) {
        alert(
          `✅ ${successCount} archivo(s) KMZ cargado(s) exitosamente!${errorCount > 0 ? `\n⚠️ ${errorCount} archivo(s) fallaron.` : ""}`,
        )
      } else {
        alert(`❌ Error al cargar archivos KMZ. Por favor, verifica los archivos e intenta nuevamente.`)
      }
    } catch (error) {
      alert("Error al cargar archivos KMZ")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSaveOwnerAndDocsLink = async () => {
    if (!selectedItem || selectedItem.type !== "file" || !selectedItem.dbId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo KMZ válido",
        variant: "destructive",
      })
      return
    }

    setIsSavingOwner(true)

    try {
      const { error } = await supabase
        .from("kmz_collection")
        .update({
          owner: editingOwner || null,
          google_docs_link: editingGoogleDocsLink || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.dbId)

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Guardado",
          description: "Propietario y enlace de documentos actualizados",
        })
        // Actualizar el item seleccionado
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                owner: editingOwner,
                google_docs_link: editingGoogleDocsLink,
              }
            : null,
        )
      }
    } finally {
      setIsSavingOwner(false)
    }
  }

  const handleRescanRegions = async () => {
    if (isRescanning) return

    const sinRegionFolder = folders.find((f) => f.name === "Sin Region")
    const fileCount = sinRegionFolder?.fileCount || 0

    if (fileCount === 0) {
      toast({
        title: "No hay archivos para reasignar",
        description: "Todos los archivos ya tienen una región asignada.",
      })
      return
    }

    const confirmed = confirm(
      `¿Deseas reanalizar ${fileCount} archivos KMZ en 'Sin Region' y asignarlos a sus regiones correctas?\n\n` +
        "Esto puede tomar varios minutos dependiendo de la cantidad de archivos.",
    )

    if (!confirmed) return

    setIsRescanning(true)
    setRescanProgress({ total: 0, processed: 0, updated: 0, failed: 0, currentFile: "" })

    try {
      const result = await regionRescanService.rescanAndUpdateRegions((progress) => {
        setRescanProgress(progress)
      })

      if (result.success) {
        toast({
          title: "Reasignación completada",
          description: `Se reasignaron ${result.totalUpdated} archivos a sus regiones correctas.`,
        })

        // Refresh the folder structure
        await loadRegionMetadata()
      } else {
        toast({
          title: "Error en reasignación",
          description: "Ocurrió un error al reasignar las regiones. Ver consola para detalles.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la reasignación de regiones.",
        variant: "destructive",
      })
    } finally {
      setIsRescanning(false)
      setRescanProgress(null)
    }
  }

  // Defer search query to prevent input focus loss - keeps search responsive while deferring filtering
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const filteredFolders = useMemo(() => {
    return folders.map((folder) => {
      const searchLower = deferredSearchQuery.toLowerCase()
      
      // Check if region name matches search
      const regionMatches = folder.name.toLowerCase().includes(searchLower)
      
      // Filter children (KMZ files) based on search
      const filteredChildren = folder.children?.filter((child) => {
        const childNameMatches = child.name.toLowerCase().includes(searchLower)
        const areaMatches = child.area?.toLowerCase().includes(searchLower) || false
        return childNameMatches || areaMatches
      }) || []
      
      // If search query is empty, show all; otherwise only show if region or children match
      if (!deferredSearchQuery.trim()) {
        return folder
      }
      
      if (regionMatches || filteredChildren.length > 0) {
        return {
          ...folder,
          children: regionMatches ? folder.children : filteredChildren, // If region matches, show all children; otherwise show only matching children
        }
      }
      
      return null
    }).filter(Boolean) as FolderItem[]
  }, [folders, deferredSearchQuery])

  // Use exact count from database instead of summing folder counts
  const totalFiles = totalFileCount > 0 ? totalFileCount : folders.reduce((sum, folder) => sum + (folder.fileCount || 0), 0)

  const FolderList = () => (
    <>
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Carpetas CAMPOS</h2>
          <Button onClick={handleRefresh} disabled={isLoadingMetadata || isRescanning} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 ${isLoadingMetadata ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="text-sm font-semibold">
            {totalFiles} archivos
          </Badge>
          {folders.length > 0 && <Badge variant="secondary">{folders.length} regiones</Badge>}
          {selectedRegion && kmzFiles.length > 0 && <Badge variant="outline">{kmzFiles.length} en mapa</Badge>}
          {selectedRegions.size > 0 && <Badge variant="secondary">{selectedRegions.size} seleccionadas</Badge>}
          {kmzFiles.length > 0 && selectedRegions.size > 0 && <Badge variant="outline">{kmzFiles.length} en mapa</Badge>}
        </div>

        {/* Selected regions display */}
        {selectedRegions.size > 0 && (
          <div className="flex gap-2 flex-wrap p-3 bg-teal-50 border border-teal-200 rounded-lg">
            {Array.from(selectedRegions).map((region) => (
              <div key={region} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-teal-200">
                <span className="text-sm">{getCleanRegionName(region)}</span>
                {regionLoadingProgress[region] !== undefined && regionLoadingProgress[region] < 100 && (
                  <span className="text-xs text-teal-600 font-medium">{regionLoadingProgress[region]}%</span>
                )}
                <button
                  onClick={() => handleRegionToggle(region)}
                  className="ml-2 text-teal-600 hover:text-teal-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {(folders.find((f) => f.name === "Sin Region")?.fileCount || 0) > 0 && (
          <div className="p-3 bg-sage-50 border border-sage-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-sage-900">
                  {folders.find((f) => f.name === "Sin Region")?.fileCount || 0} archivos sin región
                </p>
                <p className="text-xs text-sage-700 mt-1">Pueden reasignarse automáticamente según coordenadas</p>
              </div>
              <Button
                onClick={handleRescanRegions}
                disabled={isRescanning}
                size="sm"
                className="bg-sage hover:bg-sage-dark text-white"
              >
                {isRescanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reasignando...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Reasignar
                  </>
                )}
              </Button>
            </div>

            {rescanProgress && rescanProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-sage-700">
                  <span>
                    {rescanProgress.processed} / {rescanProgress.total}
                  </span>
                  <span>
                    ✓ {rescanProgress.updated} | ✗ {rescanProgress.failed}
                  </span>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-2">
                  <div
                    className="bg-sage h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(rescanProgress.processed / rescanProgress.total) * 100}%`,
                    }}
                  />
                </div>
                {rescanProgress.currentFile && (
                  <p className="text-xs text-sage-600 truncate">{rescanProgress.currentFile}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".kmz,.kml"
            multiple
            onChange={handleOfflineKMZUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRescanning}
            variant="outline"
            className="w-full justify-start gap-2 border-blue-200 hover:bg-blue-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Subiendo archivos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Cargar KMZ/KML Offline
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingFromURL ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Cargando archivo KMZ...</p>
              <p className="text-xs text-muted-foreground">Por favor espera mientras se carga el mapa</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredFolders.length === 0 && !isLoadingMetadata && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay regiones disponibles. Haz clic en actualizar para cargar.
              </p>
            )}
          {filteredFolders.map((folder) => {
            const isRegionSelected = selectedRegions.has(folder.name)
            const regionProgress = regionLoadingProgress[folder.name]
            
            return (
            <div key={folder.id}>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50">
                <Checkbox
                  checked={isRegionSelected}
                  onCheckedChange={() => handleRegionToggle(folder.name)}
                  className="h-4 w-4"
                  disabled={isLoadingMetadata}
                />
                <Button
                  variant={selectedItem?.id === folder.id && !isRegionSelected ? "secondary" : "ghost"}
                  className="flex-1 justify-start"
                  onClick={() => handleItemClick(folder)}
                  disabled={isLoadingKMZ && folder.category === selectedRegion}
                >
                  {folder.isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {folder.isOpen ? <FolderOpen className="h-4 w-4 mr-2" /> : <Folder className="h-4 w-4 mr-2" />}
                  <span className="flex-1 text-left truncate">{getCleanRegionName(folder.name)}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {folder.fileCount || 0}
                  </Badge>
                  {regionProgress !== undefined && regionProgress < 100 && (
                    <span className="text-xs text-teal-600 ml-2">{regionProgress}%</span>
                  )}
                  {folder.location && <MapPin className="h-3 w-3 ml-2 text-muted-foreground" />}
                </Button>
              </div>

              {folder.isOpen && folder.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {isLoadingKMZ && (isRegionSelected || folder.category === selectedRegion) ? (
                    <div className="text-sm text-muted-foreground p-2 text-center">
                      <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                      Cargando archivos...
                    </div>
                  ) : (
                    folder.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={selectedItem?.id === child.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleItemClick(child)}
                      >
                        <File className="h-3 w-3 mr-2" />
                        <span className="flex-1 text-left text-sm truncate">{child.name}</span>
                        {child.area && (
                          <Badge variant="outline" className="text-xs">
                            {child.area}
                          </Badge>
                        )}
                      </Button>
                    ))
                  )}
                </div>
              )}
            </div>
            )
          })}
            </div>
        )}
      </div>
    </>
  )


  return (
    <div
      className={`flex h-full w-full bg-slate-50 ${
        isMapFullscreen ? "md:flex" : ""
      }`}
    >
      {/* Left sidebar - collapsible on desktop, hidden on mobile when fullscreen */}
      <div
        className={`hidden md:flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          isMapFullscreen ? "md:hidden" : ""
        } ${isLeftPanelOpen ? "w-[420px] border-r" : "w-0"}`}
      >
        {/* Search input rendered outside FolderList to prevent focus loss */}
        <div className="p-4 border-b flex-shrink-0">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            disabled={isLoadingFromURL}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <OnboardingGuide />
          </div>
          <FolderList />
        </div>
      </div>

      {/* Left panel toggle button */}
      <div
        className={`hidden md:flex flex-col items-center pt-2 bg-card border-r ${
          isMapFullscreen ? "md:hidden" : ""
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          title={isLeftPanelOpen ? "Colapsar panel izquierdo" : "Expandir panel izquierdo"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isLeftPanelOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Main content area */}
      <div className={`${isMapFullscreen ? "fixed inset-0 md:relative z-50" : "flex-1"} flex flex-col overflow-hidden`}>
        <div
          className={`${isMapFullscreen ? "md:flex" : "flex"} items-center justify-between px-4 py-2 border-b bg-card flex-shrink-0`}
        >
          <h1 className="text-2xl font-bold text-foreground">CAMPOS</h1>
          {isMapFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMapFullscreen(false)}
              className="md:hidden"
              title="Salir de pantalla completa"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <>
          {/* Map Display */}
          <div className="flex-1 overflow-hidden relative w-full">
            {kmzFiles.length > 0 && mapCenter ? (
              <KMZMapDisplay 
                kmzFiles={kmzFiles} 
                centerCoordinates={mapCenter} 
                height="100%" 
                enableGeocoding={true}
                selectedKmzId={selectedKmzId}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Selecciona una región para ver el mapa</p>
                </div>
              </div>
            )}

            <div className="fixed bottom-6 right-6 z-40">
              <Button
                onClick={() => setShowAIAgent(!showAIAgent)}
                className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ${
                  showAIAgent
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                }`}
                size="icon"
              >
                {showAIAgent ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </Button>
            </div>

            {showAIAgent && (
              <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] max-w-[calc(100vw-3rem)]">
                <Card className="h-full flex flex-col shadow-2xl border-0 bg-card">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Asistente IA CAMPOS
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                        En línea
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <CAMPOSAIAgent />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Bottom Sheets for Mobile */}
          <div className="md:hidden absolute top-4 left-4 z-[999] flex gap-2">
            <Sheet open={isFolderSheetOpen} onOpenChange={setIsFolderSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" className="shadow-lg bg-white hover:bg-gray-50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col h-full">
                {/* Search input rendered outside FolderList for mobile */}
                <div className="p-4 border-b flex-shrink-0">
                  <SearchInput 
                    value={searchQuery} 
                    onChange={setSearchQuery} 
                    disabled={isLoadingFromURL}
                  />
                </div>
                <FolderList />
              </SheetContent>
            </Sheet>
            <Button
              size="icon"
              className="shadow-lg bg-white hover:bg-gray-50 md:hidden"
              onClick={() => setIsMapFullscreen(!isMapFullscreen)}
              title={isMapFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isMapFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </>
      </div>

      {/* Right Panel - Details (Desktop) - Collapsible */}
      <div
        className={`hidden md:flex flex-col items-center pt-2 bg-card border-l ${
          isMapFullscreen ? "md:hidden" : ""
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          title={isRightPanelOpen ? "Colapsar panel derecho" : "Expandir panel derecho"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${!isRightPanelOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <div
        className={`hidden md:flex flex-col bg-card overflow-hidden transition-all duration-300 ${
          isMapFullscreen ? "md:hidden" : ""
        } ${isRightPanelOpen ? "w-[30rem] xl:w-[36rem] border-l" : "w-0"}`}
      >
        <DetailsPanel />
      </div>
    </div>
  )
}


