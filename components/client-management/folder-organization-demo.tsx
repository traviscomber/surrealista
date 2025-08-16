"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FolderOpen,
  FileText,
  ImageIcon,
  Download,
  CheckCircle,
  Users,
  Building,
  Calendar,
  Eye,
  Settings,
  Target,
  Zap,
  Clock,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

interface FolderStructure {
  name: string
  type: "folder" | "file"
  icon: React.ReactNode
  children?: FolderStructure[]
  description?: string
  status?: "completo" | "parcial" | "pendiente"
  lastModified?: string
  size?: string
}

const clientFolderStructure: FolderStructure = {
  name: "📁 CLIENTES - NEURALIA INMOBILIARIA",
  type: "folder",
  icon: <FolderOpen className="w-4 h-4 text-blue-600" />,
  status: "parcial",
  description: "Estructura principal de organización de clientes",
  children: [
    {
      name: "🔥 01_CLIENTES_CALIENTES",
      type: "folder",
      icon: <FolderOpen className="w-4 h-4 text-red-500" />,
      status: "completo",
      description: "Clientes con alta probabilidad de cierre (próximos 30 días)",
      children: [
        {
          name: "🏢 CARLOS_MENDOZA_INVERSIONES_DEL_SUR",
          type: "folder",
          icon: <Building className="w-4 h-4 text-gray-600" />,
          status: "completo",
          description: "Inversionista - Busca departamentos para arriendo",
          children: [
            {
              name: "📋 01_FICHA_CLIENTE",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-blue-500" />,
              status: "completo",
              children: [
                {
                  name: "FichaCliente_CarlosMendoza_2024-02-08_v1.pdf",
                  type: "file",
                  icon: <FileText className="w-4 h-4 text-red-500" />,
                  lastModified: "8 Feb 2024",
                  size: "2.3 MB",
                },
                {
                  name: "CertificadoIngresos_CarlosMendoza_2024-02-05.pdf",
                  type: "file",
                  icon: <FileText className="w-4 h-4 text-red-500" />,
                  lastModified: "5 Feb 2024",
                  size: "1.8 MB",
                },
              ],
            },
            {
              name: "🏠 02_PROPIEDADES_INTERES",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-green-500" />,
              status: "completo",
              children: [
                {
                  name: "Depto_LasConde_Av.Apoquindo_2024-02-08.pdf",
                  type: "file",
                  icon: <FileText className="w-4 h-4 text-red-500" />,
                  lastModified: "8 Feb 2024",
                  size: "4.2 MB",
                },
                {
                  name: "Fotos_Depto_LasConde_2024-02-08.zip",
                  type: "file",
                  icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
                  lastModified: "8 Feb 2024",
                  size: "15.7 MB",
                },
              ],
            },
            {
              name: "💬 03_COMUNICACIONES",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-yellow-500" />,
              status: "completo",
              children: [
                {
                  name: "WhatsApp_CarlosMendoza_2024-02-01-08.pdf",
                  type: "file",
                  icon: <FileText className="w-4 h-4 text-red-500" />,
                  lastModified: "8 Feb 2024",
                  size: "892 KB",
                },
              ],
            },
          ],
        },
        {
          name: "👥 FAMILIA_RODRIGUEZ_COMPRA_CASA",
          type: "folder",
          icon: <Users className="w-4 h-4 text-gray-600" />,
          status: "parcial",
          description: "Familia joven - Primera vivienda con subsidio",
          children: [
            {
              name: "📋 01_FICHA_CLIENTE",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-blue-500" />,
              status: "parcial",
            },
            {
              name: "🏠 02_PROPIEDADES_INTERES",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-green-500" />,
              status: "completo",
            },
          ],
        },
      ],
    },
    {
      name: "🎯 02_CLIENTES_TIBIOS",
      type: "folder",
      icon: <FolderOpen className="w-4 h-4 text-yellow-500" />,
      status: "parcial",
      description: "Clientes con interés moderado (30-90 días)",
      children: [
        {
          name: "🏢 EMPRESA_CONSTRUCTORA_PACIFICO",
          type: "folder",
          icon: <Building className="w-4 h-4 text-gray-600" />,
          status: "parcial",
          description: "Constructora - Busca terrenos para proyectos",
        },
      ],
    },
    {
      name: "❄️ 03_CLIENTES_FRIOS",
      type: "folder",
      icon: <FolderOpen className="w-4 h-4 text-blue-500" />,
      status: "pendiente",
      description: "Clientes con interés a largo plazo (+90 días)",
      children: [
        {
          name: "👤 MARIA_GONZALEZ_INVERSIONISTA",
          type: "folder",
          icon: <Users className="w-4 h-4 text-gray-600" />,
          status: "pendiente",
          description: "Inversionista - Evaluando mercado",
        },
      ],
    },
    {
      name: "📊 04_TEMPLATES_Y_RECURSOS",
      type: "folder",
      icon: <FolderOpen className="w-4 h-4 text-purple-500" />,
      status: "completo",
      description: "Plantillas y recursos compartidos",
      children: [
        {
          name: "Template_FichaCliente_v2.docx",
          type: "file",
          icon: <FileText className="w-4 h-4 text-blue-500" />,
          lastModified: "1 Feb 2024",
          size: "245 KB",
        },
        {
          name: "Checklist_Documentos_Cliente.pdf",
          type: "file",
          icon: <FileText className="w-4 h-4 text-red-500" />,
          lastModified: "1 Feb 2024",
          size: "180 KB",
        },
      ],
    },
  ],
}

const bestPractices = [
  {
    title: "Nomenclatura Consistente",
    description: "Usar convenciones claras y consistentes para nombres de carpetas y archivos",
    example: "🏢 NOMBRE_APELLIDO_EMPRESA_CLIENTE",
    icon: <Settings className="w-5 h-5 text-blue-500" />,
  },
  {
    title: "Clasificación por Temperatura",
    description: "Organizar clientes según su probabilidad de cierre y urgencia",
    example: "🔥 Calientes (0-30 días) | 🎯 Tibios (30-90 días) | ❄️ Fríos (+90 días)",
    icon: <Target className="w-5 h-5 text-orange-500" />,
  },
  {
    title: "Estructura Estandarizada",
    description: "Mantener la misma estructura de subcarpetas para todos los clientes",
    example: "01_FICHA_CLIENTE | 02_PROPIEDADES_INTERES | 03_COMUNICACIONES",
    icon: <FolderOpen className="w-5 h-5 text-green-500" />,
  },
  {
    title: "Versionado de Documentos",
    description: "Incluir fecha y versión en nombres de archivos importantes",
    example: "FichaCliente_NombreCliente_2024-02-08_v2.pdf",
    icon: <FileText className="w-5 h-5 text-purple-500" />,
  },
  {
    title: "Estados Visuales",
    description: "Usar emojis y badges para identificar rápidamente el estado",
    example: "✅ Completo | ⚠️ Parcial | ❌ Pendiente",
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
  },
  {
    title: "Backup y Sincronización",
    description: "Mantener copias de seguridad y sincronización automática",
    example: "Google Drive + Backup local semanal",
    icon: <Download className="w-5 h-5 text-blue-600" />,
  },
]

function FolderOrganizationDemo() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([
      "📁 CLIENTES - NEURALIA INMOBILIARIA",
      "🔥 01_CLIENTES_CALIENTES",
      "🏢 CARLOS_MENDOZA_INVERSIONES_DEL_SUR",
    ]),
  )
  const [selectedTab, setSelectedTab] = useState("structure")

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusConfig = {
      completo: { color: "bg-green-100 text-green-800", text: "Completo" },
      parcial: { color: "bg-yellow-100 text-yellow-800", text: "Parcial" },
      pendiente: { color: "bg-red-100 text-red-800", text: "Pendiente" },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={`${config.color} text-xs`}>{config.text}</Badge>
  }

  const renderFolderTree = (item: FolderStructure, level = 0) => {
    const isExpanded = expandedFolders.has(item.name)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.name} className={`${level > 0 ? "ml-4" : ""}`}>
        <div
          className={`group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${level === 0 ? "bg-blue-50 border border-blue-200" : ""}`}
          onClick={() => hasChildren && toggleFolder(item.name)}
        >
          {hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}

          {item.icon}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium ${level === 0 ? "text-blue-900" : level === 1 ? "text-gray-800" : "text-gray-700"} truncate`}
              >
                {item.name}
              </span>
              {getStatusBadge(item.status)}
            </div>
            {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
            {item.type === "file" && (item.lastModified || item.size) && (
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                {item.lastModified && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.lastModified}
                  </span>
                )}
                {item.size && <span>{item.size}</span>}
              </div>
            )}
          </div>

          {item.type === "file" && (
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{item.children!.map((child) => renderFolderTree(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Etapa 1 - 5 Casos de Éxito Identificados</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Organización Profesional de Carpetas</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Sistema de organización recomendado para los casos de éxito reales identificados en Google Drive
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>5 Casos Reales</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>Mejores Prácticas</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>API Pendiente</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Casos de Éxito Reales Disponibles</span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Juan Navarro ha compartido 5 carpetas de casos de éxito reales que contienen inscripciones, mandatos de
            venta y tasaciones. Los números de rol están contenidos en estos documentos y serán extraídos una vez
            configurada la API de Google Drive.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <strong>Fotos:</strong> 3 carpetas organizadas
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Ubicación:</strong> Archivo KMZ
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Documentos:</strong> Fundo + Órdenes
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Referencias:</strong> PDFs fotográficos
            </div>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-100 bg-transparent"
              onClick={() =>
                window.open(
                  "https://drive.google.com/drive/folders/1JVEAuqfl4slpHDDf5dqtpYSliexrcn0w?usp=drive_link",
                  "_blank",
                )
              }
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Ver Casos de Éxito en Drive
            </Button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Estructura Real: Valdivia 142 has Teresa F...</span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Estructura real identificada: carpetas de fotos organizadas por fecha (fotos, fotos cel, Fotos enero 2024),
            archivos KMZ para ubicación (Campo Iñipulli 140_has.kmz), documentos de fundo comprimidos, órdenes de venta
            en diferentes formatos (.docx y .pdf), y referencias fotográficas. Esta estructura servirá como template
            para organizar futuros casos.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <strong>Fotos:</strong> 3 carpetas organizadas
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Ubicación:</strong> Archivo KMZ
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Documentos:</strong> Fundo + Órdenes
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>Referencias:</strong> PDFs fotográficos
            </div>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-100 bg-transparent"
              onClick={() =>
                window.open(
                  "https://drive.google.com/drive/folders/1JVEAuqfl4slpHDDf5dqtpYSliexrcn0w?usp=drive_link",
                  "_blank",
                )
              }
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Ver Estructura Real en Drive
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Estructura
          </TabsTrigger>
          <TabsTrigger value="practices" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mejores Prácticas
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Folder Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Estructura Jerárquica Recomendada
              </CardTitle>
              <CardDescription>
                Sistema de organización por temperatura de cliente con estructura estandarizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">{renderFolderTree(clientFolderStructure)}</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Zap className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-gray-600">Clientes Calientes</div>
                    <div className="text-xs text-gray-400">De casos reales</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Target className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">2</div>
                    <div className="text-sm text-gray-600">Clientes Tibios</div>
                    <div className="text-xs text-gray-400">De casos reales</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">1</div>
                    <div className="text-sm text-gray-600">Clientes Fríos</div>
                    <div className="text-xs text-gray-400">De casos reales</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-sm text-gray-600">Casos de Éxito</div>
                    <div className="text-xs text-gray-400">Identificados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Best Practices Tab */}
        <TabsContent value="practices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.map((practice, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {practice.icon}
                    {practice.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{practice.description}</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-mono text-gray-700">{practice.example}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Ficha de Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Template estandarizado para recopilar información básica del cliente
                </p>
                <div className="space-y-2 text-xs">
                  <div>• Datos personales y contacto</div>
                  <div>• Información financiera</div>
                  <div>• Preferencias de propiedad</div>
                  <div>• Historial de interacciones</div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Evaluación de Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Plantilla para evaluación técnica y comercial de propiedades
                </p>
                <div className="space-y-2 text-xs">
                  <div>• Características técnicas</div>
                  <div>• Análisis de mercado</div>
                  <div>• Valoración comercial</div>
                  <div>• Recomendaciones</div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                  Checklist Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Lista de verificación de documentos requeridos por tipo de cliente
                </p>
                <div className="space-y-2 text-xs">
                  <div>• Documentos legales</div>
                  <div>• Certificados financieros</div>
                  <div>• Permisos y autorizaciones</div>
                  <div>• Documentos técnicos</div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Convenciones de Nomenclatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Carpetas de Cliente:</h4>
                  <code className="bg-gray-100 p-2 rounded text-sm block">🏢 NOMBRE_APELLIDO_EMPRESA_CLIENTE</code>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Archivos de Documento:</h4>
                  <code className="bg-gray-100 p-2 rounded text-sm block">
                    TipoDocumento_Cliente_Fecha_Version.extension
                  </code>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estados de Carpeta:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-green-100 text-green-800">✅ Completo</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">⚠️ Parcial</Badge>
                    <Badge className="bg-red-100 text-red-800">❌ Pendiente</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FolderOrganizationDemo
