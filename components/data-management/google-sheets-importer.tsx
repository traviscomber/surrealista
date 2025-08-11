"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Bug } from "lucide-react"
import { GoogleSheetsParser, type ParsedProperty } from "@/lib/data-management/google-sheets-parser"

interface ImportResult {
  success: boolean
  message: string
  imported: number
  errors: string[]
}

export default function GoogleSheetsImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedProperty[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const template = GoogleSheetsParser.generateTemplate()
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-propiedades-google-sheets.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      alert("Por favor selecciona un archivo CSV")
      return
    }

    setFile(selectedFile)
    setImportResult(null)

    try {
      const content = await selectedFile.text()

      // Get debug info first
      const debug = GoogleSheetsParser.debugParseCSV(content)
      setDebugInfo(debug)

      console.log("Debug info:", debug)

      const parsed = GoogleSheetsParser.parseCSV(content)
      setParsedData(parsed)

      console.log("Parsed data:", parsed)
    } catch (error) {
      console.error("Error parsing CSV:", error)
      setImportResult({
        success: false,
        message: `Error al procesar el archivo: ${error}`,
        imported: 0,
        errors: [String(error)],
      })
    }
  }

  const importData = async () => {
    if (parsedData.length === 0) return

    setImporting(true)

    try {
      // Simulate API call to import data
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const validProperties = parsedData.filter((p) => p.validation_errors.length === 0)
      const invalidProperties = parsedData.filter((p) => p.validation_errors.length > 0)

      setImportResult({
        success: true,
        message: `Importación completada. ${validProperties.length} propiedades importadas correctamente.`,
        imported: validProperties.length,
        errors: invalidProperties.map((p) => `${p.title || "Sin título"}: ${p.validation_errors.join(", ")}`),
      })

      // Clear data after successful import
      if (invalidProperties.length === 0) {
        setParsedData([])
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Error durante la importación",
        imported: 0,
        errors: [String(error)],
      })
    } finally {
      setImporting(false)
    }
  }

  const clearData = () => {
    setFile(null)
    setParsedData([])
    setImportResult(null)
    setDebugInfo(null)
    setShowDebug(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getQualityBadge = (score: number) => {
    const quality = GoogleSheetsParser.getQualityLevel(score)
    const colorMap = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colorMap[quality.color as keyof typeof colorMap]}>
        {quality.level} ({score}%)
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla de Google Sheets
          </CardTitle>
          <CardDescription>Descarga la plantilla con la estructura exacta de tus hojas de Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2 bg-transparent">
            <FileText className="h-4 w-4" />
            Descargar Plantilla CSV
          </Button>
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Campos incluidos en la plantilla:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Nombre Campo</strong> (título de la propiedad) - REQUERIDO
              </li>
              <li>
                <strong>Nombre Contacto</strong> (persona de contacto) - REQUERIDO
              </li>
              <li>
                <strong>Telefono contacto</strong> (formato chileno: +56XXXXXXXXX)
              </li>
              <li>
                <strong>correo contacto</strong> (email válido)
              </li>
              <li>
                <strong>Rol</strong> (número de rol de la propiedad)
              </li>
              <li>
                <strong>derechos de agua</strong> (si/no/sí)
              </li>
              <li>
                <strong>dueño</strong> (nombre del propietario)
              </li>
              <li>
                <strong>Region</strong> (región chilena)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo CSV
          </CardTitle>
          <CardDescription>Arrastra y suelta tu archivo CSV o haz clic para seleccionar</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">{file ? file.name : "Selecciona un archivo CSV"}</p>
            <p className="text-sm text-gray-500 mb-4">O arrastra y suelta aquí</p>
            <Input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
            <div className="flex justify-center gap-2">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                Seleccionar archivo
              </Button>
              {file && (
                <Button onClick={clearData} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              )}
              {debugInfo && (
                <Button onClick={() => setShowDebug(!showDebug)} variant="ghost" size="sm">
                  <Bug className="h-4 w-4" />
                  Debug
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Información de Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Headers encontrados:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1">{JSON.stringify(debugInfo.rawHeaders, null, 2)}</pre>
              </div>
              <div>
                <strong>Headers normalizados:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(debugInfo.normalizedHeaders, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Headers esperados:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1">{JSON.stringify(debugInfo.expectedHeaders, null, 2)}</pre>
              </div>
              {debugInfo.sampleRow && (
                <div>
                  <strong>Primera fila de datos:</strong>
                  <pre className="bg-gray-100 p-2 rounded mt-1">{JSON.stringify(debugInfo.sampleRow, null, 2)}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Datos</CardTitle>
            <CardDescription>
              {parsedData.length} propiedades encontradas. Revisa los datos antes de importar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {parsedData.filter((p) => p.validation_errors.length === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Válidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {parsedData.filter((p) => p.validation_errors.length > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Con errores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.length > 0
                      ? Math.round(parsedData.reduce((sum, p) => sum + p.data_quality_score, 0) / parsedData.length)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Calidad promedio</div>
                </div>
              </div>

              {/* Properties List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {parsedData.map((property, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{property.title || `Propiedad ${index + 1}`}</h4>
                      {getQualityBadge(property.data_quality_score)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <strong>Contacto:</strong> {property.contact_name || "No especificado"}
                      </div>
                      <div>
                        <strong>Teléfono:</strong> {property.contact_phone || "No especificado"}
                      </div>
                      <div>
                        <strong>Email:</strong> {property.contact_email || "No especificado"}
                      </div>
                      <div>
                        <strong>Región:</strong> {property.region || "No especificado"}
                      </div>
                      <div>
                        <strong>Propietario:</strong> {property.owner_name || "No especificado"}
                      </div>
                      <div>
                        <strong>Derechos de agua:</strong> {property.water_rights ? "Sí" : "No"}
                      </div>
                    </div>

                    {property.validation_errors.length > 0 && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Errores:</strong> {property.validation_errors.join(", ")}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>

              {/* Import Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearData}>
                  Cancelar
                </Button>
                <Button
                  onClick={importData}
                  disabled={importing || parsedData.length === 0}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Importar {parsedData.filter((p) => p.validation_errors.length === 0).length} Propiedades
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Importando propiedades...</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {importResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p className={importResult.success ? "text-green-800" : "text-red-800"}>{importResult.message}</p>
              {importResult.errors.length > 0 && (
                <div>
                  <p className="font-medium text-red-800 mb-1">Errores encontrados:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
