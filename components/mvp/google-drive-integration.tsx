"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  FolderOpen,
  FolderSyncIcon as Sync,
  Download,
  Edit,
  CheckCircle,
  AlertTriangle,
  Settings,
  Search,
  FileText,
  ImageIcon,
  Video,
  ChevronRight,
  ChevronDown,
  Building2,
  Hash,
  Calendar,
  MapPin,
} from "lucide-react"
import type { DriveFile, CompanyFolder, SyncSettings } from "@/types/drive-file"

export default function GoogleDriveIntegration() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [companyStructure, setCompanyStructure] = useState<CompanyFolder[]>([])
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 15,
    includeImages: true,
    includeDocuments: true,
    includeVideos: false,
    maxFileSize: 100,
  })
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [connected, setConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<"files" | "structure">("files")

  useEffect(() => {
    loadCompanyStructure()
  }, [])

  const loadCompanyStructure = () => {
    const mockStructure: CompanyFolder[] = [
      {
        id: "emp_001",
        name: "Inmobiliaria Los Andes S.A.",
        code: "EMP-001",
        type: "company",
        fileCount: 2847,
        lastModified: "2024-01-15",
        status: "active",
        expanded: true,
        children: [
          {
            id: "proj_001",
            name: "Proyecto Condominio Valle Verde",
            code: "PROJ-VV-2024-001",
            type: "project",
            fileCount: 456,
            lastModified: "2024-01-14",
            status: "active",
            expanded: true,
            children: [
              {
                id: "prop_001",
                name: "Casa Modelo A - Lote 15",
                code: "VV-CASA-A-L015",
                type: "property",
                fileCount: 89,
                lastModified: "2024-01-13",
                status: "active",
                children: [
                  {
                    id: "doc_001",
                    name: "01_Documentos_Legales",
                    code: "DOC-LEG",
                    type: "document",
                    fileCount: 23,
                    lastModified: "2024-01-12",
                    status: "active",
                    children: [
                      {
                        id: "doc_001_1",
                        name: "Escritura_VV-CASA-A-L015_20240110.pdf",
                        code: "ESC-001",
                        type: "document",
                        fileCount: 1,
                        lastModified: "2024-01-10",
                        status: "active",
                      },
                      {
                        id: "doc_001_2",
                        name: "Planos_Aprobados_VV-CASA-A-L015_v3.dwg",
                        code: "PLN-001",
                        type: "document",
                        fileCount: 1,
                        lastModified: "2024-01-09",
                        status: "active",
                      },
                    ],
                  },
                  {
                    id: "media_001",
                    name: "02_Fotografias_Marketing",
                    code: "FOTO-MKT",
                    type: "media",
                    fileCount: 45,
                    lastModified: "2024-01-11",
                    status: "active",
                    children: [
                      {
                        id: "media_001_1",
                        name: "Exterior_VV-CASA-A-L015_20240111",
                        code: "EXT-001",
                        type: "media",
                        fileCount: 15,
                        lastModified: "2024-01-11",
                        status: "active",
                      },
                      {
                        id: "media_001_2",
                        name: "Interior_VV-CASA-A-L015_20240111",
                        code: "INT-001",
                        type: "media",
                        fileCount: 20,
                        lastModified: "2024-01-11",
                        status: "active",
                      },
                    ],
                  },
                  {
                    id: "fin_001",
                    name: "03_Documentos_Financieros",
                    code: "DOC-FIN",
                    type: "document",
                    fileCount: 12,
                    lastModified: "2024-01-08",
                    status: "active",
                  },
                ],
              },
              {
                id: "prop_002",
                name: "Casa Modelo B - Lote 23",
                code: "VV-CASA-B-L023",
                type: "property",
                fileCount: 67,
                lastModified: "2024-01-10",
                status: "pending",
              },
            ],
          },
          {
            id: "proj_002",
            name: "Proyecto Edificio Torre Central",
            code: "PROJ-TC-2024-002",
            type: "project",
            fileCount: 892,
            lastModified: "2024-01-12",
            status: "active",
            children: [
              {
                id: "prop_003",
                name: "Departamento 2101 - Torre A",
                code: "TC-DEPTO-A-2101",
                type: "property",
                fileCount: 34,
                lastModified: "2024-01-12",
                status: "active",
              },
              {
                id: "prop_004",
                name: "Departamento 1205 - Torre B",
                code: "TC-DEPTO-B-1205",
                type: "property",
                fileCount: 28,
                lastModified: "2024-01-11",
                status: "active",
              },
            ],
          },
          {
            id: "arch_001",
            name: "Archivo_Proyectos_2023",
            code: "ARCH-2023",
            type: "project",
            fileCount: 1499,
            lastModified: "2023-12-31",
            status: "archived",
          },
        ],
      },
    ]

    setCompanyStructure(mockStructure)
  }

  const loadDriveFiles = async () => {
    const mockFiles: DriveFile[] = []
    setFiles(mockFiles)
  }

  const toggleFolder = (folderId: string) => {
    const toggleInStructure = (folders: CompanyFolder[]): CompanyFolder[] => {
      return folders.map((folder) => {
        if (folder.id === folderId) {
          return { ...folder, expanded: !folder.expanded }
        }
        if (folder.children) {
          return { ...folder, children: toggleInStructure(folder.children) }
        }
        return folder
      })
    }

    setCompanyStructure((prev) => toggleInStructure(prev))
  }

  const renderCompanyStructure = (folders: CompanyFolder[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => folder.children && toggleFolder(folder.id)}
        >
          {folder.children &&
            folder.children.length > 0 &&
            (folder.expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            ))}

          {!folder.children && <div className="w-4" />}

          {folder.type === "company" && <Building2 className="h-4 w-4 text-blue-600" />}
          {folder.type === "project" && <FolderOpen className="h-4 w-4 text-green-600" />}
          {folder.type === "property" && <MapPin className="h-4 w-4 text-purple-600" />}
          {folder.type === "document" && <FileText className="h-4 w-4 text-red-600" />}
          {folder.type === "media" && <ImageIcon className="h-4 w-4 text-orange-600" />}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{folder.name}</span>
              <Badge variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {folder.code}
              </Badge>
              <Badge
                variant={
                  folder.status === "active" ? "default" : folder.status === "archived" ? "secondary" : "outline"
                }
                className="text-xs"
              >
                {folder.status === "active" ? "Activo" : folder.status === "archived" ? "Archivado" : "Pendiente"}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-4">
              <span>{folder.fileCount} archivos</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {folder.lastModified}
              </span>
            </div>
          </div>
        </div>

        {folder.expanded && folder.children && <div>{renderCompanyStructure(folder.children, level + 1)}</div>}
      </div>
    ))
  }

  const handleSync = async () => {
    setSyncing(true)

    await new Promise((resolve) => setTimeout(resolve, 3000))

    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: Math.random() > 0.1 ? "synced" : "error",
      })),
    )

    setSyncing(false)
  }

  const connectToDrive = async () => {
    setSyncing(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setConnected(false)
    setSyncing(false)

    alert("La API de Google Drive aún no está configurada. Esto será implementado en la siguiente etapa del proyecto.")
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || file.type === filterType
    return matchesSearch && matchesType
  })

  const getFileIcon = (type: DriveFile["type"]) => {
    switch (type) {
      case "folder":
        return <FolderOpen className="h-4 w-4 text-blue-600" />
      case "document":
        return <FileText className="h-4 w-4 text-red-600" />
      case "image":
        return <ImageIcon className="h-4 w-4 text-green-600" />
      case "video":
        return <Video className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: DriveFile["status"]) => {
    const statusConfig = {
      synced: { color: "bg-green-100 text-green-800", text: "Sincronizado", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pendiente", icon: Sync },
      error: { color: "bg-red-100 text-red-800", text: "Error", icon: AlertTriangle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Integración con Google Drive
          </CardTitle>
          <CardDescription>La API de Google Drive será configurada en la siguiente etapa del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">API No Configurada</h3>
            <p className="text-gray-600 mb-6">
              La integración con Google Drive está pendiente de entrega por parte de Sur-Realista. Actualmente estamos
              en la fase de organización de datos locales y esperando las credenciales de API.
            </p>
            <Button
              onClick={connectToDrive}
              disabled={syncing}
              className="flex items-center gap-2 bg-transparent"
              variant="outline"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4" />
                  Ver Demo de Integración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Google Drive Conectado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Estado: Conectado y sincronizado</div>
              <div className="text-sm text-gray-600">Última sincronización: {new Date().toLocaleString()}</div>
            </div>
            <Button onClick={handleSync} disabled={syncing} variant="outline">
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Sincronizando...
                </>
              ) : (
                <>
                  <Sync className="h-4 w-4 mr-2" />
                  Sincronizar Ahora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 border-b">
            <button
              onClick={() => setActiveTab("files")}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === "files"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Explorador de Archivos
              </div>
            </button>
            <button
              onClick={() => setActiveTab("structure")}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === "structure"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Estructura Empresarial
              </div>
            </button>
          </div>
        </CardHeader>
      </Card>

      {activeTab === "structure" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Mejores Prácticas de Codificación
              </CardTitle>
              <CardDescription>
                Sistema de nomenclatura y organización profesional para archivos inmobiliarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">CÓDIGOS DE EMPRESA</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Empresa:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">EMP-001</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proyecto:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">PROJ-[SIGLAS]-YYYY-###</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Propiedad:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">[PROJ]-[TIPO]-[ID]</code>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">TIPOS DE DOCUMENTO</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Legal:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">DOC-LEG</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Financiero:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">DOC-FIN</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marketing:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">FOTO-MKT</code>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Convención de Fechas:</strong> Usar formato YYYYMMDD para ordenamiento cronológico automático.
                  <br />
                  <strong>Versionado:</strong> Agregar _v1, _v2, _v3 al final del nombre para control de versiones.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Estructura Empresarial Completa
              </CardTitle>
              <CardDescription>Vista jerárquica de la organización de carpetas con códigos y estados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">{renderCompanyStructure(companyStructure)}</div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "files" && (
        <>
          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-sync">Sincronización Automática</Label>
                    <Switch
                      id="auto-sync"
                      checked={syncSettings.autoSync}
                      onCheckedChange={(checked) => setSyncSettings((prev) => ({ ...prev, autoSync: checked }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sync-interval">Intervalo (minutos)</Label>
                    <Input
                      id="sync-interval"
                      type="number"
                      value={syncSettings.syncInterval}
                      onChange={(e) =>
                        setSyncSettings((prev) => ({ ...prev, syncInterval: Number.parseInt(e.target.value) }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-images">Incluir Imágenes</Label>
                    <Switch
                      id="include-images"
                      checked={syncSettings.includeImages}
                      onCheckedChange={(checked) => setSyncSettings((prev) => ({ ...prev, includeImages: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-documents">Incluir Documentos</Label>
                    <Switch
                      id="include-documents"
                      checked={syncSettings.includeDocuments}
                      onCheckedChange={(checked) => setSyncSettings((prev) => ({ ...prev, includeDocuments: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-videos">Incluir Videos</Label>
                    <Switch
                      id="include-videos"
                      checked={syncSettings.includeVideos}
                      onCheckedChange={(checked) => setSyncSettings((prev) => ({ ...prev, includeVideos: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Browser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Explorador de Archivos
              </CardTitle>
              <CardDescription>Navega y gestiona tus archivos sincronizados desde Google Drive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar archivos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="folder">Carpetas</option>
                    <option value="document">Documentos</option>
                    <option value="image">Imágenes</option>
                    <option value="video">Videos</option>
                  </select>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-600">{file.path}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          <div>{file.size}</div>
                          <div>{file.modified}</div>
                        </div>

                        {getStatusBadge(file.status)}

                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron archivos con los filtros actuales.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Sync Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-sm text-gray-600">Archivos Totales</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {files.filter((f) => f.status === "synced").length}
              </div>
              <div className="text-sm text-gray-600">Sincronizados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {files.filter((f) => f.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{files.filter((f) => f.status === "error").length}</div>
              <div className="text-sm text-gray-600">Con Errores</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
