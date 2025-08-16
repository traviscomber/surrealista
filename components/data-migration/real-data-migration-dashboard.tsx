"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FolderOpen,
  FileText,
  ImageIcon,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Database,
  Search,
} from "lucide-react"

interface MigrationStatus {
  totalCases: number
  processedCases: number
  extractedRoles: number
  validatedStructures: number
  errors: number
}

interface CaseStructure {
  name: string
  status: "pending" | "processing" | "completed" | "error"
  folders: {
    fotos: number
    fotosCel: number
    fotosEnero2024: number
  }
  documents: {
    kmzFiles: number
    fundoPdfs: number
    ordenVenta: number
    mariouinFotos: number
  }
  extractedData: {
    numeroRol?: string
    ubicacion?: string
    propietario?: string
  }
}

export default function RealDataMigrationDashboard() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    totalCases: 5,
    processedCases: 0,
    extractedRoles: 0,
    validatedStructures: 5,
    errors: 0,
  })

  const [successCases, setSuccessCases] = useState<CaseStructure[]>([
    {
      name: "Valdivia 142 has Teresa F...",
      status: "completed",
      folders: { fotos: 1, fotosCel: 1, fotosEnero2024: 1 },
      documents: { kmzFiles: 1, fundoPdfs: 1, ordenVenta: 2, mariouinFotos: 1 },
      extractedData: {
        numeroRol: "Pendiente extracción",
        ubicacion: "Campo Iñipulli 140",
        propietario: "Teresa F...",
      },
    },
    {
      name: "Caso Éxito #2",
      status: "pending",
      folders: { fotos: 0, fotosCel: 0, fotosEnero2024: 0 },
      documents: { kmzFiles: 0, fundoPdfs: 0, ordenVenta: 0, mariouinFotos: 0 },
      extractedData: {},
    },
    {
      name: "Caso Éxito #3",
      status: "pending",
      folders: { fotos: 0, fotosCel: 0, fotosEnero2024: 0 },
      documents: { kmzFiles: 0, fundoPdfs: 0, ordenVenta: 0, mariouinFotos: 0 },
      extractedData: {},
    },
    {
      name: "Caso Éxito #4",
      status: "pending",
      folders: { fotos: 0, fotosCel: 0, fotosEnero2024: 0 },
      documents: { kmzFiles: 0, fundoPdfs: 0, ordenVenta: 0, mariouinFotos: 0 },
      extractedData: {},
    },
    {
      name: "Caso Éxito #5",
      status: "pending",
      folders: { fotos: 0, fotosCel: 0, fotosEnero2024: 0 },
      documents: { kmzFiles: 0, fundoPdfs: 0, ordenVenta: 0, mariouinFotos: 0 },
      extractedData: {},
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Clock className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Migración Data Real</h1>
          <p className="text-muted-foreground">Sistema preparado para recibir los 5 casos de éxito reales en 2 días</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Listo para Migración
        </Badge>
      </div>

      {/* Alert de Preparación */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema Preparado:</strong> Estructura basada en "Valdivia 142 has Teresa F..." lista para procesar
          data real. Esperando entrega en 2 días.
        </AlertDescription>
      </Alert>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Totales</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStatus.totalCases}</div>
            <p className="text-xs text-muted-foreground">Casos de éxito identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estructuras Validadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStatus.validatedStructures}</div>
            <p className="text-xs text-muted-foreground">Basado en estructura real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Números de Rol</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStatus.extractedRoles}</div>
            <p className="text-xs text-muted-foreground">Pendientes de extracción</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Listo</div>
            <p className="text-xs text-muted-foreground">Para recibir data real</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Casos de Éxito</TabsTrigger>
          <TabsTrigger value="structure">Estructura Template</TabsTrigger>
          <TabsTrigger value="migration">Plan Migración</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <div className="grid gap-4">
            {successCases.map((case_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{case_.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(case_.status)}
                      <Badge className={getStatusColor(case_.status)}>{case_.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Carpetas */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Carpetas
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>fotos</span>
                          <Badge variant="outline">{case_.folders.fotos}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>fotos cel</span>
                          <Badge variant="outline">{case_.folders.fotosCel}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Fotos enero 2024</span>
                          <Badge variant="outline">{case_.folders.fotosEnero2024}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Documentos */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Archivos KMZ</span>
                          <Badge variant="outline">{case_.documents.kmzFiles}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Fundo PDFs</span>
                          <Badge variant="outline">{case_.documents.fundoPdfs}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Orden Venta</span>
                          <Badge variant="outline">{case_.documents.ordenVenta}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Datos Extraídos */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Datos Extraídos
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Número Rol:</span>
                          <p className="font-medium">{case_.extractedData.numeroRol || "Pendiente"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ubicación:</span>
                          <p className="font-medium">{case_.extractedData.ubicacion || "Pendiente"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Propietario:</span>
                          <p className="font-medium">{case_.extractedData.propietario || "Pendiente"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estructura Template: "Valdivia 142 has Teresa F..."</CardTitle>
              <CardDescription>Estructura base identificada para todos los casos de éxito</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-mono text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Valdivia 142 has Teresa F...</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3 text-blue-500" />
                        <span>fotos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3 text-blue-500" />
                        <span>fotos cel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3 text-blue-500" />
                        <span>Fotos enero 2024</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span>Campo Iñipulli 140_has.kmz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-red-600" />
                        <span>Fundo Iñipulli_140_110124_compressed.pdf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-3 w-3 text-purple-600" />
                        <span>MARIOUINAfoto.pdf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-orange-600" />
                        <span>Orden de Venta Iñipulli.docx</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-red-600" />
                        <span>Orden de Venta TF.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan de Migración - Próximos 2 Días</CardTitle>
              <CardDescription>Pasos preparados para cuando recibas la data real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Sistema Preparado</p>
                      <p className="text-sm text-muted-foreground">
                        Estructura template basada en caso real identificado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Recepción Data Real (Día 1)</p>
                      <p className="text-sm text-muted-foreground">
                        Importar y validar estructura de los 5 casos de éxito
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Extracción Números de Rol (Día 2)</p>
                      <p className="text-sm text-muted-foreground">
                        Procesar inscripciones, mandatos y tasaciones automáticamente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Database className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Migración Completa</p>
                      <p className="text-sm text-muted-foreground">Sistema operativo con data real de casos de éxito</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Preparación Completada</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Estructura template validada</li>
                    <li>✓ Sistema de extracción de números de rol</li>
                    <li>✓ Validador de estructura de carpetas</li>
                    <li>✓ Dashboard de migración preparado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
