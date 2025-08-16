"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, FileText, FolderOpen, Link, Database, AlertCircle } from "lucide-react"

interface GoogleDriveImporterProps {
  onImportComplete?: () => void
}

interface ImportBatch {
  id: string
  name: string
  source: "file" | "url" | "drive"
  status: "pending" | "processing" | "completed" | "error"
  totalRecords: number
  successfulRecords: number
  failedRecords: number
  createdAt: Date
}

export default function GoogleDriveImporter({ onImportComplete }: GoogleDriveImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [importing, setImporting] = useState(false)
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [activeImportTab, setActiveImportTab] = useState("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    alert("Plantilla disponible cuando se configure Google Drive API")
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
    alert("Importación de archivos disponible en Etapa 2")
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Importación de archivos disponible cuando se configure Google Drive API")
  }

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl) {
      alert("Por favor ingresa una URL de Google Sheets")
      return
    }

    alert("Importación desde Google Sheets disponible en Etapa 2")
  }

  const importData = async () => {
    alert("Funcionalidad de importación disponible cuando se configure Google Drive API")
  }

  const clearData = () => {
    setFile(null)
    setGoogleSheetsUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* API Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Estado Actual:</strong> Google Drive API disponible pero no configurada. Importación de datos
          programada para Etapa 2 del proyecto.
        </AlertDescription>
      </Alert>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla Estandarizada
          </CardTitle>
          <CardDescription>Plantilla disponible cuando se configure la integración</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              disabled
              className="flex items-center gap-2 bg-transparent"
            >
              <FileText className="h-4 w-4" />
              Plantilla Pendiente
            </Button>
            <div className="text-sm text-gray-600">Disponible en Etapa 2 - Configuración API</div>
          </div>
        </CardContent>
      </Card>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Métodos de Importación (Etapa 2)
          </CardTitle>
          <CardDescription>Funcionalidades disponibles cuando se complete la configuración API</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeImportTab} onValueChange={setActiveImportTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file" disabled className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Archivo CSV
              </TabsTrigger>
              <TabsTrigger value="sheets" disabled className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Google Sheets
              </TabsTrigger>
              <TabsTrigger value="drive" disabled className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Google Drive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Importación de archivos CSV disponible en Etapa 2 cuando se configure Google Drive API.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="sheets" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Importación desde Google Sheets disponible en Etapa 2.</AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="drive" className="space-y-4">
              <Alert>
                <FolderOpen className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estado:</strong> Google Drive API key disponible. Configuración de OAuth pendiente para Etapa
                  2.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado Actual - Etapa 1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">Casos de Éxito Identificados</div>
                  <div className="text-sm text-gray-600">
                    5 carpetas reales en Google Drive - Pendiente procesamiento
                  </div>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Pendiente</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">Google Drive API</div>
                  <div className="text-sm text-gray-600">API Key disponible - OAuth configuración pendiente</div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Configurando</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
