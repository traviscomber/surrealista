"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  AlertCircle,
  Database,
  Upload,
  BarChart3,
  ImageIcon,
  FileText,
  Download,
  TestTube,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

interface TestResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

interface DatabaseStats {
  totalProperties: number
  propertiesWithImages: number
  totalImages: number
  averageImagesPerProperty: number
  regionsCount: number
  waterRightsCount: number
}

export default function TestOrganizadorPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [testing, setTesting] = useState(false)
  const [sampleData, setSampleData] = useState<any[]>([])

  useEffect(() => {
    loadDatabaseStats()
  }, [])

  const loadDatabaseStats = async () => {
    try {
      // Get total properties with correct column names
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id, region, derechos_de_agua")

      if (propError) throw propError

      // Get properties with images using the view
      const { data: propertiesWithImages, error: imgError } = await supabase
        .from("properties_with_images")
        .select("id, total_images")

      if (imgError) {
        // Fallback: try to get properties with images directly
        const { data: fallbackData, error: fallbackError } = await supabase.from("properties").select(`
            id,
            property_images (id)
          `)

        if (fallbackError) throw fallbackError

        // Count properties that have images
        const propertiesWithImagesCount =
          fallbackData?.filter((p) => p.property_images && p.property_images.length > 0).length || 0

        setDbStats({
          totalProperties: properties?.length || 0,
          propertiesWithImages: propertiesWithImagesCount,
          totalImages: 0,
          averageImagesPerProperty: 0,
          regionsCount: new Set(properties?.map((p) => p.region).filter(Boolean)).size,
          waterRightsCount: properties?.filter((p) => p.derechos_de_agua === "si").length || 0,
        })
        return
      }

      // Get total images
      const { data: images, error: imagesError } = await supabase.from("property_images").select("id")

      if (imagesError) {
        console.warn("Could not load images:", imagesError)
        // Continue without image data
      }

      const totalProperties = properties?.length || 0
      const propertiesWithImagesCount = propertiesWithImages?.filter((p) => p.total_images > 0).length || 0
      const totalImages = images?.length || 0
      const averageImagesPerProperty = totalProperties > 0 ? Math.round((totalImages / totalProperties) * 10) / 10 : 0
      const regionsCount = new Set(properties?.map((p) => p.region).filter(Boolean)).size
      const waterRightsCount = properties?.filter((p) => p.derechos_de_agua === "si").length || 0

      setDbStats({
        totalProperties,
        propertiesWithImages: propertiesWithImagesCount,
        totalImages,
        averageImagesPerProperty,
        regionsCount,
        waterRightsCount,
      })
    } catch (error) {
      console.error("Error loading database stats:", error)
      // Set default stats to prevent UI errors
      setDbStats({
        totalProperties: 0,
        propertiesWithImages: 0,
        totalImages: 0,
        averageImagesPerProperty: 0,
        regionsCount: 0,
        waterRightsCount: 0,
      })
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    const results: TestResult[] = []

    try {
      // Test 1: Database Schema
      results.push(await testDatabaseSchema())

      // Test 2: Property Images Relationship
      results.push(await testPropertyImagesRelationship())

      // Test 3: Views and Functions
      results.push(await testViewsAndFunctions())

      // Test 4: Sample Data
      results.push(await testSampleData())

      // Test 5: Import System
      results.push(await testImportSystem())
    } catch (error) {
      results.push({
        test: "General Test Error",
        status: "error",
        message: `Error running tests: ${error}`,
      })
    }

    setTestResults(results)
    setTesting(false)
  }

  const testDatabaseSchema = async (): Promise<TestResult> => {
    try {
      // Test if properties table has the expected columns
      const { data: propertiesData, error: propError } = await supabase
        .from("properties")
        .select("id, title, region, derechos_de_agua, nombre_contacto")
        .limit(1)

      if (propError) {
        return {
          test: "Database Schema - Properties",
          status: "error",
          message: "Properties table not found or has incorrect structure",
          details: propError,
        }
      }

      // Test if property_images table exists
      const { data: imagesData, error: imgError } = await supabase
        .from("property_images")
        .select("id, property_id, image_url, is_primary, display_order")
        .limit(1)

      if (imgError) {
        return {
          test: "Database Schema - Images",
          status: "warning",
          message: "Property images table not found - this is expected if not yet created",
          details: imgError,
        }
      }

      return {
        test: "Database Schema",
        status: "success",
        message: "Both properties and property_images tables exist with correct structure",
      }
    } catch (error) {
      return {
        test: "Database Schema",
        status: "error",
        message: `Schema test failed: ${error}`,
      }
    }
  }

  const testPropertyImagesRelationship = async (): Promise<TestResult> => {
    try {
      // Test foreign key relationship
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          title,
          property_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .limit(5)

      if (error) {
        return {
          test: "Property-Images Relationship",
          status: "warning",
          message: "Property-images relationship not available - images table may not exist yet",
          details: error,
        }
      }

      const propertiesWithImages = data?.filter((p) => p.property_images && p.property_images.length > 0) || []

      return {
        test: "Property-Images Relationship",
        status: propertiesWithImages.length > 0 ? "success" : "warning",
        message: `Found ${propertiesWithImages.length} properties with images out of ${data?.length || 0} tested`,
        details: propertiesWithImages,
      }
    } catch (error) {
      return {
        test: "Property-Images Relationship",
        status: "warning",
        message: `Relationship test failed - this is expected if images table doesn't exist: ${error}`,
      }
    }
  }

  const testViewsAndFunctions = async (): Promise<TestResult> => {
    try {
      // Test properties_with_images view
      const { data: viewData, error: viewError } = await supabase
        .from("properties_with_images")
        .select("id, title, primary_image_url, total_images")
        .limit(3)

      if (viewError) {
        return {
          test: "Views and Functions",
          status: "warning",
          message: "Properties with images view not available - this is expected if not yet created",
          details: viewError,
        }
      }

      // Test property_images_summary view
      const { data: summaryData, error: summaryError } = await supabase
        .from("property_images_summary")
        .select("property_id, property_title, total_images, primary_images")
        .limit(3)

      if (summaryError) {
        return {
          test: "Views and Functions",
          status: "warning",
          message: "Main view works, but summary view has issues - this is expected if not yet created",
          details: summaryError,
        }
      }

      return {
        test: "Views and Functions",
        status: "success",
        message: `Views working correctly. Found ${viewData?.length || 0} properties in main view, ${summaryData?.length || 0} in summary`,
        details: { viewData, summaryData },
      }
    } catch (error) {
      return {
        test: "Views and Functions",
        status: "warning",
        message: `Views test failed - this is expected if views don't exist yet: ${error}`,
      }
    }
  }

  const testSampleData = async (): Promise<TestResult> => {
    try {
      // Get sample properties with basic data
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, region, derechos_de_agua, data_quality_score")
        .limit(5)

      if (error) {
        return {
          test: "Sample Data",
          status: "error",
          message: "Failed to load sample data",
          details: error,
        }
      }

      setSampleData(data || [])

      return {
        test: "Sample Data",
        status: data && data.length > 0 ? "success" : "warning",
        message: `Found ${data?.length || 0} properties in the database`,
        details: data,
      }
    } catch (error) {
      return {
        test: "Sample Data",
        status: "error",
        message: `Sample data test failed: ${error}`,
      }
    }
  }

  const testImportSystem = async (): Promise<TestResult> => {
    try {
      // Test if we can access the Google Sheets parser
      const { GoogleSheetsParser } = await import("@/lib/data-management/google-sheets-parser")

      // Test template generation
      const template = GoogleSheetsParser.generateTemplate()

      if (!template || !template.includes("Nombre Campo")) {
        return {
          test: "Import System",
          status: "error",
          message: "Google Sheets parser template generation failed",
        }
      }

      // Test CSV parsing with sample data
      const sampleCSV = `Nombre Campo,Nombre Contacto,Telefono contacto,correo contacto,Rol,derechos de agua,dueño,Region
Test Property,Juan Test,+56912345678,test@email.com,123-45,si,Juan Test Owner,Metropolitana`

      const parsed = GoogleSheetsParser.parseCSV(sampleCSV)

      if (!parsed || parsed.length === 0) {
        return {
          test: "Import System",
          status: "error",
          message: "CSV parsing failed",
        }
      }

      return {
        test: "Import System",
        status: "success",
        message: `Import system working. Parsed ${parsed.length} test properties with ${parsed[0].validation_errors.length} validation errors`,
        details: parsed[0],
      }
    } catch (error) {
      return {
        test: "Import System",
        status: "error",
        message: `Import system test failed: ${error}`,
      }
    }
  }

  const generateTestCSV = () => {
    const testData = `Nombre Campo,Nombre Contacto,Telefono contacto,correo contacto,Rol,derechos de agua,dueño,Region
Fundo Los Aromos,María González,+56987654321,maria.gonzalez@email.com,456-78,si,María González Silva,Los Ríos
Casa Vista Mar,Pedro Martínez,+56912345678,pedro.martinez@email.com,789-12,no,Pedro Martínez López,Valparaíso
Terreno Industrial,Ana López,+56998877665,ana.lopez@email.com,321-54,si,Ana López Rodríguez,Metropolitana`

    const blob = new Blob([testData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "datos-prueba-organizador.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test del Sistema Organizador de Datos</h1>
        <p className="text-gray-600 text-lg">
          Pruebas completas del sistema de importación y organización de datos desde Google Drive
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tests">Pruebas</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="actions">Acciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Database Statistics */}
          {dbStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.totalProperties}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ImageIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Con Imágenes</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.propertiesWithImages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Imágenes</p>
                      <p className="text-2xl font-bold text-gray-900">{dbStats.totalImages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              {dbStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{dbStats.averageImagesPerProperty}</div>
                    <div className="text-sm text-gray-600">Imágenes por propiedad</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{dbStats.regionsCount}</div>
                    <div className="text-sm text-gray-600">Regiones</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{dbStats.waterRightsCount}</div>
                    <div className="text-sm text-gray-600">Con derechos de agua</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {dbStats.totalProperties > 0
                        ? Math.round((dbStats.propertiesWithImages / dbStats.totalProperties) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Con imágenes</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando estadísticas...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Links */}
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>Enlaces directos a las funcionalidades del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/organizador-datos">
                  <Button className="w-full flex items-center gap-2 bg-transparent" variant="outline">
                    <Upload className="h-4 w-4" />
                    Sistema Organizador de Datos
                  </Button>
                </Link>
                <Link href="/admin/propiedades">
                  <Button className="w-full flex items-center gap-2 bg-transparent" variant="outline">
                    <Database className="h-4 w-4" />
                    Gestión de Propiedades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Pruebas del Sistema
              </CardTitle>
              <CardDescription>Ejecuta pruebas completas para verificar el funcionamiento del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={runAllTests} disabled={testing} className="flex items-center gap-2">
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Ejecutando pruebas...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Ejecutar Todas las Pruebas
                    </>
                  )}
                </Button>

                {testResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Resultados de las Pruebas:</h4>
                    {testResults.map((result, index) => (
                      <Alert key={index} className={getStatusColor(result.status)}>
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <h5 className="font-medium">{result.test}</h5>
                            <p className="text-sm mt-1">{result.message}</p>
                            {result.details && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-gray-600">Ver detalles</summary>
                                <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de Muestra</CardTitle>
              <CardDescription>Propiedades cargadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {sampleData.length > 0 ? (
                <div className="space-y-4">
                  {sampleData.map((property, index) => (
                    <div key={property.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{property.title || `Propiedad ${index + 1}`}</h4>
                        <Badge className="bg-blue-100 text-blue-800">{property.data_quality_score || 0}% calidad</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Región: {property.region || "N/A"}</div>
                        <div>Derechos de agua: {property.derechos_de_agua === "si" ? "Sí" : "No"}</div>
                        <div>ID: {property.id}</div>
                        <div>Calidad: {property.data_quality_score || 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay datos de muestra disponibles</p>
                  <Button onClick={runAllTests} className="mt-4">
                    Cargar Datos de Muestra
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Prueba</CardTitle>
              <CardDescription>Herramientas para probar el sistema de importación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={generateTestCSV}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    Descargar CSV de Prueba
                  </Button>

                  <Link href="/admin/organizador-datos">
                    <Button className="w-full flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Ir al Organizador
                    </Button>
                  </Link>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pasos para probar:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Descarga el CSV de prueba</li>
                      <li>Ve al Organizador de Datos</li>
                      <li>Sube el archivo CSV en la pestaña "Importar Datos"</li>
                      <li>Revisa la vista previa y calidad de datos</li>
                      <li>Importa las propiedades válidas</li>
                      <li>Ve a "Organizar Datos" para filtrar y exportar</li>
                    </ol>
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
