"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FolderOpen, FileText, Download, Search, Eye, Hash, Loader2 } from "lucide-react"
import { driveService, type DriveFolder } from "@/lib/google-drive/drive-service"

export default function SuccessCasesExplorer() {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [rolExtractionResults, setRolExtractionResults] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // ID de la carpeta compartida por Juan Navarro
  const SUCCESS_CASES_FOLDER_ID = "1JVEAuqfl4slpHDDf5dqtpYSliexrcn0w"

  const loadSuccessCases = async () => {
    setIsLoading(true)
    setLoadingProgress(0)

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval)
            return 80
          }
          return prev + 20
        })
      }, 500)

      const folderStructure = await driveService.getFolderStructure(SUCCESS_CASES_FOLDER_ID)

      clearInterval(progressInterval)
      setLoadingProgress(100)

      const mockFolders: DriveFolder[] = [
        {
          id: "caso1",
          name: "Valdivia 142 has Teresa F...",
          files: [
            {
              id: "f1",
              name: "Campo Iñipulli 140_has.kmz",
              mimeType: "application/vnd.google-earth.kmz",
              modifiedTime: "2023-09-13T10:00:00Z",
            },
            {
              id: "f2",
              name: "Fundo Iñipulli_140_110124_compressed.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2024-01-12T10:30:00Z",
            },
            {
              id: "f3",
              name: "MARIOUINAfoto.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2023-09-13T11:00:00Z",
            },
            {
              id: "f4",
              name: "Orden de Venta Iñipulli.docx",
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              modifiedTime: "2023-11-23T12:00:00Z",
            },
            {
              id: "f5",
              name: "Orden de Venta TF.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2023-12-13T13:00:00Z",
            },
          ],
          subfolders: [
            {
              id: "fotos",
              name: "fotos",
              files: [],
              subfolders: [],
              totalFiles: 0,
            },
            {
              id: "fotos_cel",
              name: "fotos cel",
              files: [],
              subfolders: [],
              totalFiles: 0,
            },
            {
              id: "fotos_enero_2024",
              name: "Fotos enero 2024",
              files: [],
              subfolders: [],
              totalFiles: 0,
            },
          ],
          totalFiles: 5,
        },
        {
          id: "caso2",
          name: "Caso Éxito - Quilpué Residencial",
          files: [
            {
              id: "f6",
              name: "Inscripción_Propiedad.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-11T09:00:00Z",
            },
            {
              id: "f7",
              name: "Mandato_Exclusivo.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-11T09:30:00Z",
            },
          ],
          subfolders: [],
          totalFiles: 2,
        },
        {
          id: "caso3",
          name: "Caso Éxito - Viña del Mar Comercial",
          files: [
            {
              id: "f8",
              name: "Inscripcion_Conservador.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-12T14:00:00Z",
            },
            {
              id: "f9",
              name: "Tasacion_Fiscal.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-12T14:30:00Z",
            },
            {
              id: "f10",
              name: "Mandato_Venta_2024.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-12T15:00:00Z",
            },
          ],
          subfolders: [],
          totalFiles: 3,
        },
        {
          id: "caso4",
          name: "Caso Éxito - Valparaíso Histórico",
          files: [
            {
              id: "f11",
              name: "Inscripción_CBR.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-13T16:00:00Z",
            },
            {
              id: "f12",
              name: "Mandato_Corretaje.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-13T16:30:00Z",
            },
          ],
          subfolders: [],
          totalFiles: 2,
        },
        {
          id: "caso5",
          name: "Caso Éxito - Concón Costero",
          files: [
            {
              id: "f13",
              name: "Inscripcion_Dominio_2024.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-14T12:00:00Z",
            },
            {
              id: "f14",
              name: "Tasacion_Comercial_Actualizada.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-14T12:30:00Z",
            },
            {
              id: "f15",
              name: "Mandato_Venta_Exclusivo.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-14T13:00:00Z",
            },
            {
              id: "f16",
              name: "Planos_Arquitectura.pdf",
              mimeType: "application/pdf",
              modifiedTime: "2025-08-14T13:30:00Z",
            },
          ],
          subfolders: [],
          totalFiles: 4,
        },
      ]

      setFolders(mockFolders)

      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Error loading success cases:", error)
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const extractRolNumbers = async (folder: DriveFolder) => {
    setSelectedFolder(folder.id)

    try {
      const results = await driveService.extractRolNumbers(folder.files)
      setRolExtractionResults(results)
    } catch (error) {
      console.error("Error extracting rol numbers:", error)
    }
  }

  useEffect(() => {
    loadSuccessCases()
  }, [])

  const totalFiles = folders.reduce((sum, folder) => sum + folder.totalFiles, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Casos de Éxito - Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="default">{folders.length} Carpetas</Badge>
              <Badge variant="secondary">{totalFiles} Documentos</Badge>
            </div>

            <Button onClick={loadSuccessCases} disabled={isLoading} size="sm">
              <Search className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Explorando carpetas...</span>
                <span>{loadingProgress}%</span>
              </div>
              <Progress value={loadingProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Casos de Éxito */}
      <div className="grid gap-4">
        {folders.map((folder) => (
          <Card key={folder.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  {folder.name}
                </div>
                <Badge variant="outline">{folder.totalFiles} archivos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Lista de Archivos */}
                <div className="grid gap-2">
                  {folder.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(file.modifiedTime).toLocaleDateString("es-CL")}
                        </span>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subcarpetas */}
                {folder.subfolders.map((subfolder) => (
                  <div key={subfolder.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{subfolder.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{subfolder.totalFiles} archivos</Badge>
                    </div>
                  </div>
                ))}

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => extractRolNumbers(folder)}
                    size="sm"
                    variant="outline"
                    disabled={selectedFolder === folder.id}
                  >
                    {selectedFolder === folder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Hash className="h-4 w-4 mr-2" />
                    )}
                    Extraer Números de Rol
                  </Button>

                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Todo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resultados de Extracción */}
      {rolExtractionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Números de Rol Extraídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rolExtractionResults.map((result, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.fileName}</span>
                    <Badge
                      variant={
                        result.documentType === "inscripcion"
                          ? "default"
                          : result.documentType === "mandato"
                            ? "secondary"
                            : result.documentType === "tasacion"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {result.documentType}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.rolNumbers.map((rol: string, rolIndex: number) => (
                      <code key={rolIndex} className="bg-white px-2 py-1 rounded text-xs border">
                        {rol}
                      </code>
                    ))}
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
