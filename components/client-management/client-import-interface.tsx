"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  Camera,
  Eye,
} from "lucide-react"
import { parseExcelFile, generateExcelTemplate, type ParseResult } from "@/lib/excel/excel-parser"
import { parseExcelWithVision } from "@/lib/excel/vision-parser"
import { bulkImportClients } from "@/app/actions/clients"
import { useRouter } from "next/navigation"

export function ClientImportInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null)
  const [useVision, setUseVision] = useState(false)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParseResult(null)
      setImportResult(null)
    }
  }

  const handleParseFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      console.log("[v0] Parsing file:", file.name)
      const result = await parseExcelFile(file)
      console.log("[v0] Parse result:", result)
      setParseResult(result)
    } catch (error) {
      console.error("[v0] Error parsing file:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleParseWithVision = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      console.log("[v0] Converting file to image for vision parsing...")

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        console.log("[v0] Calling vision parser...")
        const visionResult = await parseExcelWithVision(base64)

        if (visionResult.success && visionResult.data) {
          // Convert vision result to ParseResult format
          const parseResult: ParseResult = {
            success: true,
            data: visionResult.data,
            errors: [],
            warnings: [],
            totalRows: visionResult.data.length,
            validRows: visionResult.data.length,
          }
          console.log("[v0] Vision parse successful:", parseResult)
          setParseResult(parseResult)
        } else {
          console.error("[v0] Vision parse failed:", visionResult.error)
          setParseResult({
            success: false,
            data: [],
            errors: [visionResult.error || "Error al procesar con Vision"],
            warnings: [],
            totalRows: 0,
            validRows: 0,
          })
        }
        setIsProcessing(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error in vision parsing:", error)
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult || !parseResult.success) return

    setIsProcessing(true)
    try {
      console.log("[v0] Starting import of", parseResult.data.length, "clients")
      const result = await bulkImportClients(parseResult.data)
      console.log("[v0] Import result:", result)
      setImportResult({
        imported: result.imported,
        failed: result.failed,
      })
    } catch (error) {
      console.error("[v0] Error importing clients:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadTemplate = () => {
    const blob = generateExcelTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_clientes.xlsx"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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

      {/* Upload Section */}
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
            <input
              type="file"
              accept=".xlsx,.xls,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">{file ? file.name : "Haz clic para seleccionar un archivo"}</p>
              <p className="text-sm text-gray-500">o arrastra y suelta aquí</p>
            </label>
          </div>

          {file && !parseResult && (
            <div className="flex gap-2">
              <Button onClick={handleParseFile} disabled={isProcessing} className="flex-1 gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Analizar con Parser
                  </>
                )}
              </Button>
              <Button
                onClick={handleParseWithVision}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Analizar con IA Vision
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parse Results */}
      {parseResult && (
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
              <Button onClick={handleImport} disabled={isProcessing} className="w-full gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Importar {parseResult.validRows} Clientes
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Importación Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-green-600">Clientes Importados</div>
              </div>
              {importResult.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-red-600">Fallos</div>
                </div>
              )}
            </div>

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
