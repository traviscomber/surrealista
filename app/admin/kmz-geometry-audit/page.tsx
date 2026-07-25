"use client"

import type { ChangeEvent, ReactNode } from "react"
import { useEffect, useState } from "react"
import { AlertTriangle, Database, MapPinned, RefreshCw, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type RegionRow = {
  region: string
  total: number
  geometryPersisted: number
  referenceOnly: number
  recoverableNow: number
  sourceReingestNeeded: number
  externalReupload: number
  noSource: number
}

type SampleRow = {
  id: string
  file_name: string
  region: string
  file_path: string | null
  placemarks_count: number
  stored_placemarks_count: number
  has_collection_coordinates: boolean
  normalized_geometry_count: number
  has_sii_reference: boolean
  geometry_present: boolean
  recoverability: string
}

type AuditResponse = {
  generatedAt: string
  summary: {
    totalActive: number
    geometryPersisted: number
    referenceOnly: number
    recoverableNow: number
    sourceReingestNeeded: number
    externalReupload: number
    noSource: number
  }
  byRegion: RegionRow[]
  samples: {
    referenceOnly: SampleRow[]
    sourceReingestNeeded: SampleRow[]
    externalReupload: SampleRow[]
    recoverableNow: SampleRow[]
    noSource: SampleRow[]
  }
}

type ReuploadQueueItem = {
  id: string
  file_name: string
  file_path: string | null
  region: string
  has_sii_reference: boolean
  role_count: number
  rol_numbers: string[]
  priority_score: number
  priority_tier: string
  action: string
}

type ReuploadQueueResponse = {
  generatedAt: string
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  items: ReuploadQueueItem[]
}

function SampleList({
  title,
  icon,
  rows,
  badgeClassName,
}: {
  title: string
  icon: ReactNode
  rows: SampleRow[]
  badgeClassName?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No hay registros en esta categoria.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{row.file_name}</p>
                  <p className="text-xs text-slate-500">{row.region}</p>
                </div>
                <Badge className={badgeClassName} variant={badgeClassName ? "default" : "outline"}>
                  {row.recoverability}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <span>placemarks: {row.placemarks_count}</span>
                <span>stored: {row.stored_placemarks_count}</span>
                <span>coords: {row.has_collection_coordinates ? "si" : "no"}</span>
                <span>metadata: {row.normalized_geometry_count}</span>
                <span>SII: {row.has_sii_reference ? "si" : "no"}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function KMZGeometryAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [queue, setQueue] = useState<ReuploadQueueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lastUploadSummary, setLastUploadSummary] = useState<string | null>(null)

  const loadAudit = async () => {
    setLoading(true)
    try {
      const [auditResponse, queueResponse] = await Promise.all([
        fetch("/api/admin/kmz/geometry-audit"),
        fetch("/api/admin/kmz/reupload-queue"),
      ])

      const auditPayload = await auditResponse.json()
      const queuePayload = await queueResponse.json()

      if (!auditResponse.ok) throw new Error(auditPayload.error || "No se pudo cargar auditoria")
      if (!queueResponse.ok) throw new Error(queuePayload.error || "No se pudo cargar cola de reupload")

      setData(auditPayload)
      setQueue(queuePayload)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar auditoria")
    } finally {
      setLoading(false)
    }
  }

  const attemptRepair = async () => {
    setRepairing(true)
    try {
      const response = await fetch("/api/admin/kmz/geometry-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo ejecutar reparacion")
      toast.success(`Reparados ${payload.repaired} KMZ`)
      await loadAudit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fallo la reparacion")
    } finally {
      setRepairing(false)
    }
  }

  const handleReingestUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setLastUploadSummary(null)

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("files", file))

      const response = await fetch("/api/admin/kmz/reingest-offline", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo reingestar archivos")

      const reingested = payload.reingested || 0
      const processed = payload.processed || files.length
      const summary = `${reingested}/${processed} KMZ reingestados por nombre exacto`
      setLastUploadSummary(summary)
      toast.success(summary)
      await loadAudit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fallo la reingesta")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  useEffect(() => {
    loadAudit()
  }, [])

  const summary = data?.summary

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Auditoria de geometria KMZ</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Mide toda la coleccion KMZ y separa geometria persistida, referencia puntual SII, recuperables desde base y casos que requieren reupload externo o reingesta del archivo fuente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAudit} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={attemptRepair} disabled={repairing}>
              <Wrench className={`mr-2 h-4 w-4 ${repairing ? "animate-spin" : ""}`} />
              Reparar recuperables
            </Button>
          </div>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-7">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.totalActive}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Geometria persistida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{summary.geometryPersisted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Solo punto SII</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-sky-600">{summary.referenceOnly}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Recuperables ahora</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-cyan-700">{summary.recoverableNow}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Reingesta fuente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-rose-600">{summary.sourceReingestNeeded}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Reupload externo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{summary.externalReupload}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Sin fuente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-600">{summary.noSource}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5" />
              Regiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Persistida</TableHead>
                  <TableHead>Punto SII</TableHead>
                  <TableHead>Recuperable</TableHead>
                  <TableHead>Reingesta</TableHead>
                  <TableHead>Reupload</TableHead>
                  <TableHead>Sin fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.byRegion.map((row) => (
                  <TableRow key={row.region}>
                    <TableCell className="font-medium">{row.region}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.geometryPersisted}</TableCell>
                    <TableCell>{row.referenceOnly}</TableCell>
                    <TableCell>{row.recoverableNow}</TableCell>
                    <TableCell>{row.sourceReingestNeeded}</TableCell>
                    <TableCell>{row.externalReupload}</TableCell>
                    <TableCell>{row.noSource}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reingesta de KMZ offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sube uno o varios archivos `.kmz` o `.kml`. El sistema intentará encontrar un registro activo `offline/...` por nombre exacto y rehidratará sus capas en el mismo `kmz_id`.
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                type="file"
                accept=".kmz,.kml"
                multiple
                onChange={handleReingestUpload}
                disabled={uploading}
              />
              <Button disabled={uploading} variant="outline">
                {uploading ? "Reingestando..." : "Esperando archivos"}
              </Button>
            </div>
            {lastUploadSummary ? <p className="text-sm text-emerald-700">{lastUploadSummary}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cola viva de reupload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Prioriza los KMZ `offline/...` que siguen sin geometria persistida y sin fuente local visible. En cuanto se re-suban, pueden reingestarse desde el bloque superior.
            </p>
            {queue?.summary ? (
              <div className="grid gap-3 md:grid-cols-5">
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{queue.summary.total}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Critical</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">{queue.summary.critical}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">High</p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">{queue.summary.high}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Medium</p>
                  <p className="mt-2 text-2xl font-bold text-sky-700">{queue.summary.medium}</p>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Low</p>
                  <p className="mt-2 text-2xl font-bold text-slate-700">{queue.summary.low}</p>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>SII</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue?.items.slice(0, 40).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge
                          className={
                            item.priority_tier === "critical"
                              ? "bg-rose-600 text-white hover:bg-rose-600"
                              : item.priority_tier === "high"
                                ? "bg-orange-600 text-white hover:bg-orange-600"
                                : item.priority_tier === "medium"
                                  ? "bg-sky-600 text-white hover:bg-sky-600"
                                  : "bg-slate-600 text-white hover:bg-slate-600"
                          }
                        >
                          {item.priority_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.priority_score}</TableCell>
                      <TableCell>{item.region}</TableCell>
                      <TableCell className="max-w-[22rem] truncate font-medium">{item.file_name}</TableCell>
                      <TableCell>{item.role_count}</TableCell>
                      <TableCell>{item.has_sii_reference ? "si" : "no"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <SampleList
            title="Solo punto SII"
            icon={<MapPinned className="h-5 w-5 text-sky-600" />}
            rows={data?.samples.referenceOnly || []}
            badgeClassName="bg-sky-600 text-white hover:bg-sky-600"
          />
          <SampleList
            title="Reingesta de fuente"
            icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
            rows={data?.samples.sourceReingestNeeded || []}
            badgeClassName="bg-rose-600 text-white hover:bg-rose-600"
          />
          <SampleList
            title="Reupload externo"
            icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
            rows={data?.samples.externalReupload || []}
            badgeClassName="bg-orange-600 text-white hover:bg-orange-600"
          />
          <SampleList
            title="Recuperables desde base"
            icon={<Database className="h-5 w-5 text-cyan-700" />}
            rows={data?.samples.recoverableNow || []}
            badgeClassName="bg-cyan-700 text-white hover:bg-cyan-700"
          />
          <SampleList
            title="Sin fuente conocida"
            icon={<AlertTriangle className="h-5 w-5 text-slate-500" />}
            rows={data?.samples.noSource || []}
          />
        </div>
      </div>
    </div>
  )
}
