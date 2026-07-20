"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Database, MapPinned, RefreshCw, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type RegionRow = {
  region: string
  total: number
  withGeometry: number
  missingGeometry: number
  recoverableNow: number
  sourceReingestNeeded: number
}

type SampleRow = {
  id: string
  file_name: string
  region: string
  file_path: string | null
  placemarks_count: number
  stored_placemarks_count: number
  has_collection_coordinates: boolean
  geometry_present: boolean
  recoverability: string
}

type AuditResponse = {
  generatedAt: string
  summary: {
    totalActive: number
    withGeometry: number
    missingGeometry: number
    recoverableNow: number
    sourceReingestNeeded: number
  }
  byRegion: RegionRow[]
  samples: {
    missing: SampleRow[]
    recoverableNow: SampleRow[]
  }
}

export default function KMZGeometryAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [repairing, setRepairing] = useState(false)

  const loadAudit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/kmz/geometry-audit")
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar auditoría")
      setData(payload)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar auditoría")
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
      if (!response.ok) throw new Error(payload.error || "No se pudo ejecutar reparación")
      toast.success(`Reparados ${payload.repaired} KMZ`)
      await loadAudit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló la reparación")
    } finally {
      setRepairing(false)
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
            <h1 className="text-3xl font-bold text-slate-900">Auditoría de Geometría KMZ</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Identifica qué KMZ tienen geometría persistida, cuáles quedaron vacíos y cuáles pueden repararse sin re-subir el archivo fuente.
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
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Activos</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{summary.totalActive}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Con geometría</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold text-emerald-600">{summary.withGeometry}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Sin geometría</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold text-amber-600">{summary.missingGeometry}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Recuperables ahora</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold text-sky-600">{summary.recoverableNow}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-slate-500">Reingesta fuente</CardTitle>
              </CardHeader>
              <CardContent><p className="text-3xl font-bold text-rose-600">{summary.sourceReingestNeeded}</p></CardContent>
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
                  <TableHead>Región</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Con geometría</TableHead>
                  <TableHead>Sin geometría</TableHead>
                  <TableHead>Recuperable ahora</TableHead>
                  <TableHead>Reingesta fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.byRegion.map((row) => (
                  <TableRow key={row.region}>
                    <TableCell className="font-medium">{row.region}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.withGeometry}</TableCell>
                    <TableCell>{row.missingGeometry}</TableCell>
                    <TableCell>{row.recoverableNow}</TableCell>
                    <TableCell>{row.sourceReingestNeeded}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Muestra sin geometría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.samples.missing.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{row.file_name}</p>
                      <p className="text-xs text-slate-500">{row.region}</p>
                    </div>
                    <Badge variant="outline">{row.recoverability}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>placemarks: {row.placemarks_count}</span>
                    <span>stored: {row.stored_placemarks_count}</span>
                    <span>coords: {row.has_collection_coordinates ? "sí" : "no"}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-600" />
                Reparables ahora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.samples.recoverableNow.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{row.file_name}</p>
                      <p className="text-xs text-slate-500">{row.region}</p>
                    </div>
                    <Badge className="bg-sky-600 text-white hover:bg-sky-600">{row.recoverability}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>placemarks: {row.placemarks_count}</span>
                    <span>stored: {row.stored_placemarks_count}</span>
                    <span>coords: {row.has_collection_coordinates ? "sí" : "no"}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
