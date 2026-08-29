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
import { createBrowserClient } from "@/lib/supabase/client"

type KmzRecord = {
  id: string
  file_name: string
  description: string | null
  metadata: Record<string, unknown> | null
  rol_numbers: string[] | null
  tags: string[] | null
  region: string | null
  owner: string | null
  pic: string | null
  pic_phone: string | null
  pic_email: string | null
  google_docs_link: string | null
}

type NearbyFeature = {
  feature_group: string
  feature_type: string
  feature_name: string | null
  distance_m: number
}

type MarketMetric = {
  sample_count: number
  avg_price_clp: number | null
  median_price_clp: number | null
  avg_price_m2_clp: number | null
  avg_days_active: number | null
  price_trend_30d: number | null
}

type GeneratedDocument = {
  id: string
  document_name: string
  created_at: string
  document_data: Record<string, unknown>
}

const formatClp = (value: string | number | null | undefined) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return "Por definir"
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount)
}

const meters = (value: number) => (value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(1)} km`)

function cleanName(fileName: string) {
  return fileName.replace(/\.(kmz|kml)$/i, "").replace(/[_-]+/g, " ").trim()
}

function firstString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : ""
}

export function CommercialPresentations() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [kmzRecords, setKmzRecords] = useState<KmzRecord[]>([])
  const [selectedKmzId, setSelectedKmzId] = useState("")
  const [nearby, setNearby] = useState<NearbyFeature[]>([])
  const [market, setMarket] = useState<MarketMetric | null>(null)
  const [generated, setGenerated] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("Oportunidad inmobiliaria rural")
  const [location, setLocation] = useState("")
  const [region, setRegion] = useState("")
  const [surfaceHa, setSurfaceHa] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [highlights, setHighlights] = useState("")

  const selectedKmz = useMemo(() => kmzRecords.find((item) => item.id === selectedKmzId) || null, [kmzRecords, selectedKmzId])

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    const [{ data: kmzData, error: kmzError }, { data: docsData }] = await Promise.all([
      supabase
        .from("kmz_collection")
        .select("id,file_name,description,metadata,rol_numbers,tags,region,owner,pic,pic_phone,pic_email,google_docs_link")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("generated_corporate_documents")
        .select("id,document_name,created_at,document_data")
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    if (kmzError) console.error("Error loading KMZ inventory", kmzError)
    setKmzRecords((kmzData as KmzRecord[]) || [])
    setGenerated((docsData as GeneratedDocument[]) || [])
    setLoading(false)
  }

  async function handleKmzChange(id: string) {
    setSelectedKmzId(id)
    const record = kmzRecords.find((item) => item.id === id)
    if (!record) return

    const metadata = record.metadata || {}
    const inferredName = firstString(metadata.name) || cleanName(record.file_name)
    const inferredLocation = firstString(metadata.location) || firstString(metadata.ubicacion) || record.region || ""
    const inferredSurface = firstString(metadata.superficie_total) || firstString(metadata.surface_ha) || firstString(metadata.hectareas)

    setTitle(inferredName)
    setLocation(inferredLocation)
    setRegion(record.region || firstString(metadata.region))
    setSurfaceHa(inferredSurface)
    setDescription(record.description || firstString(metadata.description))
    setHighlights((record.tags || []).slice(0, 8).join(", "))

    setEnriching(true)
    const regionName = record.region || firstString(metadata.region)
    const [{ data: nearbyData }, { data: marketData }] = await Promise.all([
      supabase
        .from("kmz_nearby_features")
        .select("feature_group,feature_type,feature_name,distance_m")
        .eq("kmz_id", id)
        .order("distance_m", { ascending: true })
        .limit(12),
      regionName
        ? supabase
            .from("market_comparable_data")
            .select("sample_count,avg_price_clp,median_price_clp,avg_price_m2_clp,avg_days_active,price_trend_30d")
            .eq("region", regionName)
            .order("computed_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    setNearby((nearbyData as NearbyFeature[]) || [])
    setMarket((marketData as MarketMetric | null) || null)
    setEnriching(false)
  }

  function validate() {
    if (!selectedKmz || !title.trim() || !region.trim()) {
      alert("Selecciona un predio y completa al menos nombre y región.")
      return false
    }
    return true
  }

  function buildDocumentData() {
    return {
      version: 2,
      source: "commercial-presentations-v2",
      kmz_id: selectedKmz?.id,
      property_name: title.trim(),
      property_subtitle: subtitle.trim(),
      location: location.trim(),
      region: region.trim(),
      surface_ha: surfaceHa.trim(),
      asking_price_clp: Number(price) || null,
      description: description.trim(),
      highlights: highlights.split(",").map((item) => item.trim()).filter(Boolean),
      owner: selectedKmz?.owner || null,
      rol_numbers: selectedKmz?.rol_numbers || [],
      contact: {
        name: selectedKmz?.pic || null,
        phone: selectedKmz?.pic_phone || null,
        email: selectedKmz?.pic_email || null,
      },
      nearby,
      market,
      generated_at: new Date().toISOString(),
    }
  }

  async function persistDocument() {
    if (!validate()) return null
    setSaving(true)
    const payload = buildDocumentData()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("generated_corporate_documents")
      .insert({
        property_id: selectedKmz?.id || null,
        document_name: `Presentación Comercial - ${title.trim()}`,
        document_data: payload,
        status: "generated",
        created_by: user?.email || "system",
      })
      .select("id,document_name,created_at,document_data")
      .single()

    setSaving(false)
    if (error) {
      console.error("Error saving commercial presentation", error)
      alert(`No se pudo guardar la presentación: ${error.message}`)
      return null
    }
    setGenerated((current) => [data as GeneratedDocument, ...current].slice(0, 8))
    return data as GeneratedDocument
  }

  function addPageTitle(pdf: jsPDF, kicker: string, heading: string) {
    pdf.setFillColor(15, 23, 42)
    pdf.rect(0, 0, 297, 210, "F")
    pdf.setTextColor(148, 163, 184)
    pdf.setFontSize(9)
    pdf.text(kicker.toUpperCase(), 18, 24)
    pdf.setTextColor(248, 250, 252)
    pdf.setFontSize(27)
    pdf.text(heading, 18, 42, { maxWidth: 245 })
  }

  function downloadPdf(documentData = buildDocumentData()) {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const accent = [34, 197, 94] as const

    addPageTitle(pdf, "SUR REALISTA · PRESENTACIÓN COMERCIAL", String(documentData.property_name || title))
    pdf.setTextColor(...accent)
    pdf.setFontSize(15)
    pdf.text(String(documentData.property_subtitle || subtitle), 18, 58)
    pdf.setTextColor(226, 232, 240)
    pdf.setFontSize(12)
    pdf.text(`${documentData.location || "Ubicación por confirmar"} · ${documentData.region || ""}`, 18, 74)
    pdf.setFontSize(19)
    pdf.text(surfaceHa ? `${surfaceHa} ha` : "Superficie por confirmar", 18, 101)
    pdf.text(formatClp(price), 18, 116)
    pdf.setTextColor(148, 163, 184)
    pdf.setFontSize(9)
    pdf.text("Documento generado desde inventario territorial real. Validar antecedentes legales y comerciales antes de enviar.", 18, 190)

    pdf.addPage()
    addPageTitle(pdf, "01 · RESUMEN", "Ficha ejecutiva")
    pdf.setFontSize(11)
    pdf.setTextColor(226, 232, 240)
    const summary = [
      `Propietario: ${selectedKmz?.owner || "Por confirmar"}`,
      `Roles: ${(selectedKmz?.rol_numbers || []).join(", ") || "Por confirmar"}`,
      `Región: ${region || "Por confirmar"}`,
      `Superficie: ${surfaceHa ? `${surfaceHa} ha` : "Por confirmar"}`,
      `Precio solicitado: ${formatClp(price)}`,
    ]
    summary.forEach((line, index) => pdf.text(line, 18, 68 + index * 12))
    if (description.trim()) {
      pdf.setTextColor(148, 163, 184)
      pdf.text(pdf.splitTextToSize(description.trim(), 120), 155, 68)
    }

    pdf.addPage()
    addPageTitle(pdf, "02 · ATRIBUTOS", "Razones para mirar este activo")
    pdf.setFontSize(12)
    pdf.setTextColor(226, 232, 240)
    const featureLines = highlights.split(",").map((item) => item.trim()).filter(Boolean)
    const fallbackFeatures = ["Inventario territorial georreferenciado", "Antecedentes KMZ disponibles", "Contexto territorial integrado"]
    ;(featureLines.length ? featureLines : fallbackFeatures).slice(0, 8).forEach((item, index) => {
      pdf.setTextColor(...accent)
      pdf.text("•", 18, 70 + index * 14)
      pdf.setTextColor(226, 232, 240)
      pdf.text(item, 27, 70 + index * 14)
    })

    pdf.addPage()
    addPageTitle(pdf, "03 · ENTORNO", "Infraestructura y servicios cercanos")
    pdf.setFontSize(10)
    if (!nearby.length) {
      pdf.setTextColor(148, 163, 184)
      pdf.text("No hay contexto de proximidad precalculado para este predio.", 18, 70)
    } else {
      nearby.slice(0, 10).forEach((item, index) => {
        pdf.setTextColor(226, 232, 240)
        pdf.text(`${item.feature_name || item.feature_type} · ${meters(item.distance_m)}`, 18, 68 + index * 11)
        pdf.setTextColor(100, 116, 139)
        pdf.text(item.feature_group, 160, 68 + index * 11)
      })
    }

    pdf.addPage()
    addPageTitle(pdf, "04 · MERCADO", "Contexto comercial de referencia")
    pdf.setFontSize(12)
    pdf.setTextColor(226, 232, 240)
    const marketLines = market
      ? [
          `Muestra comparable: ${market.sample_count || 0} publicaciones`,
          `Precio promedio: ${formatClp(market.avg_price_clp)}`,
          `Precio mediano: ${formatClp(market.median_price_clp)}`,
          `Precio promedio/m²: ${formatClp(market.avg_price_m2_clp)}`,
          `Días activos promedio: ${market.avg_days_active ? Math.round(market.avg_days_active) : "N/D"}`,
          `Tendencia 30 días: ${market.price_trend_30d == null ? "N/D" : `${Number(market.price_trend_30d).toFixed(1)}%`}`,
        ]
      : ["Sin muestra comparable disponible para la región seleccionada."]
    marketLines.forEach((line, index) => pdf.text(line, 18, 70 + index * 14))
    pdf.setTextColor(100, 116, 139)
    pdf.setFontSize(9)
    pdf.text("Estas métricas son referencias de mercado, no una tasación ni una recomendación de inversión.", 18, 172)

    pdf.addPage()
    addPageTitle(pdf, "05 · CONTACTO", "Siguiente paso")
    pdf.setFontSize(14)
    pdf.setTextColor(226, 232, 240)
    pdf.text(selectedKmz?.pic || "Equipo Sur Realista", 18, 74)
    pdf.setFontSize(11)
    pdf.text(selectedKmz?.pic_phone || "Contacto telefónico por confirmar", 18, 92)
    pdf.text(selectedKmz?.pic_email || "Correo por confirmar", 18, 106)
    if (selectedKmz?.google_docs_link) {
      pdf.setTextColor(...accent)
      pdf.textWithLink("Abrir antecedentes documentales", 18, 128, { url: selectedKmz.google_docs_link })
    }

    pdf.save(`presentacion-comercial-${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "sur-realista"}.pdf`)
  }

  async function handleGenerate() {
    const saved = await persistDocument()
    if (saved) downloadPdf(saved.document_data)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Presentación comercial</CardTitle>
              <Badge variant="secondary">Generador v2</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">Selecciona un predio real del inventario KMZ. El sistema precarga antecedentes territoriales y contexto de mercado; tú completas sólo lo comercial.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Predio / campo</Label>
              <Select value={selectedKmzId} onValueChange={handleKmzChange} disabled={loading}>
                <SelectTrigger><SelectValue placeholder={loading ? "Cargando inventario…" : "Seleccionar predio"} /></SelectTrigger>
                <SelectContent>
                  {kmzRecords.map((item) => <SelectItem key={item.id} value={item.id}>{cleanName(item.file_name)}{item.region ? ` · ${item.region}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedKmz && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{selectedKmz.region || "Región pendiente"}</Badge>
                  {(selectedKmz.rol_numbers || []).slice(0, 3).map((rol) => <Badge key={rol} variant="outline">ROL {rol}</Badge>)}
                  {enriching && <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Enriqueciendo</Badge>}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Nombre comercial</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Fundo / Campo / Proyecto" /></div>
              <div className="space-y-2"><Label>Bajada</Label><Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></div>
              <div className="space-y-2"><Label>Ubicación</Label><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Comuna / sector" /></div>
              <div className="space-y-2"><Label>Región</Label><Input value={region} onChange={(event) => setRegion(event.target.value)} /></div>
              <div className="space-y-2"><Label>Superficie (ha)</Label><Input inputMode="decimal" value={surfaceHa} onChange={(event) => setSurfaceHa(event.target.value)} placeholder="Ej. 125" /></div>
              <div className="space-y-2"><Label>Precio solicitado (CLP)</Label><Input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Ej. 950000000" /></div>
            </div>

            <div className="space-y-2"><Label>Descripción comercial</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Síntesis de la oportunidad, vocación y atributos clave." /></div>
            <div className="space-y-2"><Label>Atributos destacados</Label><Input value={highlights} onChange={(event) => setHighlights(event.target.value)} placeholder="agua, acceso, bosque, lago, agrícola…" /><p className="text-xs text-muted-foreground">Separados por coma. Se precargan desde tags del predio.</p></div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleGenerate} disabled={!selectedKmz || saving || enriching}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                Generar y descargar PDF
              </Button>
              <Button variant="outline" onClick={() => downloadPdf()} disabled={!selectedKmz}><Download className="mr-2 h-4 w-4" />Vista PDF</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Datos incorporados automáticamente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Contexto cercano</span><strong>{nearby.length ? `${nearby.length} referencias` : "Sin cargar"}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Muestra mercado</span><strong>{market?.sample_count || 0}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Precio mediano región</span><strong>{formatClp(market?.median_price_clp)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Contacto predio</span><strong>{selectedKmz?.pic || "Por confirmar"}</strong></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Generadas recientemente</CardTitle><Button size="icon" variant="ghost" onClick={loadInitialData} aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></Button></CardHeader>
            <CardContent>
              {generated.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay presentaciones guardadas.</p> : <div className="space-y-2">{generated.map((doc) => <button key={doc.id} type="button" onClick={() => downloadPdf(doc.document_data)} className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted"><p className="text-sm font-medium">{doc.document_name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString("es-CL")}</p></button>)}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
