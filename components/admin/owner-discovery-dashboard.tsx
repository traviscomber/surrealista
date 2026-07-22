"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

interface OwnerRecord {
  id: string
  file_name: string
  region: string | null
  category: string | null
  rol: string | null
  rol_numbers: string[]
  placemarks_count: number
  owner: string | null
  confidence: number
  source: string | null
  evidence_url: string | null
  leads_count: number
  status: "pending" | "evidence-found" | "confirmed" | "skipped" | string
  researched_at: string | null
  updated_at: string | null
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || "No se pudo cargar el inventario de propietarios")
  return payload as { records: OwnerRecord[]; total: number }
}

function statusLabel(status: string) {
  if (status === "confirmed") return "Confirmado"
  if (status === "evidence-found") return "Evidencia encontrada"
  if (status === "skipped") return "Descartado"
  return "Pendiente"
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "confirmed") return "default"
  if (status === "evidence-found") return "secondary"
  return "outline"
}

function formatConfidence(value: number) {
  return `${Math.round((value || 0) * 100)}%`
}

export function OwnerDiscoveryDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/owners", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
  })
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [runningId, setRunningId] = useState<string | null>(null)
  const [runMessage, setRunMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  const records = data?.records || []
  const regions = useMemo(
    () => [...new Set(records.map((record) => record.region).filter((value): value is string => Boolean(value)))].sort(),
    [records],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es")
    return records.filter((record) => {
      const searchable = [record.file_name, record.owner, record.region, record.rol, record.category]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
      return (!normalized || searchable.includes(normalized))
        && (statusFilter === "all" || record.status === statusFilter)
        && (regionFilter === "all" || record.region === regionFilter)
    })
  }, [records, query, statusFilter, regionFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const stats = useMemo(() => ({
    total: records.length,
    confirmed: records.filter((record) => record.status === "confirmed").length,
    evidence: records.filter((record) => record.status === "evidence-found").length,
    pending: records.filter((record) => record.status === "pending").length,
  }), [records])

  const runDiscovery = async (record: OwnerRecord, forceRefresh = false) => {
    setRunningId(record.id)
    setRunMessage(null)
    try {
      const response = await fetch("/api/kmz/owner-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kmz_id: record.id, forceRefresh }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "La investigación no pudo completarse")
      setRunMessage(result.skipped
        ? `${record.file_name}: el registro ya estaba investigado o descartado.`
        : `${record.file_name}: investigación completada${result.searchResultsCount != null ? ` con ${result.searchResultsCount} resultados` : ""}.`)
      await mutate()
    } catch (runError) {
      setRunMessage(runError instanceof Error ? runError.message : "Error al ejecutar la investigación")
    } finally {
      setRunningId(null)
    }
  }

  const exportCsv = () => {
    const rows = [
      ["Archivo", "Región", "ROL", "Propietario candidato", "Confianza", "Estado", "Fuente", "Evidencia"],
      ...filtered.map((record) => [
        record.file_name,
        record.region || "",
        record.rol || "",
        record.owner || "",
        formatConfidence(record.confidence),
        statusLabel(record.status),
        record.source || "",
        record.evidence_url || "",
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `owner-discovery-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-7 p-6 md:p-8">
      <WorkspaceHeading
        eyebrow="Investigación territorial"
        title="Descubrimiento de propietarios"
        description="Investiga posibles propietarios asociados a archivos KMZ y roles territoriales utilizando metadatos internos y fuentes públicas disponibles."
        outcome="Obtienes una lista trazable de candidatos, nivel de confianza y evidencia disponible para priorizar la validación documental de cada propiedad."
        actions={
          <>
            <Button variant="outline" onClick={() => void mutate()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <Card className="border-border/80 bg-muted/30 shadow-none">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong>Alcance de la información:</strong> una coincidencia identifica un candidato de investigación. No acredita dominio ni reemplaza certificados, escrituras o antecedentes oficiales.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><Users className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{stats.total}</p><p className="text-sm text-muted-foreground">Registros disponibles</p></div></CardContent></Card>
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><CheckCircle2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{stats.confirmed}</p><p className="text-sm text-muted-foreground">Alta confianza</p></div></CardContent></Card>
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><Search className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{stats.evidence}</p><p className="text-sm text-muted-foreground">Con evidencia</p></div></CardContent></Card>
        <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><AlertCircle className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{stats.pending}</p><p className="text-sm text-muted-foreground">Pendientes</p></div></CardContent></Card>
      </div>

      {runMessage && <Card className="shadow-none"><CardContent className="p-4 text-sm">{runMessage}</CardContent></Card>}
      {error && <Card className="border-destructive shadow-none"><CardContent className="p-4 text-sm text-destructive">{error.message}</CardContent></Card>}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Inventario de investigación</CardTitle>
          <CardDescription>Busca por archivo, región, ROL o propietario candidato y ejecuta investigaciones individuales sobre registros reales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }} placeholder="Buscar archivo, propietario, ROL o región..." className="pl-9" />
            </label>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="evidence-found">Con evidencia</SelectItem>
                <SelectItem value="confirmed">Alta confianza</SelectItem>
                <SelectItem value="skipped">Descartados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={(value) => { setRegionFilter(value); setCurrentPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Todas las regiones" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">Mostrando {visible.length} de {filtered.length} resultados filtrados.</p>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad / archivo</TableHead>
                  <TableHead>ROL y región</TableHead>
                  <TableHead>Propietario candidato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Evidencia</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !records.length ? (
                  <TableRow><TableCell colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                ) : visible.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No hay registros reales que coincidan con estos filtros.</TableCell></TableRow>
                ) : visible.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="max-w-xs font-medium">{record.file_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{record.category || "Sin categoría"} · {record.placemarks_count || 0} elementos</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">{record.rol || "Sin ROL"}</p>
                      <p className="text-xs text-muted-foreground">{record.region || "Sin región"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs font-medium">{record.owner || "Sin candidato"}</p>
                      <p className="text-xs text-muted-foreground">Confianza {formatConfidence(record.confidence)} · {record.leads_count} evidencias</p>
                    </TableCell>
                    <TableCell><Badge variant={statusVariant(record.status)}>{statusLabel(record.status)}</Badge></TableCell>
                    <TableCell>
                      {record.evidence_url ? (
                        <Button asChild size="sm" variant="outline"><Link href={record.evidence_url} target="_blank" rel="noreferrer">Abrir <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>
                      ) : <span className="text-sm text-muted-foreground">Sin enlace</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => void runDiscovery(record, Boolean(record.owner))} disabled={runningId === record.id}>
                        {runningId === record.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        {record.owner ? "Reinvestigar" : "Investigar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
