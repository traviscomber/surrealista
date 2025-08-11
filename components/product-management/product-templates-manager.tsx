"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Plus, Copy, Edit, Eye, Star, Clock, Users, BarChart3, ImageIcon, Layout, Type } from "lucide-react"

interface Template {
  id: string
  name: string
  category: "brochure" | "presentation" | "proposal" | "report"
  description: string
  version: string
  lastModified: string
  usageCount: number
  rating: number
  tags: string[]
  thumbnail: string
  elements: TemplateElement[]
}

interface TemplateElement {
  id: string
  type: "text" | "image" | "chart" | "table"
  name: string
  reusable: boolean
}

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Brochure Propiedades Premium",
    category: "brochure",
    description: "Plantilla para propiedades de lujo con diseño elegante",
    version: "2.1",
    lastModified: "2024-01-15",
    usageCount: 45,
    rating: 4.8,
    tags: ["lujo", "premium", "propiedades"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    elements: [
      { id: "1", type: "text", name: "Título Principal", reusable: true },
      { id: "2", type: "image", name: "Galería de Fotos", reusable: true },
      { id: "3", type: "text", name: "Descripción Detallada", reusable: false },
    ],
  },
  {
    id: "2",
    name: "Presentación Inversión Turística",
    category: "presentation",
    description: "Presentación para proyectos de inversión en turismo",
    version: "1.5",
    lastModified: "2024-01-12",
    usageCount: 23,
    rating: 4.6,
    tags: ["turismo", "inversión", "presentación"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    elements: [
      { id: "4", type: "chart", name: "Gráfico ROI", reusable: true },
      { id: "5", type: "image", name: "Mapa de Ubicación", reusable: true },
      { id: "6", type: "table", name: "Tabla Financiera", reusable: true },
    ],
  },
  {
    id: "3",
    name: "Propuesta Comercial Estándar",
    category: "proposal",
    description: "Propuesta comercial para clientes corporativos",
    version: "3.0",
    lastModified: "2024-01-10",
    usageCount: 67,
    rating: 4.9,
    tags: ["comercial", "propuesta", "corporativo"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    elements: [
      { id: "7", type: "text", name: "Resumen Ejecutivo", reusable: true },
      { id: "8", type: "chart", name: "Cronograma", reusable: true },
      { id: "9", type: "table", name: "Presupuesto", reusable: false },
    ],
  },
]

export function ProductTemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "brochure":
        return <FileText className="h-4 w-4" />
      case "presentation":
        return <Layout className="h-4 w-4" />
      case "proposal":
        return <Type className="h-4 w-4" />
      case "report":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "brochure":
        return "bg-blue-100 text-blue-800"
      case "presentation":
        return "bg-green-100 text-green-800"
      case "proposal":
        return "bg-purple-100 text-purple-800"
      case "report":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalTemplates = templates.length
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
  const avgRating = templates.reduce((sum, t) => sum + t.rating, 0) / templates.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Producto</h1>
          <p className="text-muted-foreground">Sistema Neuralia - Etapa 2</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elementos Reutilizables</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + t.elements.filter((e) => e.reusable).length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="brochure">Brochures</SelectItem>
                <SelectItem value="presentation">Presentaciones</SelectItem>
                <SelectItem value="proposal">Propuestas</SelectItem>
                <SelectItem value="report">Reportes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge className={`ml-2 ${getCategoryColor(template.category)}`}>
                  {getCategoryIcon(template.category)}
                  <span className="ml-1 capitalize">{template.category}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />v{template.version}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {template.usageCount} usos
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {template.rating}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Elementos ({template.elements.length}):</p>
                <div className="space-y-1">
                  {template.elements.slice(0, 3).map((element) => (
                    <div key={element.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        {element.type === "text" && <Type className="h-3 w-3" />}
                        {element.type === "image" && <ImageIcon className="h-3 w-3" />}
                        {element.type === "chart" && <BarChart3 className="h-3 w-3" />}
                        {element.type === "table" && <Layout className="h-3 w-3" />}
                        {element.name}
                      </span>
                      {element.reusable && (
                        <Badge variant="outline" className="text-xs">
                          Reutilizable
                        </Badge>
                      )}
                    </div>
                  ))}
                  {template.elements.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{template.elements.length - 3} elementos más</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Creation Modal */}
      {isCreating && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-auto">
          <CardHeader>
            <CardTitle>Crear Nueva Plantilla</CardTitle>
            <CardDescription>Define los elementos y configuración de tu nueva plantilla</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input placeholder="Nombre de la plantilla" />
              </div>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brochure">Brochure</SelectItem>
                    <SelectItem value="presentation">Presentación</SelectItem>
                    <SelectItem value="proposal">Propuesta</SelectItem>
                    <SelectItem value="report">Reporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea placeholder="Describe el propósito y uso de esta plantilla" />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <Input placeholder="Separar con comas: lujo, premium, propiedades" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsCreating(false)}>Crear Plantilla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron plantillas con los filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
