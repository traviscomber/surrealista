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
  name: "📁 CLIENTES - SUR-REALISTA",
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
          name: "🏢 VALDIVIA_142_TERESA_F_CASO_EXITO",
          type: "folder",
          icon: <Building className="w-4 h-4 text-green-600" />,
          status: "completo",
          description: "✅ CASO DE ÉXITO - Estructura completa identificada",
          children: [
            {
              name: "📸 fotos",
              type: "folder",
              icon: <ImageIcon className="w-4 h-4 text-green-500" />,
              status: "completo",
              children: [
                {
                  name: "exterior_01.jpg",
                  type: "file",
                  icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
                  lastModified: "12 Ago 2025",
                  size: "2.1 MB",
                },
              ],
            },
            {
              name: "📱 fotos cel",
              type: "folder",
              icon: <ImageIcon className="w-4 h-4 text-green-500" />,
              status: "completo",
            },
            {
              name: "📅 Fotos enero 2024",
              type: "folder",
              icon: <ImageIcon className="w-4 h-4 text-green-500" />,
              status: "completo",
            },
            {
              name: "🗺️ Campo Iñipulli 140_has.kmz",
              type: "file",
              icon: <FileText className="w-4 h-4 text-blue-500" />,
              lastModified: "13 Sep 2023",
              size: "2 KB",
            },
            {
              name: "📄 Fundo Iñipulli_140_110124_compressed.pdf",
              type: "file",
              icon: <FileText className="w-4 h-4 text-red-500" />,
              lastModified: "12 Ene 2024",
              size: "5.1 MB",
            },
            {
              name: "📋 Orden de Venta Iñipulli.docx",
              type: "file",
              icon: <FileText className="w-4 h-4 text-blue-500" />,
              lastModified: "23 Nov 2023",
              size: "38 KB",
            },
          ],
        },
        {
          name: "🏠 FAMILIA_MARTINEZ_CASA_NUEVA",
          type: "folder",
          icon: <Users className="w-4 h-4 text-red-600" />,
          status: "pendiente",
          description: "❌ CARPETA INCOMPLETA - Faltan documentos críticos",
          children: [
            {
              name: "📋 01_FICHA_CLIENTE",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-red-500" />,
              status: "pendiente",
              description: "❌ Falta: Certificado de ingresos, RUT, autorización",
              children: [
                {
                  name: "contacto_inicial.txt",
                  type: "file",
                  icon: <FileText className="w-4 h-4 text-gray-400" />,
                  lastModified: "10 Ago 2025",
                  size: "1 KB",
                },
              ],
            },
            {
              name: "🏠 02_PROPIEDADES_INTERES",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-red-500" />,
              status: "pendiente",
              description: "❌ Falta: Fotos, planos, tasación",
            },
            {
              name: "💬 03_COMUNICACIONES",
              type: "folder",
              icon: <FolderOpen className="w-4 h-4 text-red-500" />,
              status: "pendiente",
              description: "❌ Falta: WhatsApp, emails, llamadas",
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
          name: "EMPRESA_SIN_ORGANIZACION",
          type: "folder",
          icon: <Building className="w-4 h-4 text-red-600" />,
          status: "pendiente",
          description: "❌ MAL ORGANIZADA - Sin estructura estándar",
          children: [
            {
              name: "documentos_varios.zip",
              type: "file",
              icon: <FileText className="w-4 h-4 text-gray-400" />,
              lastModified: "5 Ago 2025",
              size: "12 MB",
            },
            {
              name: "foto1.jpg",
              type: "file",
              icon: <ImageIcon className="w-4 h-4 text-gray-400" />,
              lastModified: "3 Ago 2025",
              size: "3.2 MB",
            },
            {
              name: "notas.txt",
              type: "file",
              icon: <FileText className="w-4 h-4 text-gray-400" />,
              lastModified: "1 Ago 2025",
              size: "500 B",
            },
          ],
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

const newStandardStructure: FolderStructure = {
  name: "📁 ESTRUCTURA_ESTANDAR_SURREALISTA",
  type: "folder",
  icon: <FolderOpen className="w-4 h-4 text-blue-600" />,
  status: "completo",
  description: "Nueva estructura estándar definida en 2da reunión dev",
  children: [
    {
      name: "📸 1_FOTOS",
      type: "folder",
      icon: <ImageIcon className="w-4 h-4 text-green-500" />,
      status: "completo",
      description: "Agrupa fotos campo en subcarpetas con nombre de fecha de creación",
      children: [
        {
          name: "📅 2024-08-15_fotos_campo",
          type: "folder",
          icon: <ImageIcon className="w-4 h-4 text-green-500" />,
          status: "completo",
          children: [
            {
              name: "exterior_01.jpg",
              type: "file",
              icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
              lastModified: "15 Ago 2024",
              size: "2.1 MB",
            },
            {
              name: "interior_cocina.jpg",
              type: "file",
              icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
              lastModified: "15 Ago 2024",
              size: "1.8 MB",
            },
          ],
        },
        {
          name: "🚁 fotos_dron",
          type: "folder",
          icon: <ImageIcon className="w-4 h-4 text-blue-500" />,
          status: "completo",
          description: "Separar fotos dji en su carpeta dron, cel si es img",
        },
        {
          name: "📱 seleccion_jorge",
          type: "folder",
          icon: <ImageIcon className="w-4 h-4 text-orange-500" />,
          status: "completo",
          description: "Crear su carpeta selección qué son las que usa jorge",
        },
      ],
    },
    {
      name: "📄 2_DOCUMENTOS",
      type: "folder",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      status: "completo",
      description: "Crear carpetas organizadas por tipo de documento",
      children: [
        {
          name: "📋 a_Antecedentes_titulo",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-green-500" />,
          status: "completo",
        },
        {
          name: "💰 b_Tasacion_info_campo",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-yellow-500" />,
          status: "completo",
        },
        {
          name: "🏢 c_Documentos_comerciales",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-purple-500" />,
          status: "completo",
        },
      ],
    },
    {
      name: "💬 3_COMUNICACIONES",
      type: "folder",
      icon: <Users className="w-4 h-4 text-orange-500" />,
      status: "completo",
      description: "Gestión de interacciones con compradores y propietarios",
      children: [
        {
          name: "🛒 a_interaccion_compradores",
          type: "folder",
          icon: <Users className="w-4 h-4 text-green-500" />,
          status: "completo",
        },
        {
          name: "🏠 b_interaccion_dueno_contacto",
          type: "folder",
          icon: <Users className="w-4 h-4 text-blue-500" />,
          status: "completo",
        },
        {
          name: "💡 c_sugerencia_clientes",
          type: "folder",
          icon: <Users className="w-4 h-4 text-purple-500" />,
          status: "completo",
          description:
            "Ordenando con esta lógica para todas las comunicaciones wzp, mail, LinkedIn, Instagram, apollo.io",
        },
      ],
    },
    {
      name: "📈 4_MARKETING",
      type: "folder",
      icon: <Target className="w-4 h-4 text-pink-500" />,
      status: "completo",
      description: "Crear carpeta marketing, Video, reel, publicaciones de portales",
      children: [
        {
          name: "🎥 videos_promocionales",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-red-500" />,
          status: "completo",
        },
        {
          name: "📱 reels_instagram",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-purple-500" />,
          status: "completo",
        },
        {
          name: "🌐 publicaciones_portales",
          type: "folder",
          icon: <FileText className="w-4 h-4 text-blue-500" />,
          status: "completo",
        },
      ],
    },
    {
      name: "📋 5_PDF_SUELTO",
      type: "folder",
      icon: <FileText className="w-4 h-4 text-red-500" />,
      status: "completo",
      description:
        "Más de un PDF suelto que es la presentación o las presentaciones que hacen a potenciales compradores. No va en carpeta",
      children: [
        {
          name: "presentacion_propiedad_v1.pdf",
          type: "file",
          icon: <FileText className="w-4 h-4 text-red-500" />,
          lastModified: "16 Ago 2025",
          size: "3.2 MB",
        },
        {
          name: "brochure_comercial.pdf",
          type: "file",
          icon: <FileText className="w-4 h-4 text-red-500" />,
          lastModified: "14 Ago 2025",
          size: "2.8 MB",
        },
      ],
    },
    {
      name: "🗺️ 6_KMZ_SUELTO",
      type: "folder",
      icon: <FileText className="w-4 h-4 text-green-500" />,
      status: "completo",
      description: "Si hay más kmz los abre juntos",
      children: [
        {
          name: "ubicacion_propiedad.kmz",
          type: "file",
          icon: <FileText className="w-4 h-4 text-green-500" />,
          lastModified: "13 Ago 2025",
          size: "15 KB",
        },
        {
          name: "limites_terreno.kmz",
          type: "file",
          icon: <FileText className="w-4 h-4 text-green-500" />,
          lastModified: "13 Ago 2025",
          size: "12 KB",
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

const updatedBestPractices = [
  {
    title: "Estructura de 6 Carpetas Principales",
    description: "Sistema estandarizado definido en 2da reunión dev con nomenclatura específica",
    example: "1_FOTOS | 2_DOCUMENTOS | 3_COMUNICACIONES | 4_MARKETING | 5_PDF_SUELTO | 6_KMZ_SUELTO",
    icon: <Settings className="w-5 h-5 text-blue-500" />,
  },
  {
    title: "Organización de Fotos por Fecha",
    description: "Subcarpetas con nombre de fecha de creación, separación de fotos drone y selección Jorge",
    example: "2024-08-15_fotos_campo | fotos_dron | seleccion_jorge",
    icon: <ImageIcon className="w-5 h-5 text-green-500" />,
  },
  {
    title: "Documentos por Categorías",
    description: "Tres subcategorías específicas con nomenclatura alfabética",
    example: "a_Antecedentes_titulo | b_Tasacion_info_campo | c_Documentos_comerciales",
    icon: <FileText className="w-5 h-5 text-purple-500" />,
  },
  {
    title: "Comunicaciones Estructuradas",
    description: "Organización por tipo de interacción con nomenclatura específica",
    example: "a_interaccion_compradores | b_interaccion_dueno_contacto | c_sugerencia_clientes",
    icon: <Users className="w-5 h-5 text-orange-500" />,
  },
  {
    title: "Marketing y Promoción",
    description: "Carpeta dedicada para videos, reels y publicaciones de portales",
    example: "videos_promocionales | reels_instagram | publicaciones_portales",
    icon: <Target className="w-5 h-5 text-pink-500" />,
  },
  {
    title: "Archivos Sueltos Organizados",
    description: "PDFs de presentación y archivos KMZ en carpetas específicas sin subcarpetas",
    example: "5_PDF_SUELTO (presentaciones) | 6_KMZ_SUELTO (ubicaciones)",
    icon: <FolderOpen className="w-5 h-5 text-green-600" />,
  },
]

function FolderOrganizationDemo() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["📁 CLIENTES - SUR-REALISTA", "🔥 01_CLIENTES_CALIENTES", "🏢 VALDIVIA_142_TERESA_F_CASO_EXITO"]),
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
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
          <Settings className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Nueva Estructura - 2da Reunión Dev</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Estructura Estandarizada Sur-Realista</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Sistema de organización de 6 carpetas principales definido en la segunda reunión de desarrollo
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Nueva Estructura Definida - 2da Reunión Dev</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Lógica de carpetas por campo: Crear 6 carpetas con sus subcarpetas. Sistema estandarizado para organización
            de fotos por fecha, documentos por categorías, comunicaciones estructuradas, marketing dedicado y archivos
            sueltos organizados.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2 rounded border">
              <strong>1_FOTOS:</strong> Por fecha + drone + selección
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>2_DOCUMENTOS:</strong> 3 subcategorías a,b,c
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>3_COMUNICACIONES:</strong> Compradores + dueño + sugerencias
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>4_MARKETING:</strong> Videos + reels + portales
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>5_PDF_SUELTO:</strong> Presentaciones directas
            </div>
            <div className="bg-white p-2 rounded border">
              <strong>6_KMZ_SUELTO:</strong> Archivos ubicación
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="new-structure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="new-structure" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Nueva Estructura
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Comparación
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

        <TabsContent value="new-structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Estructura Estandarizada - 6 Carpetas Principales
              </CardTitle>
              <CardDescription>
                Sistema definido en la 2da reunión dev. Lógica de carpetas por campo con nomenclatura específica y
                subcarpetas organizadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">{renderFolderTree(newStandardStructure)}</div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Reglas de Nomenclatura:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    • <strong>Fotos:</strong> Fecha_fotos_campo, fotos_dron, seleccion_jorge
                  </div>
                  <div>
                    • <strong>Documentos:</strong> Prefijos a_, b_, c_ para orden alfabético
                  </div>
                  <div>
                    • <strong>Comunicaciones:</strong> Por tipo de interacción (compradores, dueño, clientes)
                  </div>
                  <div>
                    • <strong>Marketing:</strong> Videos, reels, publicaciones separadas
                  </div>
                  <div>
                    • <strong>PDFs Sueltos:</strong> Presentaciones directas sin subcarpetas
                  </div>
                  <div>
                    • <strong>KMZ Sueltos:</strong> Archivos de ubicación agrupados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <FolderOpen className="w-5 h-5" />
                  Estructura Anterior (Casos Reales)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>📸 fotos</div>
                  <div>📱 fotos cel</div>
                  <div>📅 Fotos enero 2024</div>
                  <div>🗺️ Campo Iñipulli 140_has.kmz</div>
                  <div>📄 Fundo Iñipulli_140_110124_compressed.pdf</div>
                  <div>📋 Orden de Venta Iñipulli.docx</div>
                </div>
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                  ❌ Sin estructura estandarizada, nombres inconsistentes
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Settings className="w-5 h-5" />
                  Nueva Estructura Estandarizada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>📸 1_FOTOS/2024-08-15_fotos_campo</div>
                  <div>📸 1_FOTOS/fotos_dron</div>
                  <div>📸 1_FOTOS/seleccion_jorge</div>
                  <div>📄 2_DOCUMENTOS/a_Antecedentes_titulo</div>
                  <div>📄 2_DOCUMENTOS/b_Tasacion_info_campo</div>
                  <div>💬 3_COMUNICACIONES/a_interaccion_compradores</div>
                  <div>📋 5_PDF_SUELTO/presentacion_propiedad_v1.pdf</div>
                  <div>🗺️ 6_KMZ_SUELTO/ubicacion_propiedad.kmz</div>
                </div>
                <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
                  ✅ Estructura consistente, fácil navegación, escalable
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updatedBestPractices.map((practice, index) => (
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

        {/* Templates Tab - keeping existing */}
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
