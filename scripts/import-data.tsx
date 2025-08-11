"use client"

import type React from "react"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ImportData() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResult(null)

    try {
      // Read the file
      const text = await file.text()
      let data

      // Parse based on file type
      if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parsing - for production use a proper CSV parser library
        const lines = text.split("\n")
        const headers = lines[0].split(",")

        data = lines.slice(1).map((line) => {
          const values = line.split(",")
          return headers.reduce(
            (obj, header, i) => {
              obj[header.trim()] = values[i]?.trim() || null
              return obj
            },
            {} as Record<string, any>,
          )
        })
      } else {
        throw new Error("Unsupported file format. Please upload a JSON or CSV file.")
      }

      // Process properties
      let successCount = 0
      let errorCount = 0

      for (const item of data) {
        try {
          // Extract images if they exist
          const { images, ...propertyData } = item

          // Insert property
          const { data: propertyResult, error: propertyError } = await supabase
            .from("properties")
            .insert(propertyData)
            .select("id")
            .single()

          if (propertyError) throw propertyError

          // Insert images if they exist
          if (propertyResult && images && Array.isArray(images) && images.length > 0) {
            const imagesWithPropertyId = images.map((image: any) => ({
              ...image,
              property_id: propertyResult.id,
            }))

            const { error: imagesError } = await supabase.from("property_images").insert(imagesWithPropertyId)

            if (imagesError) throw imagesError
          }

          successCount++
        } catch (error) {
          console.error("Error importing property:", error)
          errorCount++
        }
      }

      setResult({
        success: successCount > 0,
        message: `Import complete. Successfully imported ${successCount} properties. ${errorCount > 0 ? `Failed to import ${errorCount} properties.` : ""}`,
      })
    } catch (error: any) {
      console.error("Error importing data:", error)
      setResult({
        success: false,
        message: `Error: ${error.message || "Unknown error occurred"}`,
      })
    } finally {
      setIsLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Property Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Upload a JSON or CSV file containing property data to import into the database. The file should match the
          structure of the properties table.
        </p>

        <div className="mb-4">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="mt-1"
          />
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <p>Importing data, please wait...</p>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
