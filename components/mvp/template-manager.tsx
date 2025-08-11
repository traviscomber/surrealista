"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, FileText, Image, Type, Layout, Download, Edit, Copy, Plus, Settings, Eye, Save } from 'lucide-react'

interface Template {
  id: string
  name: string
  category: 'brochure' | 'flyer' | 'presentation' | 'contract'
  description: string
  thumbnail: string
  lastModified: string
  status: 'active' | 'draft' | 'archived'
  elements: {
    colors: string[]
    fonts: string[]
    components: string[]
  }
}

interface DesignElement {
  id: string
  name: string
  type: 'color' | 'font' | 'component' | 'icon'
  value: string
  category: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [designElements, setDesignElements] = useState<DesignElement[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [activeTab, setActiveTab] = useState("templates")

  useEffect(() => {
    loadTemplates()
    loadDesignElements()
  }, [])

  const loadTemplates = async () => {
    // Mock data for demonstration
    const mockTemplates: Template[] = [
      {
        id: "1",
        name: "Brochure Propiedades Premium",
        category: "brochure",
        description: "Plantilla profesional para propiedades de alto valor",
        thumbnail: "/placeholder.svg?height=200&width=300&text=Brochure+Premium",
        lastModified: "2024-01-15",
        status: "active",
        elements: {
          colors: ["#1e40af", "#059669", "#dc2626"],
          fonts: ["Inter", "Playfair Display"],
          components: ["header", "gallery", "specs", "contact"]
        }
      },
      {
        id: "2",
        name: "Flyer Promocional",
        category: "flyer",
        description: "Diseño llamativo para promociones especiales",
        thumbnail: "/placeholder.svg?height=200&width=300&text=Flyer+Promocional",
        lastModified: "2024-01-14",
        status: "active",
        elements: {
          colors: ["#7c3aed", "#f59e0b", "#ef4444"],
          fonts: ["Roboto", "Montserrat"],
          components: ["banner", "offer", "cta", "footer"]
        }
      },
      {
        id: "3",
        name: "Presentación Ejecutiva",
        category: "presentation",
        description: "Plantilla para presentaciones a inversionistas",
        thumbnail: "/placeholder.svg?height=200&width=300&text=Presentacion+Ejecutiva",
        lastModified: "2024-01-13",
        status: "draft",
        elements: {
          colors: ["#374151", "#6366f1", "#10b981"],
          fonts: ["Source Sans Pro", "Merriweather"],
          components: ["title", "charts", "timeline", "summary"]
        }
      }
    ]
    
    setTemplates(mockTemplates)
  }

  const loadDesignElements = async () => {
    const mockElements: DesignElement[] = [
      // Colors
      { id: "c1", name: "Azul Corporativo", type: "color", value: "#1e40af", category: "primary" },
      { id: "c2", name: "Verde Éxito", type: "color", value: "#059669", category: "accent" },
      { id: "c3", name: "Rojo Alerta", type: "color", value: "#dc2626", category: "accent" },
      { id: "c4", name: "Gris Neutro", type: "color", value: "#6b7280", category: "neutral" },
      
      // Fonts
      { id: "f1", name: "Inter", type: "font", value: "Inter, sans-serif", category: "body" },
      { id: "f2", name: "Playfair Display", type: "font", value: "Playfair Display, serif", category: "heading" },
      { id: "f3", name: "Roboto", type: "font", value: "Roboto, sans-serif", category: "body" },
      
      // Components
      { id: "comp1", name: "Header Principal", type: "component", value: "header-main", category: "layout" },
      { id: "comp2", name: "Galería de Imágenes", type: "component", value: "image-gallery", category: "content" },
      { id: "comp3", name: "Especificaciones", type: "component", value: "specs-table", category: "content" },
      { id: "comp4", name: "Información de Contacto", type: "component", value: "contact-info", category: "footer" }
    ]
    
    setDesignElements(mockElements)
  }

  const createNewTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: "Nueva Plantilla",
      category: "brochure",
      description: "Descripción de la nueva plantilla",
      thumbnail: "/placeholder.svg?height=200&width=300&text=Nueva+Plantilla",
      lastModified: new Date().toISOString().split('T')[0],
      status: "draft",
      elements: {
        colors: [],
        fonts: [],
        components: []
      }
    }
    
    setTemplates(prev => [newTemplate, ...prev])
    setSelectedTemplate(newTemplate)
    setEditingTemplate(true)
  }

  const duplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copia)`,
      status: "draft",
      lastModified: new Date().toISOString().split('T')[0]
    }
    
    setTemplates(prev => [duplicated, ...prev])
  }

  const saveTemplate = (template: Template) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
    setEditingTemplate(false)
  }

  const getCategoryBadge = (category: Template['category']) => {
    const categoryConfig = {
      brochure: { color: "bg-blue-100 text-blue-800", text: "Brochure" },
      flyer: { color: "bg-green-100 text-green-800", text: "Flyer" },
      presentation: { color: "bg-purple-100 text-purple-800", text: "Presentación" },
      contract: { color: "bg-orange-100 text-orange-800", text: "Contrato" }
    }
    
    const config = categoryConfig[category]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getStatusBadge = (status: Template['status']) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", text: "Activa" },
      draft: { color: "bg-yellow-100 text-yellow-800", text: "Borrador" },
      archived: { color: "bg-gray-100 text-gray-800", text: "Archivada" }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="elements">Elementos de Diseño</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Plantillas de Material
                  </CardTitle>
                  <CardDescription>
                    Gestiona las plantillas profesionales para materiales de producto
                  </CardDescription>
                </div>
                <Button onClick={createNewTemplate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img 
                        src={template.thumbnail || "/placeholder.svg"} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getCategoryBadge(template.category)}
                          {getStatusBadge(template.status)}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Modificado: {template.lastModified}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Vista Previa
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => duplicateTemplate(template)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Elements Tab */}
        <TabsContent value="elements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Biblioteca de Elementos de Diseño
              </CardTitle>
              <CardDescription>
                Gestiona colores, tipografías y componentes reutilizables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="colors" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="colors">Colores</TabsTrigger>
                  <TabsTrigger value="fonts">Tipografías</TabsTrigger>
                  <TabsTrigger value="components">Componentes</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {designElements.filter(e => e.type === 'color').map((color) => (
                      <div key={color.id} className="border rounded-lg p-3">
                        <div 
                          className="w-full h-16 rounded mb-2"
                          style={{ backgroundColor: color.value }}
                        ></div>
                        <div className="text-sm font-medium">{color.name}</div>
                        <div className="text-xs text-gray-600">{color.value}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {color.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="fonts" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {designElements.filter(e => e.type === 'font').map((font) => (
                      <div key={font.id} className="border rounded-lg p-4">
                        <div className="text-lg font-medium mb-2" style={{ fontFamily: font.value }}>
                          {font.name}
                        </div>
                        <div className="text-sm text-gray-600 mb-2" style={{ fontFamily: font.value }}>
                          The quick brown fox jumps over the lazy dog
                        </div>
                        <div className="text-xs text-gray-500">{font.value}</div>
                        <Badge variant="outline" className="text-xs mt-2">
                          {font.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="components" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {designElements.filter(e => e.type === 'component').map((component) => (
                      <div key={component.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Layout className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{component.name}</div>
                            <div className="text-sm text-gray-600">{component.value}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {component.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Sistema de Plantillas
              </CardTitle>
              <CardDescription>
                Configura las especificaciones técnicas y requisitos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Software Requirements */}
                <div>
                  <h4 className="font-medium mb-3">Requisitos del Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="base-software">Software Base</Label>
                        <Input 
                          id="base-software" 
                          defaultValue="Adobe InDesign/Microsoft Publisher"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="output-format">Formato de Salida</Label>
                        <Input 
                          id="output-format" 
                          defaultValue="PDF interactivo/HTML"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="compatibility">Compatibilidad</Label>
                        <Input 
                          id="compatibility" 
                          defaultValue="Multi-dispositivo (PC, móvil, tablet)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="storage">Almacenamiento</Label>
                        <Input 
                          id="storage" 
                          defaultValue="Integrado con Google Drive"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Version Control */}
                <div>
                  <h4 className="font-medium mb-3">Control de Versiones</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="version-history" defaultChecked />
                      <Label htmlFor="version-history">Historial de modificaciones</Label>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="auto-backup" defaultChecked />
                      <Label htmlFor="auto-backup">Respaldo automático</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="collaborative-editing" />
                      <Label htmlFor="collaborative-editing">Edición colaborativa</Label>
                    </div>
                  </div>
                </div>

                {/* Design System */}
                <div>
                  <h4 className="font-medium mb-3">Sistema de Diseño</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="text-sm">Biblioteca de componentes gráficos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="text-sm">Paleta de colores corporativos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        <span className="text-sm">Conjunto de tipografías autorizadas</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        <span className="text-sm">Marcos y estilos para imágenes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        <span className="text-sm">Sistema de iconografía coherente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        <span className="text-sm">Diseños responsivos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Objetivo:</strong> Permitir a usuarios sin conocimientos avanzados de diseño 
                    crear materiales profesionales que mantengan la coherencia de marca.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
