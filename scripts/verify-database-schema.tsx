"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database, Table, Columns, RefreshCw } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface TableCheck {
  name: string
  exists: boolean
  columns: ColumnCheck[]
}

interface ColumnCheck {
  name: string
  exists: boolean
  type?: string
  required: boolean
}

const requiredTables = [
  {
    name: "properties",
    columns: [
      { name: "id", required: true, type: "bigint" },
      { name: "title", required: true, type: "text" },
      { name: "description", required: false, type: "text" },
      { name: "price", required: true, type: "numeric" },
      { name: "location", required: true, type: "text" },
      { name: "address", required: false, type: "text" },
      { name: "city", required: true, type: "text" },
      { name: "region", required: true, type: "text" },
      { name: "country", required: true, type: "text" },
      { name: "property_type", required: true, type: "text" },
      { name: "bedrooms", required: false, type: "integer" },
      { name: "bathrooms", required: false, type: "integer" },
      { name: "square_meters", required: false, type: "numeric" },
      { name: "lot_size", required: false, type: "numeric" },
      { name: "year_built", required: false, type: "integer" },
      { name: "status", required: true, type: "text" },
      { name: "featured", required: true, type: "boolean" },
      { name: "images", required: false, type: "text[]" },
      { name: "amenities", required: false, type: "text[]" },
      { name: "latitude", required: false, type: "numeric" },
      { name: "longitude", required: false, type: "numeric" },
      { name: "created_at", required: true, type: "timestamp with time zone" },
      { name: "updated_at", required: true, type: "timestamp with time zone" },
    ],
  },
  {
    name: "leads",
    columns: [
      { name: "id", required: true, type: "bigint" },
      { name: "name", required: true, type: "text" },
      { name: "email", required: true, type: "text" },
      { name: "phone", required: false, type: "text" },
      { name: "message", required: false, type: "text" },
      { name: "property_id", required: false, type: "bigint" },
      { name: "property_title", required: false, type: "text" },
      { name: "contact_preference", required: false, type: "text" },
      { name: "source", required: false, type: "text" },
      { name: "status", required: true, type: "text" },
      { name: "created_at", required: true, type: "timestamp with time zone" },
      { name: "updated_at", required: true, type: "timestamp with time zone" },
    ],
  },
  {
    name: "users",
    columns: [
      { name: "id", required: true, type: "uuid" },
      { name: "email", required: true, type: "text" },
      { name: "name", required: false, type: "text" },
      { name: "role", required: true, type: "text" },
      { name: "created_at", required: true, type: "timestamp with time zone" },
      { name: "updated_at", required: true, type: "timestamp with time zone" },
    ],
  },
  {
    name: "messages",
    columns: [
      { name: "id", required: true, type: "bigint" },
      { name: "name", required: true, type: "text" },
      { name: "email", required: true, type: "text" },
      { name: "phone", required: false, type: "text" },
      { name: "subject", required: true, type: "text" },
      { name: "message", required: true, type: "text" },
      { name: "status", required: true, type: "text" },
      { name: "priority", required: true, type: "text" },
      { name: "assigned_to", required: false, type: "uuid" },
      { name: "created_at", required: true, type: "timestamp with time zone" },
      { name: "updated_at", required: true, type: "timestamp with time zone" },
    ],
  },
]

export default function DatabaseSchemaVerifier() {
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<TableCheck[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const verifySchema = async () => {
    setChecking(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configuración de Supabase faltante. Verifica las variables de entorno.")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const tableResults: TableCheck[] = []

      for (const table of requiredTables) {
        try {
          // Check if table exists by trying to query it
          const { error: tableError } = await supabase.from(table.name).select("*").limit(1)

          const tableExists = !tableError || !tableError.message.includes("does not exist")

          const columnChecks: ColumnCheck[] = []

          if (tableExists) {
            // Try to get actual column information by querying individual columns
            for (const column of table.columns) {
              try {
                // Try to select just this column to see if it exists
                const { error: columnError } = await supabase.from(table.name).select(column.name).limit(1)

                const columnExists = !columnError || !columnError.message.includes("does not exist")

                columnChecks.push({
                  name: column.name,
                  exists: columnExists,
                  type: column.type,
                  required: column.required,
                })
              } catch (err) {
                columnChecks.push({
                  name: column.name,
                  exists: false,
                  type: column.type,
                  required: column.required,
                })
              }
            }
          } else {
            // If table doesn't exist, mark all columns as missing
            for (const column of table.columns) {
              columnChecks.push({
                name: column.name,
                exists: false,
                type: column.type,
                required: column.required,
              })
            }
          }

          tableResults.push({
            name: table.name,
            exists: tableExists,
            columns: columnChecks,
          })
        } catch (err) {
          console.error(`Error checking table ${table.name}:`, err)
          tableResults.push({
            name: table.name,
            exists: false,
            columns: table.columns.map((col) => ({
              name: col.name,
              exists: false,
              type: col.type,
              required: col.required,
            })),
          })
        }
      }

      setResults(tableResults)
      setLastChecked(new Date())
    } catch (err) {
      console.error("Schema verification error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setChecking(false)
    }
  }

  const getStatusIcon = (exists: boolean, required: boolean) => {
    if (exists) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (required) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (exists: boolean, required: boolean) => {
    if (exists)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          ✓ Existe
        </Badge>
      )
    if (required) return <Badge variant="destructive">✗ Faltante</Badge>
    return <Badge variant="secondary">⚠ Opcional</Badge>
  }

  const allTablesExist = results.every((table) => table.exists)
  const allRequiredColumnsExist = results.every((table) =>
    table.columns.filter((col) => col.required).every((col) => col.exists),
  )

  const totalTables = results.length
  const existingTables = results.filter((t) => t.exists).length
  const totalRequiredColumns = results.reduce(
    (acc, table) => acc + table.columns.filter((col) => col.required).length,
    0,
  )
  const existingRequiredColumns = results.reduce(
    (acc, table) => acc + table.columns.filter((col) => col.required && col.exists).length,
    0,
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verificador de Esquema de Base de Datos</h1>
          <p className="text-gray-600">Verifica que todas las tablas y columnas requeridas existan en Supabase</p>
          {lastChecked && (
            <p className="text-sm text-gray-500 mt-1">Última verificación: {lastChecked.toLocaleString("es-CL")}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Estado del Esquema
          </CardTitle>
          <CardDescription>Ejecuta la verificación para comprobar el estado actual de tu base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={verifySchema} disabled={checking} className="flex items-center gap-2">
              {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {checking ? "Verificando..." : "Verificar Esquema"}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error de Verificación</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Table className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tablas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {existingTables}/{totalTables}
                        </p>
                        <p className="text-xs text-gray-500">
                          {existingTables === totalTables
                            ? "Todas creadas"
                            : `${totalTables - existingTables} faltantes`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Columns className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Columnas Requeridas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {existingRequiredColumns}/{totalRequiredColumns}
                        </p>
                        <p className="text-xs text-gray-500">
                          {existingRequiredColumns === totalRequiredColumns
                            ? "Todas creadas"
                            : `${totalRequiredColumns - existingRequiredColumns} faltantes`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${allTablesExist && allRequiredColumnsExist ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {allTablesExist && allRequiredColumnsExist ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estado General</p>
                        <p
                          className={`text-2xl font-bold ${allTablesExist && allRequiredColumnsExist ? "text-green-600" : "text-red-600"}`}
                        >
                          {allTablesExist && allRequiredColumnsExist ? "✓ Completo" : "✗ Incompleto"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {allTablesExist && allRequiredColumnsExist ? "Listo para usar" : "Requiere acción"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table Details */}
              {results.map((table) => (
                <Card key={table.name} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(table.exists, true)}
                        <span className="font-mono text-lg">tabla: {table.name}</span>
                      </div>
                      {getStatusBadge(table.exists, true)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {table.columns.map((column) => (
                        <div
                          key={column.name}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(column.exists, column.required)}
                            <div>
                              <span className="text-sm font-mono font-medium">{column.name}</span>
                              <p className="text-xs text-gray-500">{column.type}</p>
                            </div>
                          </div>
                          {getStatusBadge(column.exists, column.required)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Action Required or Success Message */}
              {!allTablesExist || !allRequiredColumnsExist ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-yellow-800 mb-3">
                    <AlertCircle className="h-6 w-6" />
                    <span className="text-lg font-semibold">⚠️ Acción Requerida</span>
                  </div>
                  <div className="space-y-2 text-yellow-700">
                    <p className="font-medium">Algunas tablas o columnas están faltando. Para solucionarlo:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        Ve al <strong>SQL Editor</strong> en tu dashboard de Supabase
                      </li>
                      <li>
                        Copia y pega el contenido del archivo{" "}
                        <code className="bg-yellow-100 px-2 py-1 rounded">create-missing-tables.sql</code>
                      </li>
                      <li>
                        Haz clic en <strong>"Run"</strong> para ejecutar el script
                      </li>
                      <li>
                        Regresa aquí y haz clic en <strong>"Verificar Esquema"</strong> nuevamente
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-green-800 mb-3">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-lg font-semibold">🎉 Esquema Completo</span>
                  </div>
                  <div className="space-y-2 text-green-700">
                    <p className="font-medium">¡Excelente! Todas las tablas y columnas requeridas están presentes.</p>
                    <p>Tu base de datos está lista para:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Crear propiedades destacadas</li>
                      <li>Recibir leads y mensajes de contacto</li>
                      <li>Gestionar usuarios y administración</li>
                      <li>Mostrar propiedades en el sitio web</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
