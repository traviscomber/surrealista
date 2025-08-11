"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

export default function CheckDatabaseSchema() {
  const [schema, setSchema] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSchema = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the properties table schema
      const { data, error: schemaError } = await supabase.rpc("get_schema_info")

      if (schemaError) throw schemaError

      // Filter to only show the properties table
      const propertiesSchema = data?.filter((table: any) => table.table_name === "properties") || []

      setSchema(propertiesSchema)
    } catch (err: any) {
      console.error("Error fetching schema:", err)
      setError(err.message || "Failed to fetch database schema")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check Database Schema</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkSchema} disabled={isLoading} className="mb-4">
          {isLoading ? "Checking Schema..." : "Check Properties Table Schema"}
        </Button>

        {error && <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-md">{error}</div>}

        {schema && (
          <div>
            <h3 className="font-semibold mb-2">Properties Table Columns:</h3>
            <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-gray-500 py-2">Column Name</th>
                    <th className="text-left font-medium text-gray-500 py-2">Data Type</th>
                    <th className="text-left font-medium text-gray-500 py-2">Is Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.map((column: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="py-2">{column.column_name}</td>
                      <td className="py-2">{column.data_type}</td>
                      <td className="py-2">{column.is_nullable ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
