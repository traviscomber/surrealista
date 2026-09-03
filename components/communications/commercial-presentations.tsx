"use client"

import { useEffect, useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import { Download, FilePlus2, Loader2, MapPin, RefreshCw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type InventoryItem = { id: string; file_name: string; region: string | null }
type NearbyFeature = { feature_group: string; feature_type: string; feature_name: string | null; distance_m: number }
type MarketMetric = { sample_count: number; avg_price_clp: number | null; median_price_clp: number | null; avg_price_m2_clp: number | null; avg_days_active: number | null; price_trend_30d: number | null }
type KmzDetail = { id: string; file_name: string; description: string | null; metadata: Record<string, unknown> | null; rol_numbers: string[] | null; tags: string[] | null; region: string | null; owner: string | null; pic: string | null; pic_phone: string | null; pic_email: string | null; google_docs_link: string | null }
type CommercialDocumentData = {
  version: 2
  source: "commercial-presentations-v2"
  kmz_id: string
  property_name: string
  property_subtitle: string
  location: string
  region: string
  surface_ha: string
  asking_price_clp: number | null
  description: string
  highlights: string[]
  owner: string | null
  rol_numbers: string[]
  contact: { name: string | null; phone: string | null; email: string | null }
  documentation_url: string | null
  nearby: NearbyFeature[]
  market: MarketMetric | null
  generated_at: string
}
type GeneratedDocument = { id: string; document_name: string; created_at: string; document_data: CommercialDocumentData }

const cleanName = (value: string) => value.replace(/\.(kmz|kml)$/i, "").replace(/[_-]+/g, " ").trim()
const firstString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : "")
const meters = (value: number) => (value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(1)} km`)
const formatClp = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value) || value <= 0) return "Por definir"
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || "Error de operación")
  return payload as T
}

export function CommercialPresentations() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [generated, setGenerated] = useState<GeneratedDocument[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [detail, setDetail] = useState<KmzDetail | null>(null)
  const [nearby, setNearby] = useState<NearbyFeature[]>([])
  const [market, setMarket] = useState<MarketMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("Oportunidad inmobiliaria rural")
  const [location, setLocation] = useState("")
  const [region, setRegion] = useState("")
  const [surfaceHa, setSurfaceHa] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [highlights, setHighlights] = useState("")

  const selectedInventory = useMemo(() => inventory.find((item) => item.id === selectedId) || null, [inventory, selectedId])

  useEffect(() => { void loadInitial() }, [])

  async function loadInitial() {
    setLoading(true); setError("")
    try {
      const data = await api<{ inventory: InventoryItem[]; documents: GeneratedDocument[] }>("/api/commercial-presentations")
      setInventory(data.inventory); setGenerated(data.documents)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el módulo")
    } finally { setLoading(false) }
  }

  async function selectPredio(id: string) {
    setSelectedId(id); setEnriching(true); setError("")
    try {
      const data = await api<{ kmz: KmzDetail; nearby: NearbyFeature[]; market: MarketMetric | null }>(`/api/commercial-presentations?kmzId=${encodeURIComponent(id)}`)
      setDetail(data.kmz); setNearby(data.nearby); setMarket(data.market)
      const metadata = data.kmz.metadata || {}
      setTitle(firstString(metadata.name) || cleanName(data.kmz.file_name))
      setLocation(firstString(metadata.location) || firstString(metadata.ubicacion) || data.kmz.region || "")
      setRegion(data.kmz.region || firstString(metadata.region))
      setSurfaceHa(firstString(metadata.superficie_total) || firstString(metadata.surface_ha) || firstString(metadata.hectareas))
      setDescription(data.kmz.description || firstString(metadata.description))
      setHighlights((data.kmz.tags || []).slice(0, 8).join(", "))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el predio")
    } finally { setEnriching(false) }
  }

  function snapshot(): CommercialDocumentData | null {
    if (!detail || !title.trim() || !region.trim()) return null
    return {
      version: 2, source: "commercial-presentations-v2", kmz_id: detail.id,
      property_name: title.trim(), property_subtitle: subtitle.trim(), location: location.trim(), region: region.trim(), surface_ha: surfaceHa.trim(),
      asking_price_clp: Number(price) || null, description: description.trim(), highlights: highlights.split(",").map((v) => v.trim()).filter(Boolean),
      owner: detail.owner, rol_numbers: detail.rol_numbers || [], contact: { name: detail.pic, phone: detail.pic_phone, email: detail.pic_email },
      documentation_url: detail.google_docs_link, nearby, market, generated_at: new Date().toISOString(),
    }
  }

  function addPageTitle(pdf: jsPDF, kicker: string, heading: string) {
    pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, 297, 210, "F"); pdf.setTextColor(148, 163, 184); pdf.setFontSize(9); pdf.text(kicker.toUpperCase(), 18, 24)
    pdf.setTextColor(248, 250, 252); pdf.setFontSize(27); pdf.text(heading, 18, 42, { maxWidth: 245 })
  }

  function downloadPdf(data: CommercialDocumentData) {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const accent: [number, number, number] = [34, 197, 94]
    addPageTitle(pdf, "SUR REALISTA · PRESENTACIÓN COMERCIAL", data.property_name)
    pdf.setTextColor(...accent); pdf.setFontSize(15); pdf.text(data.property_subtitle || "Oportunidad inmobiliaria rural", 18, 58)
    pdf.setTextColor(226, 232, 240); pdf.setFontSize(12); pdf.text(`${data.location || "Ubicación por confirmar"} · ${data.region}`, 18, 74)
    pdf.setFontSize(19); pdf.text(data.surface_ha ? `${data.surface_ha} ha` : "Superficie por confirmar", 18, 101); pdf.text(formatClp(data.asking_price_clp), 18, 116)
    pdf.setTextColor(148, 163, 184); pdf.setFontSize(9); pdf.text("Antecedentes comerciales sujetos a validación. Las referencias de mercado no constituyen una tasación.", 18, 190)

    pdf.addPage(); addPageTitle(pdf, "01 · RESUMEN", "Ficha ejecutiva"); pdf.setTextColor(226, 232, 240); pdf.setFontSize(11)
    ;[`Propietario: ${data.owner || "Por confirmar"}`, `Roles: ${data.rol_numbers.join(", ") || "Por confirmar"}`, `Región: ${data.region}`, `Superficie: ${data.surface_ha ? `${data.surface_ha} ha` : "Por confirmar"}`, `Precio solicitado: ${formatClp(data.asking_price_clp)}`].forEach((line, index) => pdf.text(line, 18, 68 + index * 12))
    if (data.description) { pdf.setTextColor(148, 163, 184); pdf.text(pdf.splitTextToSize(data.description, 120), 155, 68) }

    pdf.addPage(); addPageTitle(pdf, "02 · ATRIBUTOS", "Razones para mirar este activo"); pdf.setFontSize(12)
    const items = data.highlights.length ? data.highlights : ["Inventario territorial georreferenciado", "Antecedentes KMZ disponibles", "Contexto territorial integrado"]
    items.slice(0, 8).forEach((item, index) => { pdf.setTextColor(...accent); pdf.text("•", 18, 70 + index * 14); pdf.setTextColor(226, 232, 240); pdf.text(item, 27, 70 + index * 14) })

    pdf.addPage(); addPageTitle(pdf, "03 · ENTORNO", "Infraestructura y servicios cercanos"); pdf.setFontSize(10)
    if (!data.nearby.length) { pdf.setTextColor(148, 163, 184); pdf.text("Sin contexto de proximidad precalculado para este predio.", 18, 70) }
    data.nearby.slice(0, 10).forEach((item, index) => { pdf.setTextColor(226, 232, 240); pdf.text(`${item.feature_name || item.feature_type} · ${meters(item.distance_m)}`, 18, 68 + index * 11); pdf.setTextColor(100, 116, 139); pdf.text(item.feature_group, 160, 68 + index * 11) })

    pdf.addPage(); addPageTitle(pdf, "04 · MERCADO", "Contexto comercial de referencia"); pdf.setTextColor(226, 232, 240); pdf.setFontSize(12)
    const lines = data.market ? [`Muestra comparable: ${data.market.sample_count || 0} publicaciones`, `Precio promedio: ${formatClp(data.market.avg_price_clp)}`, `Precio mediano: ${formatClp(data.market.median_price_clp)}`, `Precio promedio/m²: ${formatClp(data.market.avg_price_m2_clp)}`, `Días activos promedio: ${data.market.avg_days_active ? Math.round(data.market.avg_days_active) : "N/D"}`, `Tendencia 30 días: ${data.market.price_trend_30d == null ? "N/D" : `${Number(data.market.price_trend_30d).toFixed(1)}%`}`] : ["Sin muestra comparable disponible para la región seleccionada."]
    lines.forEach((line, index) => pdf.text(line, 18, 70 + index * 14)); pdf.setTextColor(100, 116, 139); pdf.setFontSize(9); pdf.text("Referencia de publicaciones de mercado; no reemplaza una tasación profesional.", 18, 172)

    pdf.addPage(); addPageTitle(pdf, "05 · CONTACTO", "Siguiente paso"); pdf.setTextColor(226, 232, 240); pdf.setFontSize(14); pdf.text(data.contact.name || "Equipo Sur Realista", 18, 74); pdf.setFontSize(11); pdf.text(data.contact.phone || "Teléfono por confirmar", 18, 92); pdf.text(data.contact.email || "Correo por confirmar", 18, 106)
    if (data.documentation_url) { pdf.setTextColor(...accent); pdf.textWithLink("Abrir antecedentes documentales", 18, 128, { url: data.documentation_url }) }
    pdf.save(`presentacion-comercial-${data.property_name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "sur-realista"}.pdf`)
  }

  async function generate() {
    const data = snapshot()
    if (!data) { setError("Selecciona un predio y completa nombre y región."); return }
    setSaving(true); setError("")
    try {
      const result = await api<{ document: GeneratedDocument }>("/api/commercial-presentations", { method: "POST", body: JSON.stringify({ document_name: `Presentación Comercial - ${data.property_name}`, document_data: data }) })
      setGenerated((current) => [result.document, ...current].slice(0, 8)); downloadPdf(result.document.document_data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo generar la presentación") }
    finally { setSaving(false) }
  }

  return <div className="space-y-5">
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
      <Card><CardHeader className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Presentación comercial</CardTitle><Badge variant="secondary">Generador v2</Badge></div><p className="text-sm leading-6 text-muted-foreground">Parte desde un predio real. Sur Realista incorpora automáticamente antecedentes territoriales y mercado; tú completas la capa comercial.</p></CardHeader>
        <CardContent className="space-y-5"><div className="space-y-2"><Label>Predio / campo</Label><Select value={selectedId} onValueChange={selectPredio} disabled={loading}><SelectTrigger><SelectValue placeholder={loading ? "Cargando inventario…" : "Seleccionar predio"} /></SelectTrigger><SelectContent>{inventory.map((item) => <SelectItem key={item.id} value={item.id}>{cleanName(item.file_name)}{item.region ? ` · ${item.region}` : ""}</SelectItem>)}</SelectContent></Select></div>
          {selectedInventory && <div className="rounded-lg border bg-muted/30 p-4"><div className="flex flex-wrap gap-2"><Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{detail?.region || selectedInventory.region || "Región pendiente"}</Badge>{(detail?.rol_numbers || []).slice(0,3).map((rol) => <Badge key={rol} variant="outline">ROL {rol}</Badge>)}{enriching && <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Enriqueciendo</Badge>}</div></div>}
          <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Nombre comercial</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className="space-y-2"><Label>Bajada</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div><div className="space-y-2"><Label>Ubicación</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div><div className="space-y-2"><Label>Región</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} /></div><div className="space-y-2"><Label>Superficie (ha)</Label><Input value={surfaceHa} onChange={(e) => setSurfaceHa(e.target.value)} /></div><div className="space-y-2"><Label>Precio solicitado (CLP)</Label><Input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} /></div></div>
          <div className="space-y-2"><Label>Descripción comercial</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div><div className="space-y-2"><Label>Atributos destacados</Label><Input value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="agua, acceso, bosque, lago…" /><p className="text-xs text-muted-foreground">Separados por coma; se precargan desde los tags del predio.</p></div>
          <div className="flex flex-wrap gap-3"><Button onClick={generate} disabled={!detail || saving || enriching}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}Generar y descargar PDF</Button><Button variant="outline" onClick={() => { const data = snapshot(); if (data) downloadPdf(data) }} disabled={!detail}><Download className="mr-2 h-4 w-4" />Vista PDF</Button></div>
        </CardContent></Card>
      <div className="space-y-5"><Card><CardHeader><CardTitle className="text-base">Datos incorporados automáticamente</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Contexto cercano</span><strong>{nearby.length ? `${nearby.length} referencias` : "Sin cargar"}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Muestra mercado</span><strong>{market?.sample_count || 0}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Precio mediano región</span><strong>{formatClp(market?.median_price_clp)}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Contacto predio</span><strong>{detail?.pic || "Por confirmar"}</strong></div></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Generadas recientemente</CardTitle><Button size="icon" variant="ghost" onClick={loadInitial} aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></Button></CardHeader><CardContent>{generated.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay presentaciones guardadas.</p> : <div className="space-y-2">{generated.map((doc) => <button key={doc.id} type="button" onClick={() => downloadPdf(doc.document_data)} className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted"><p className="text-sm font-medium">{doc.document_name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString("es-CL")}</p></button>)}</div>}</CardContent></Card></div>
    </div>
  </div>
}
