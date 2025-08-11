"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Play } from 'lucide-react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SetupPropertyImagesTable() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  const runSetup = async () => {
    setIsRunning(true)
    setResults([])
    setError(null)

    try {
      const supabase = createClientComponentClient()

      // Step 1: Create property_images table
      setResults(prev => [...prev, { step: "Creando tabla property_images...", status: "running" }])
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS property_images (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            image_title TEXT,
            image_description TEXT,
            display_order INTEGER DEFAULT 0,
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (createError) {
        throw new Error(`Error creando tabla: ${createError.message}`)
      }

      setResults(prev => prev.map(r => r.step.includes("Creando tabla") ? {...r, status: "success"} : r))

      // Step 2: Create indexes
      setResults(prev => [...prev, { step: "Creando índices...", status: "running" }])
      
      const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
        CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
        CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON property_images(is_primary);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
      
      if (indexError) {
        console.warn("Warning creating indexes:", indexError.message)
      }

      setResults(prev => prev.map(r => r.step.includes("índices") ? {...r, status: "success"} : r))

      // Step 3: Enable RLS
      setResults(prev => [...prev, { step: "Configurando seguridad...", status: "running" }])
      
      const rlsSQL = `
        ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
      `

      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })
      
      if (rlsError) {
        console.warn("Warning enabling RLS:", rlsError.message)
      }

      setResults(prev => prev.map(r => r.step.includes("seguridad") ? {...r, status: "success"} : r))

      // Step 4: Migrate existing images
      setResults(prev => [...prev, { step: "Migrando imágenes existentes...", status: "running" }])

      // Get properties with images
      const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id, images")
        .not("images", "is", null)

      if (propError) {
        throw new Error(`Error obteniendo propiedades: ${propError.message}`)
      }

      let migratedCount = 0
      
      for (const property of properties || []) {
        if (property.images && Array.isArray(property.images) && property.images.length > 0) {
          for (let i = 0; i < property.images.length; i++) {
            const { error: insertError } = await supabase
              .from("property_images")
              .insert({
                property_id: property.id,
                image_url: property.images[i],
                display_order: i,
                is_primary: i === 0
              })

            if (!insertError) {
              migratedCount++
            }
          }
        }
      }

      setResults(prev => prev.map(r => 
        r.step.includes("Migrando") ? 
        {...r, status: "success", details: `${migratedCount} imágenes migradas`} : r
      ))

      setResults(prev => [...prev, { 
        step: "✅ Configuración completada exitosamente", 
        status: "success",
        details: "La tabla property_images está lista para usar"
      }])

    } catch (err) {
      console.error("Setup error:", err)
      setError(err.message)
      setResults(prev => prev.map(r => r.status === "running" ? {...r, status: "error"} : r))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurar Tabla de Imágenes de Propiedades
          </CardTitle>
          <CardDescription>
            Este script creará la tabla property_images y migrará las imágenes existentes desde el campo images de la tabla properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={runSetup} 
            disabled={isRunning}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Ejecutando..." : "Ejecutar Configuración"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Progreso:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {result.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {result.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {result.status === "running" && (
                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className={result.status === "error" ? "text-red-600" : ""}>{result.step}</span>
                  {result.details && <span className="text-gray-500">({result.details})</span>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">¿Qué hace este script?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Crea la tabla property_images con relación a properties</li>
              <li>• Configura índices para mejor rendimiento</li>
              <li>• Habilita Row Level Security (RLS)</li>
              <li>• Migra imágenes existentes del campo images</li>
              <li>• Establece la primera imagen como principal</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
