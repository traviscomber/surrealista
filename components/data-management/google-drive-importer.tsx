"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, FolderOpen, Link, Database } from 'lucide-react'
import { GoogleSheetsParser, type ParsedProperty } from "@/lib/data-management/google-sheets-parser"

interface GoogleDriveImporterProps {
  onImportComplete?: () => void
}

interface ImportBatch {
  id: string
  name: string
  source: 'file' | 'url' | 'drive'
  status: 'pending' | 'processing' | 'completed' | 'error'
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  createdAt: Date
}

export default function GoogleDriveImporter({ onImportComplete }: GoogleDriveImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [parsedData, setParsedData] = useState<ParsedProperty[]>([])
  const [importing, setImporting] = useState(false)
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [activeImportTab, setActiveImportTab] = useState("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const template = GoogleSheetsParser.generateTemplate()
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-google-drive-propiedades.csv"
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

    try {
      const content = await selectedFile.text()
      const parsed = GoogleSheetsParser.parseCSV(content)
      setParsedData(parsed)
    } catch (error) {
      console.error("Error parsing CSV:", error)
      alert(`Error al procesar el archivo: ${error}`)
    }
  }

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl) {
      alert("Por favor ingresa una URL de Google Sheets")
      return
    }

    setImporting(true)
    try {
      // Simulate Google Sheets API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock data for demonstration
      const mockData: ParsedProperty[] = [
        {
          title: "Fundo Los Aromos",
          contact_name: "Pedro Martínez",
          contact_phone: "+56987654321",
          contact_email: "pedro.martinez@email.com",
          property_rol: "789-12",
          water_rights: true,
          owner_name: "Pedro Martínez Silva",
          region: "O'Higgins",
          data_quality_score: 92,
          validation_errors: []
        }
      ]
      
      setParsedData(mockData)
      alert("Datos importados exitosamente desde Google Sheets")
    } catch (error) {
      alert(`Error al importar desde Google Sheets: ${error}`)
    } finally {
      setImporting(false)
    }
  }

  const importData = async () => {
    if (parsedData.length === 0) return

    setImporting(true)

    try {
      const validProperties = parsedData.filter(p => p.validation_errors.length === 0)
      
      // Create import batch
      const newBatch: ImportBatch = {
        id: Date.now().toString(),
        name: file ? file.name : "Google Sheets Import",
        source: file ? 'file' : googleSheetsUrl ? 'url' : 'drive',
        status: 'processing',
        totalRecords: parsedData.length,
        successfulRecords: 0,
        failedRecords: 0,
        createdAt: new Date()
      }

      setImportBatches(prev => [newBatch, ...prev])

      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Update batch status
      const updatedBatch: ImportBatch = {
        ...newBatch,
        status: 'completed',
        successfulRecords: validProperties.length,
        failedRecords: parsedData.length - validProperties.length
      }

      setImportBatches(prev => prev.map(batch => 
        batch.id === newBatch.id ? updatedBatch : batch
      ))

      // Clear form
      setParsedData([])
      setFile(null)
      setGoogleSheetsUrl("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      onImportComplete?.()
      
    } catch (error) {
      console.error("Import error:", error)
    } finally {
      setImporting(false)
    }
  }

  const clearData = () => {
    setFile(null)
    setGoogleSheetsUrl("")
    setParsedData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStatusBadge = (status: ImportBatch['status']) => {
    const statusConfig = {
      pending: { color: "bg-gray-100 text-gray-800", text: "Pendiente" },
      processing: { color: "bg-blue-100 text-blue-800", text: "Procesando" },
      completed: { color: "bg-green-100 text-green-800", text: "Completado" },
      error: { color: "bg-red-100 text-red-800", text: "Error" }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla Estandarizada
          </CardTitle>
          <CardDescription>
            Descarga la plantilla oficial para organizar datos de Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descargar Plantilla CSV
            </Button>
            <div className="text-sm text-gray-600">
              Incluye todos los campos requeridos para la Fase 1
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Métodos de Importación
          </CardTitle>
          <CardDescription>
            Elige el método que mejor se adapte a tu flujo de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeImportTab} onValueChange={setActiveImportTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Archivo CSV
              </TabsTrigger>
              <TabsTrigger value="sheets" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Google Sheets
              </TabsTrigger>
              <TabsTrigger value="drive" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Google Drive
              </TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4">
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
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {file ? file.name : "Arrastra tu archivo CSV aquí"}
                </p>
                <p className="text-sm text-gray-500 mb-4">O haz clic para seleccionar</p>
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
                </div>
              </div>
            </TabsContent>

            {/* Google Sheets Tab */}
            <TabsContent value="sheets" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL de Google Sheets</label>
                  <Input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGoogleSheetsImport} 
                  disabled={!googleSheetsUrl || importing}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      Importar desde Google Sheets
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Google Drive Tab */}
            <TabsContent value="drive" className="space-y-4">
              <Alert>
                <FolderOpen className="h-4 w-4" />
                <AlertDescription>
                  <strong>Próximamente:</strong> Integración directa con Google Drive API para importar 
                  múltiples archivos automáticamente.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa de Datos</CardTitle>
            <CardDescription>
              {parsedData.length} propiedades encontradas. Revisa antes de importar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {parsedData.filter(p => p.validation_errors.length === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Válidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {parsedData.filter(p => p.validation_errors.length > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Con errores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.length > 0
                      ? Math.round(parsedData.reduce((sum, p) => sum + p.data_quality_score, 0) / parsedData.length)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Calidad promedio</div>
                </div>
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
                      <Database className="h-4 w-4" />
                      Importar {parsedData.filter(p => p.validation_errors.length === 0).length} Propiedades
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      {importBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Historial de Importaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{batch.name}</div>
                      <div className="text-sm text-gray-600">
                        {batch.createdAt.toLocaleDateString()} - {batch.totalRecords} registros
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-right">
                      <div className="text-green-600">{batch.successfulRecords} exitosos</div>
                      {batch.failedRecords > 0 && (
                        <div className="text-red-600">{batch.failedRecords} fallidos</div>
                      )}
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
