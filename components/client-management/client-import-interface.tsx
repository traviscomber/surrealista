"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, Users, Eye, RefreshCw, UserPlus, SkipForward } from 'lucide-react'
import { smartParseExcelFile, type SmartParseResult } from "@/lib/excel/excel-parser"
import { detectDuplicatesBatch, bulkImportWithDuplicateHandlingInBatches } from "@/app/actions/clients"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ColumnMappingReview } from "./column-mapping-review"
import { ExcelColumnPreview, type ColumnPreviewData } from "./excel-column-preview"
import { extractColumnPreview } from "@/lib/excel/excel-parser"

type DuplicateDecision = "update" | "skip" | "create"

const handleDownloadTemplate = () => {
  // Placeholder for download template logic
  console.log("Download template functionality is not implemented yet.")
}

export function ClientImportInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<SmartParseResult | null>(null)
  const [showColumnReview, setShowColumnReview] = useState(false)
  const [confirmedMappings, setConfirmedMappings] = useState<Record<string, string> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [duplicateResult, setDuplicateResult] = useState<any>(null)
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, DuplicateDecision>>({})
  const [importResult, setImportResult] = useState<{
    imported: number
    updated: number
    failed: number
    batches?: any[]
  } | null>(null)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const [columnPreview, setColumnPreview] = useState<ColumnPreviewData[] | null>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParseResult(null)
      setDuplicateResult(null)
      setDuplicateDecisions({})
      setImportResult(null)
      setShowColumnReview(false)
      setConfirmedMappings(null)
      setColumnPreview(null)
    }
  }

  const handleParseFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      console.log("[v0] Extracting column preview from file:", file.name)
      const preview = await extractColumnPreview(file)
      console.log("[v0] Column preview extracted:", preview)
      setColumnPreview(preview)
    } catch (error) {
      console.error("[v0] Error extracting preview:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmColumns = async (mappings: Record<string, string>) => {
    if (!file) return

    setIsProcessing(true)
    setColumnPreview(null)

    try {
      console.log("[v0] Smart parsing file with confirmed mappings:", mappings)
      const result = await smartParseExcelFile(file, mappings)
      console.log("[v0] Smart parse result:", result)
      setParseResult(result)

      setConfirmedMappings(mappings)

      if (result.needsReview) {
        setShowColumnReview(true)
      }

      setDuplicateResult(null)
      setDuplicateDecisions({})
      setImportResult(null)
    } catch (error) {
      console.error("[v0] Error parsing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmMappings = (mappings: Record<string, string>) => {
    setConfirmedMappings(mappings)
    setShowColumnReview(false)
    // Continue with duplicate detection
    handleCheckDuplicates()
  }

  const handleCheckDuplicates = async () => {
    if (!parseResult || !parseResult.success || !confirmedMappings) return

    setIsProcessing(true)
    try {
      console.log("[v0] Checking for duplicates with optimized batch detection...")
      const result = await detectDuplicatesBatch(parseResult.data)
      console.log("[v0] Duplicate detection result:", result)
      setDuplicateResult(result)

      const defaultDecisions: Record<number, DuplicateDecision> = {}
      result.duplicates.forEach((dup: any) => {
        defaultDecisions[dup.index] = "update"
      })
      setDuplicateDecisions(defaultDecisions)
    } catch (error) {
      console.error("[v0] Error checking duplicates:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportWithResolution = async () => {
    if (!duplicateResult || !parseResult || !confirmedMappings) return

    setIsProcessing(true)
    setBatchProgress({ current: 0, total: 0, status: "Iniciando..." })

    try {
      const newClients: any[] = []
      const updates: Array<{ id: string; data: any }> = []

      duplicateResult.nonDuplicates.forEach((item: any) => {
        newClients.push(item.client)
      })

      duplicateResult.duplicates.forEach((dup: any) => {
        const decision = duplicateDecisions[dup.index]

        if (decision === "update") {
          updates.push({
            id: dup.existingClient.id,
            data: dup.newClient,
          })
        } else if (decision === "create") {
          newClients.push(dup.newClient)
        }
      })

      const totalRecords = newClients.length + updates.length
      const batchSize = 10
      const totalBatches = Math.ceil(totalRecords / batchSize)

      setBatchProgress({ current: 0, total: totalBatches, status: "Procesando lotes..." })

      console.log(
        "[v0] Processing import:",
        newClients.length,
        "new,",
        updates.length,
        "updates in batches of",
        batchSize,
      )

      const result = await bulkImportWithDuplicateHandlingInBatches(newClients, updates, batchSize)

      console.log("[v0] Import result:", result)
      setImportResult(result)
      setBatchProgress(null)
    } catch (error) {
      console.error("[v0] Error importing with resolution:", error)
      setBatchProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDuplicateDecision = (index: number, decision: DuplicateDecision) => {
    setDuplicateDecisions((prev) => ({
      ...prev,
      [index]: decision,
    }))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/gestion-clientes")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Importar Clientes desde Excel</h1>
          <p className="text-gray-600">Carga masiva de clientes mediante archivos Excel</p>
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Descargar Plantilla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Seleccionar Archivo Excel
          </CardTitle>
          <CardDescription>
            Sube un archivo Excel (.xlsx) con los datos de los clientes. Descarga la plantilla para ver el formato
            correcto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">{file ? file.name : "Haz clic para seleccionar un archivo"}</p>
              <p className="text-sm text-gray-500">o arrastra y suelta aquí</p>
            </label>
          </div>

          {file && !parseResult && (
            <Button onClick={handleParseFile} disabled={isProcessing} className="w-full gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Analizar Archivo
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {columnPreview && !parseResult && (
        <ExcelColumnPreview
          columns={columnPreview}
          onConfirm={handleConfirmColumns}
          onCancel={() => {
            setColumnPreview(null)
            setFile(null)
          }}
        />
      )}

      {showColumnReview && parseResult && (
        <ColumnMappingReview
          mappings={parseResult.columnMappings}
          onConfirm={handleConfirmMappings}
          onCancel={() => setShowColumnReview(false)}
        />
      )}

      {parseResult && !showColumnReview && !duplicateResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parseResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Resultado del Análisis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{parseResult.totalRows}</div>
                <div className="text-sm text-blue-600">Filas Totales</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{parseResult.validRows}</div>
                <div className="text-sm text-green-600">Filas Válidas</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{parseResult.totalRows - parseResult.validRows}</div>
                <div className="text-sm text-red-600">Filas con Errores</div>
              </div>
            </div>

            {parseResult.success && parseResult.data.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">Vista Previa de Datos</span>
                </div>
                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {parseResult.data.slice(0, 3).map((client, idx) => (
                    <div key={idx} className="text-gray-600">
                      {idx + 1}. {client.first_name} {client.last_name} - {client.email || "Sin email"}
                    </div>
                  ))}
                  {parseResult.data.length > 3 && (
                    <div className="text-gray-500">... y {parseResult.data.length - 3} clientes más</div>
                  )}
                </div>
              </div>
            )}

            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errores encontrados:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parseResult.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="text-sm">
                        {error}
                      </li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li className="text-sm">... y {parseResult.errors.length - 5} errores más</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Advertencias (no impiden la importación):</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parseResult.warnings.slice(0, 5).map((warning, idx) => (
                      <li key={idx} className="text-sm">
                        {warning}
                      </li>
                    ))}
                    {parseResult.warnings.length > 5 && (
                      <li className="text-sm">... y {parseResult.warnings.length - 5} advertencias más</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.success && !importResult && (
              <Button onClick={handleCheckDuplicates} disabled={isProcessing} className="w-full gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando duplicados...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Verificar Duplicados e Importar
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {duplicateResult && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Duplicados Detectados
            </CardTitle>
            <CardDescription>
              Se encontraron {duplicateResult.totalDuplicates} registros duplicados y {duplicateResult.totalNew} nuevos.
              Elige qué hacer con cada duplicado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{duplicateResult.totalNew}</div>
                <div className="text-sm text-green-600">Clientes Nuevos</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{duplicateResult.totalDuplicates}</div>
                <div className="text-sm text-orange-600">Duplicados Encontrados</div>
              </div>
            </div>

            {duplicateResult.totalDuplicates > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Duplicados por Resolver:</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const allUpdate: Record<number, DuplicateDecision> = {}
                        duplicateResult.duplicates.forEach((dup: any) => {
                          allUpdate[dup.index] = "update"
                        })
                        setDuplicateDecisions(allUpdate)
                      }}
                    >
                      Actualizar Todos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const allSkip: Record<number, DuplicateDecision> = {}
                        duplicateResult.duplicates.forEach((dup: any) => {
                          allSkip[dup.index] = "skip"
                        })
                        setDuplicateDecisions(allSkip)
                      }}
                    >
                      Saltar Todos
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <div className="space-y-4">
                    {duplicateResult.duplicates.map((dup: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">
                              {dup.newClient.first_name} {dup.newClient.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Duplicado detectado por:{" "}
                              <Badge variant="outline" className="ml-1">
                                {dup.matchType === "phone"
                                  ? "Teléfono"
                                  : dup.matchType === "email"
                                    ? "Email"
                                    : "Nombre"}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            variant={
                              duplicateDecisions[dup.index] === "update"
                                ? "default"
                                : duplicateDecisions[dup.index] === "skip"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {duplicateDecisions[dup.index] === "update"
                              ? "Actualizar"
                              : duplicateDecisions[dup.index] === "skip"
                                ? "Saltar"
                                : "Crear Nuevo"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">Datos Actuales:</div>
                            <div className="text-gray-600">Email: {dup.existingClient.email || "Sin email"}</div>
                            <div className="text-gray-600">Teléfono: {dup.existingClient.phone || "Sin teléfono"}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">Datos Nuevos:</div>
                            <div className="text-gray-600">Email: {dup.newClient.email || "Sin email"}</div>
                            <div className="text-gray-600">Teléfono: {dup.newClient.phone || "Sin teléfono"}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={duplicateDecisions[dup.index] === "update" ? "default" : "outline"}
                            onClick={() => handleDuplicateDecision(dup.index, "update")}
                            className="flex-1 gap-2"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Actualizar
                          </Button>
                          <Button
                            size="sm"
                            variant={duplicateDecisions[dup.index] === "skip" ? "default" : "outline"}
                            onClick={() => handleDuplicateDecision(dup.index, "skip")}
                            className="flex-1 gap-2"
                          >
                            <SkipForward className="w-3 h-3" />
                            Saltar
                          </Button>
                          <Button
                            size="sm"
                            variant={duplicateDecisions[dup.index] === "create" ? "default" : "outline"}
                            onClick={() => handleDuplicateDecision(dup.index, "create")}
                            className="flex-1 gap-2"
                          >
                            <UserPlus className="w-3 h-3" />
                            Crear Nuevo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {batchProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{batchProgress.status}</div>
                    <div className="text-sm text-blue-600">
                      Procesando lote {batchProgress.current} de {batchProgress.total} (lotes de 10 clientes)
                    </div>
                  </div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleImportWithResolution} disabled={isProcessing} className="w-full gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando en lotes de 10...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Procesar Importación (Lotes de 10)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Importación Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-green-600">Nuevos Importados</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-blue-600">Actualizados</div>
              </div>
              {importResult.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-red-600">Fallos</div>
                </div>
              )}
            </div>

            {importResult.batches && importResult.batches.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="font-medium mb-2">Detalles de Procesamiento:</div>
                <div className="text-sm text-gray-600">
                  Procesado en {importResult.batches.length} lotes de hasta 10 clientes cada uno
                </div>
              </div>
            )}

            <Button onClick={() => router.push("/gestion-clientes")} className="w-full gap-2">
              <Users className="w-4 h-4" />
              Ver Clientes Importados
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
