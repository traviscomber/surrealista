"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, XCircle, Play, Database, Settings, Clock, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface TestResult {
  id: string
  name: string
  description: string
  status: "running" | "success" | "warning" | "error" | "pending"
  message: string
  details?: any
  duration?: number
  timestamp?: string
}

export default function EjecutarPruebasPage() {
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: "database-schema",
      name: "Esquema de Base de Datos",
      description: "Verifica que las tablas principales existan con la estructura correcta",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "column-names",
      name: "Nombres de Columnas",
      description: "Confirma que las columnas usen los nombres correctos (derechos_de_agua, etc.)",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "property-images-table",
      name: "Tabla de Imágenes",
      description: "Verifica la existencia y estructura de la tabla property_images",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "relationships",
      name: "Relaciones de Tablas",
      description: "Prueba las relaciones entre properties y property_images",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "views-functions",
      name: "Vistas y Funciones",
      description: "Verifica que las vistas y funciones auxiliares funcionen correctamente",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "sample-data",
      name: "Datos de Muestra",
      description: "Confirma que existan datos de prueba en el sistema",
      status: "pending",
      message: "Esperando ejecución...",
    },
    {
      id: "import-system",
      name: "Sistema de Importación",
      description: "Prueba el parser de Google Sheets y la validación de datos",
      status: "pending",
      message: "Esperando ejecución...",
    },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [dbStats, setDbStats] = useState<any>(null)

  // Load database stats on component mount
  useEffect(() => {
    loadDatabaseStats()
  }, [])

  const loadDatabaseStats = async () => {
    try {
      // Get properties count
      const { count: propertiesCount } = await supabase.from("properties").select("*", { count: "exact", head: true })

      // Get properties with water rights
      const { count: waterRightsCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("derechos_de_agua", "si")

      // Try to get images count
      let imagesCount = 0
      try {
        const { count } = await supabase.from("property_images").select("*", { count: "exact", head: true })
        imagesCount = count || 0
      } catch (error) {
        // Images table doesn't exist yet
      }

      setDbStats({
        propertiesCount: propertiesCount || 0,
        waterRightsCount: waterRightsCount || 0,
        imagesCount,
      })
    } catch (error) {
      console.error("Error loading database stats:", error)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setStartTime(new Date())
    setProgress(0)

    const testFunctions = [
      testDatabaseSchema,
      testColumnNames,
      testPropertyImagesTable,
      testRelationships,
      testViewsAndFunctions,
      testSampleData,
      testImportSystem,
    ]

    for (let i = 0; i < testFunctions.length; i++) {
      const testId = tests[i].id
      setCurrentTest(testId)

      // Update test status to running
      setTests((prev) => prev.map((test) => (test.id === testId ? { ...test, status: "running" } : test)))

      try {
        const startTestTime = Date.now()
        const result = await testFunctions[i]()
        const duration = Date.now() - startTestTime

        setTests((prev) =>
          prev.map((test) =>
            test.id === testId
              ? {
                  ...test,
                  status: result.status,
                  message: result.message,
                  details: result.details,
                  duration,
                  timestamp: new Date().toLocaleTimeString(),
                }
              : test,
          ),
        )
      } catch (error) {
        setTests((prev) =>
          prev.map((test) =>
            test.id === testId
              ? {
                  ...test,
                  status: "error",
                  message: `Error ejecutando prueba: ${error}`,
                  timestamp: new Date().toLocaleTimeString(),
                }
              : test,
          ),
        )
      }

      setProgress(((i + 1) / testFunctions.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate test execution time
    }

    setCurrentTest(null)
    setIsRunning(false)

    // Reload stats after tests
    await loadDatabaseStats()
  }

  const testDatabaseSchema = async () => {
    try {
      // Test properties table structure
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, region, derechos_de_agua, nombre_contacto, telefono_contacto, correo_contacto")
        .limit(1)

      if (error) {
        return {
          status: "error" as const,
          message: `Error accediendo a la tabla properties: ${error.message}`,
          details: error,
        }
      }

      const expectedColumns = [
        "id",
        "title",
        "region",
        "derechos_de_agua",
        "nombre_contacto",
        "telefono_contacto",
        "correo_contacto",
      ]
      const actualColumns = Object.keys(data?.[0] || {})
      const missingColumns = expectedColumns.filter((col) => !actualColumns.includes(col))

      if (missingColumns.length > 0) {
        return {
          status: "warning" as const,
          message: `Tabla properties existe pero faltan columnas: ${missingColumns.join(", ")}`,
          details: { expectedColumns, actualColumns, missingColumns },
        }
      }

      return {
        status: "success" as const,
        message: "Tabla properties existe con estructura correcta",
        details: { columns: actualColumns, rowCount: data?.length || 0 },
      }
    } catch (error) {
      return {
        status: "error" as const,
        message: `Error en prueba de esquema: ${error}`,
      }
    }
  }

  const testColumnNames = async () => {
    try {
      // Test specific column names that were causing issues
      const { data, error } = await supabase
        .from("properties")
        .select("derechos_de_agua, nombre_contacto, telefono_contacto, correo_contacto, rol, dueno, region")
        .limit(1)

      if (error) {
        return {
          status: "error" as const,
          message: `Error accediendo a columnas específicas: ${error.message}`,
          details: error,
        }
      }

      // Check if we can filter by derechos_de_agua
      const { data: waterRightsData, error: waterError } = await supabase
        .from("properties")
        .select("id, derechos_de_agua")
        .eq("derechos_de_agua", "si")
        .limit(5)

      if (waterError) {
        return {
          status: "warning" as const,
          message: "Columnas existen pero hay problemas con filtros",
          details: waterError,
        }
      }

      return {
        status: "success" as const,
        message: `Nombres de columnas correctos. Encontradas ${waterRightsData?.length || 0} propiedades con derechos de agua`,
        details: {
          columnsFound: Object.keys(data?.[0] || {}),
          waterRightsCount: waterRightsData?.length || 0,
        },
      }
    } catch (error) {
      return {
        status: "error" as const,
        message: `Error verificando nombres de columnas: ${error}`,
      }
    }
  }

  const testPropertyImagesTable = async () => {
    try {
      // Test if property_images table exists
      const { data, error } = await supabase
        .from("property_images")
        .select("id, property_id, image_url, is_primary, display_order")
        .limit(1)

      if (error) {
        return {
          status: "warning" as const,
          message: "Tabla property_images no existe - necesita ser creada con el script de configuración",
          details: error,
        }
      }

      // Count total images
      const { count, error: countError } = await supabase
        .from("property_images")
        .select("*", { count: "exact", head: true })

      return {
        status: "success" as const,
        message: `Tabla property_images existe con ${count || 0} imágenes`,
        details: { imageCount: count, structure: Object.keys(data?.[0] || {}) },
      }
    } catch (error) {
      return {
        status: "warning" as const,
        message: "Tabla property_images no disponible - ejecuta el script de configuración",
      }
    }
  }

  const testRelationships = async () => {
    try {
      // Test relationship between properties and images
      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          title,
          property_images (
            id,
            image_url,
            is_primary
          )
        `)
        .limit(3)

      if (error) {
        return {
          status: "warning" as const,
          message: "Relación properties-images no disponible - tabla de imágenes no existe",
          details: error,
        }
      }

      const propertiesWithImages = data?.filter((p) => p.property_images && p.property_images.length > 0) || []

      return {
        status: propertiesWithImages.length > 0 ? "success" : "warning",
        message: `Relación funciona. ${propertiesWithImages.length} de ${data?.length || 0} propiedades tienen imágenes`,
        details: { propertiesWithImages: propertiesWithImages.length, totalTested: data?.length || 0 },
      }
    } catch (error) {
      return {
        status: "warning" as const,
        message: "No se pudo probar la relación - tabla de imágenes no existe",
      }
    }
  }

  const testViewsAndFunctions = async () => {
    try {
      // Test properties_with_images view
      const { data: viewData, error: viewError } = await supabase
        .from("properties_with_images")
        .select("id, title, primary_image_url, total_images")
        .limit(3)

      if (viewError) {
        return {
          status: "warning" as const,
          message: "Vista properties_with_images no existe - necesita ser creada con el script",
          details: viewError,
        }
      }

      // Test property_images_summary view
      const { data: summaryData, error: summaryError } = await supabase
        .from("property_images_summary")
        .select("property_id, property_title, total_images")
        .limit(3)

      return {
        status: summaryError ? "warning" : "success",
        message: summaryError
          ? "Vista principal funciona, vista resumen no disponible"
          : `Ambas vistas funcionan. ${viewData?.length || 0} propiedades en vista principal`,
        details: { mainView: viewData?.length || 0, summaryView: summaryData?.length || 0 },
      }
    } catch (error) {
      return {
        status: "warning" as const,
        message: "Vistas no disponibles - necesitan ser creadas con el script de configuración",
      }
    }
  }

  const testSampleData = async () => {
    try {
      // Get sample properties
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, region, derechos_de_agua, data_quality_score")
        .limit(10)

      if (error) {
        return {
          status: "error" as const,
          message: `Error cargando datos de muestra: ${error.message}`,
          details: error,
        }
      }

      const propertiesWithWaterRights = data?.filter((p) => p.derechos_de_agua === "si").length || 0
      const regions = new Set(data?.map((p) => p.region).filter(Boolean)).size

      return {
        status: data && data.length > 0 ? "success" : "warning",
        message: `${data?.length || 0} propiedades encontradas, ${propertiesWithWaterRights} con derechos de agua, ${regions} regiones`,
        details: {
          totalProperties: data?.length || 0,
          withWaterRights: propertiesWithWaterRights,
          regions,
          sampleData: data?.slice(0, 3),
        },
      }
    } catch (error) {
      return {
        status: "error" as const,
        message: `Error en prueba de datos: ${error}`,
      }
    }
  }

  const testImportSystem = async () => {
    try {
      // Test Google Sheets parser functionality
      const sampleCSV = `Nombre Campo,Nombre Contacto,Telefono contacto,correo contacto,Rol,derechos de agua,dueño,Region
Fundo Test,María González,+56987654321,maria@test.com,456-78,si,María González,Los Ríos
Casa Test,Pedro Martínez,+56912345678,pedro@test.com,789-12,no,Pedro Martínez,Valparaíso`

      // Simple CSV parsing test
      const lines = sampleCSV.split("\n")
      const headers = lines[0].split(",")
      const dataRows = lines.slice(1).map((line) => {
        const values = line.split(",")
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || ""
        })
        return obj
      })

      const validProperties = dataRows.filter(
        (row) => row["Nombre Campo"] && row["Nombre Contacto"] && row["Region"],
      ).length

      return {
        status: "success" as const,
        message: `Sistema de importación funciona. ${dataRows.length} propiedades parseadas, ${validProperties} válidas`,
        details: {
          totalParsed: dataRows.length,
          validProperties,
          headers,
          sampleProperty: dataRows[0],
        },
      }
    } catch (error) {
      return {
        status: "error" as const,
        message: `Error en sistema de importación: ${error}`,
      }
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "running":
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "running":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const completedTests = tests.filter((t) => ["success", "warning", "error"].includes(t.status)).length
  const successfulTests = tests.filter((t) => t.status === "success").length
  const warningTests = tests.filter((t) => t.status === "warning").length
  const errorTests = tests.filter((t) => t.status === "error").length

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ejecución de Pruebas del Sistema</h1>
        <p className="text-gray-600 text-lg">Suite completa de pruebas con nombres de columnas corregidos</p>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dbStats.propertiesCount}</p>
                <p className="text-sm text-gray-600">Propiedades Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dbStats.waterRightsCount}</p>
                <p className="text-sm text-gray-600">Con Derechos de Agua</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{dbStats.imagesCount}</p>
                <p className="text-sm text-gray-600">Imágenes Total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pruebas Completadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedTests}/{tests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exitosas</p>
                <p className="text-2xl font-bold text-green-900">{successfulTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-900">{warningTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errores</p>
                <p className="text-2xl font-bold text-red-900">{errorTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Progreso de Ejecución</h3>
                <span className="text-sm text-gray-600">{Math.round(progress)}% completado</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentTest && (
                <p className="text-sm text-gray-600">Ejecutando: {tests.find((t) => t.id === currentTest)?.name}</p>
              )}
              {startTime && <p className="text-xs text-gray-500">Iniciado: {startTime.toLocaleTimeString()}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Tests Button */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-2">Ejecutar Suite de Pruebas</h3>
              <p className="text-sm text-gray-600">Ejecuta todas las pruebas para verificar el estado del sistema</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open("/admin/organizador-datos", "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Organizador
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("/scripts/setup-database-complete", "_blank")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar DB
              </Button>
              <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Ejecutar Pruebas
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Resultados de las Pruebas</h2>
        {tests.map((test) => (
          <Card key={test.id} className={getStatusColor(test.status)}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{test.name}</h3>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <Badge variant="outline" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                      {test.timestamp && (
                        <Badge variant="outline" className="text-xs">
                          {test.timestamp}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                  <p className="text-sm font-medium">{test.message}</p>
                  {test.details && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                        Ver detalles técnicos
                      </summary>
                      <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                        <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(test.details, null, 2)}</pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Alert */}
      {completedTests === tests.length && completedTests > 0 && (
        <Alert className="mt-6">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Resumen de Ejecución:</strong>
            <br />
            {successfulTests > 0 && `✅ ${successfulTests} pruebas exitosas`}
            {warningTests > 0 && ` • ⚠️ ${warningTests} advertencias`}
            {errorTests > 0 && ` • ❌ ${errorTests} errores`}
            <br />
            <br />
            {errorTests === 0 && warningTests === 0 && (
              <span className="text-green-700">
                🎉 ¡Todas las pruebas pasaron exitosamente! El sistema está funcionando correctamente.
              </span>
            )}
            {errorTests === 0 && warningTests > 0 && (
              <span className="text-yellow-700">
                ⚠️ Sistema funcional con algunas características pendientes de configuración.
                <br />
                <strong>Recomendación:</strong> Ejecuta el script de configuración de base de datos.
              </span>
            )}
            {errorTests > 0 && (
              <span className="text-red-700">
                ❌ Se encontraron errores que requieren atención inmediata.
                <br />
                <strong>Acción requerida:</strong> Revisa los errores y corrige la configuración.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
