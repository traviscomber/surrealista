"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Building, BookOpen, Archive } from "lucide-react"
import { PARAOrganizer } from "@/lib/para-method/para-organizer"

export default function PARADashboard() {
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const paraOrganizer = useMemo(() => new PARAOrganizer(), [])

  useEffect(() => {
    // Simular carga de datos reales
    const loadData = async () => {
      try {
        // En producción, esto vendría de la API real
        const mockFolders = [
          { name: "CASA_TEMUCO_VENTA_2025", contents: [] },
          { name: "PARCELA_PUCON_PROCESO_ACTIVO", contents: [] },
          { name: "PLANTILLAS_CONTRATOS", contents: [] },
          { name: "DATOS_MERCADO_2024", contents: [] },
          { name: "VENTAS_COMPLETADAS_2023", contents: [] },
        ]

        setFolders(mockFolders)
      } catch (error) {
        console.error("Error loading folders:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const categorizedFolders = useMemo(() => {
    const categories = {
      projects: [],
      areas: [],
      resources: [],
      archive: [],
    }

    folders.forEach((folder) => {
      const classification = paraOrganizer.classifyFolder(folder.name, folder.contents)
      categories[classification.category].push({
        ...folder,
        classification,
      })
    })

    return categories
  }, [folders, paraOrganizer])

  const stats = useMemo(() => {
    return paraOrganizer.getCategoryStats(folders)
  }, [folders, paraOrganizer])

  const categories = paraOrganizer.getCategories()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard PARA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Método PARA</h1>
        <p className="text-gray-600">
          Organización inteligente de carpetas según metodología PARA (Projects, Areas, Resources, Archive)
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-800">Proyectos Activos</CardTitle>
              <Target className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.projects}</div>
            <p className="text-xs text-red-700 mt-1">Con fechas límite definidas</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-800">Áreas de Responsabilidad</CardTitle>
              <Building className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.areas}</div>
            <p className="text-xs text-blue-700 mt-1">Actividades continuas</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-800">Recursos de Referencia</CardTitle>
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.resources}</div>
            <p className="text-xs text-green-700 mt-1">Para consulta futura</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-800">Archivo</CardTitle>
              <Archive className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.archive}</div>
            <p className="text-xs text-gray-700 mt-1">Casos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* PARA Categories Tabs */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Proyectos
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Áreas
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Recursos
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archivo
          </TabsTrigger>
        </TabsList>

        {Object.entries(categories).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryKey === "projects" && <Target className="h-5 w-5 text-red-600" />}
                  {categoryKey === "areas" && <Building className="h-5 w-5 text-blue-600" />}
                  {categoryKey === "resources" && <BookOpen className="h-5 w-5 text-green-600" />}
                  {categoryKey === "archive" && <Archive className="h-5 w-5 text-gray-600" />}
                  {category.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{subcategory.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{subcategory.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Criterios de clasificación:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {subcategory.rules.map((rule, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Show folders in this subcategory */}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Carpetas clasificadas (
                          {categorizedFolders[categoryKey]?.filter(
                            (f) => f.classification.subcategory === subcategory.id,
                          ).length || 0}
                          ):
                        </p>
                        <div className="space-y-2">
                          {categorizedFolders[categoryKey]
                            ?.filter((f) => f.classification.subcategory === subcategory.id)
                            .map((folder) => (
                              <div
                                key={folder.name}
                                className="flex items-center justify-between bg-gray-50 rounded p-2"
                              >
                                <span className="text-sm font-medium">{folder.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {folder.classification.priority}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {folder.classification.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
