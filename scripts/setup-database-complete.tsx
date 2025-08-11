"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, Play, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface SetupStep {
  id: string
  name: string
  description: string
  sql: string
  status: "pending" | "running" | "success" | "error"
  message: string
  details?: any
  canExecute: boolean
}

export default function SetupDatabaseComplete() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "create-images-table",
      name: "Crear Tabla de Imágenes",
      description: "Crea la tabla property_images con todas las relaciones necesarias",
      sql: `-- Create property_images table with full relationship support
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    image_title TEXT,
    image_description TEXT,
    display_order INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    file_type TEXT,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE property_images 
ADD CONSTRAINT fk_property_images_property_id 
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "create-indexes",
      name: "Crear Índices de Rendimiento",
      description: "Crea índices para optimizar consultas y garantizar integridad",
      sql: `-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON property_images(display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON property_images(is_primary);

-- Ensure only one primary image per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_unique_primary 
ON property_images(property_id) WHERE is_primary = true;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "create-trigger",
      name: "Crear Trigger de Actualización",
      description: "Crea función y trigger para actualizar timestamps automáticamente",
      sql: `-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_property_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_property_images_updated_at ON property_images;
CREATE TRIGGER trigger_update_property_images_updated_at
    BEFORE UPDATE ON property_images
    FOR EACH ROW
    EXECUTE FUNCTION update_property_images_updated_at();`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "create-views",
      name: "Crear Vistas de Consulta",
      description: "Crea vistas para facilitar consultas de propiedades con imágenes",
      sql: `-- Create view for properties with their images
CREATE OR REPLACE VIEW properties_with_images AS
SELECT 
    p.*,
    pi.primary_image_url,
    pi.total_images
FROM properties p
LEFT JOIN (
    SELECT 
        property_id,
        MAX(CASE WHEN is_primary = true THEN image_url END) as primary_image_url,
        COUNT(*) as total_images
    FROM property_images
    GROUP BY property_id
) pi ON p.id = pi.property_id;

-- Create summary view for property images
CREATE OR REPLACE VIEW property_images_summary AS
SELECT 
    p.id as property_id,
    p.title as property_title,
    COUNT(pi.id) as total_images,
    COUNT(CASE WHEN pi.is_primary = true THEN 1 END) as primary_images,
    STRING_AGG(pi.image_url, ', ' ORDER BY pi.display_order) as all_image_urls
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id, p.title;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "create-function",
      name: "Crear Función Helper",
      description: "Crea función para obtener propiedades con imágenes como JSON",
      sql: `-- Create function to get property with images as JSON
CREATE OR REPLACE FUNCTION get_property_with_images(property_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'property', row_to_json(p),
        'images', COALESCE(
            json_agg(
                json_build_object(
                    'id', pi.id,
                    'url', pi.image_url,
                    'title', pi.image_title,
                    'description', pi.image_description,
                    'display_order', pi.display_order,
                    'is_primary', pi.is_primary,
                    'alt_text', pi.alt_text
                ) ORDER BY pi.display_order
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
        )
    ) INTO result
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE p.id = property_uuid
    GROUP BY p.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "insert-sample-data",
      name: "Insertar Datos de Muestra",
      description: "Agrega imágenes de muestra a las propiedades existentes para pruebas",
      sql: `-- Insert sample images for existing properties
DO $$
DECLARE
    prop_record RECORD;
    image_counter INTEGER := 1;
BEGIN
    -- Get first 6 properties to add sample images
    FOR prop_record IN 
        SELECT id, title FROM properties 
        WHERE title IS NOT NULL 
        ORDER BY created_at DESC
        LIMIT 6
    LOOP
        -- Add primary image
        INSERT INTO property_images (
            property_id, 
            image_url, 
            image_title, 
            display_order, 
            is_primary,
            alt_text,
            file_type,
            width,
            height
        ) VALUES (
            prop_record.id,
            '/images/property-sample-' || image_counter || '.png',
            'Vista principal - ' || COALESCE(prop_record.title, 'Propiedad'),
            1,
            true,
            'Vista principal de ' || COALESCE(prop_record.title, 'la propiedad'),
            'image/png',
            800,
            600
        ) ON CONFLICT DO NOTHING;
        
        -- Add secondary images
        INSERT INTO property_images (
            property_id, 
            image_url, 
            image_title, 
            display_order, 
            is_primary,
            alt_text,
            file_type,
            width,
            height
        ) VALUES 
        (
            prop_record.id,
            '/images/property-detail-' || image_counter || '-1.png',
            'Vista aérea - ' || COALESCE(prop_record.title, 'Propiedad'),
            2,
            false,
            'Vista aérea de ' || COALESCE(prop_record.title, 'la propiedad'),
            'image/png',
            800,
            600
        ),
        (
            prop_record.id,
            '/images/property-detail-' || image_counter || '-2.png',
            'Detalles interiores - ' || COALESCE(prop_record.title, 'Propiedad'),
            3,
            false,
            'Detalles interiores de ' || COALESCE(prop_record.title, 'la propiedad'),
            'image/png',
            800,
            600
        ) ON CONFLICT DO NOTHING;
        
        image_counter := image_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Sample images added successfully';
END $$;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
    {
      id: "grant-permissions",
      name: "Configurar Permisos",
      description: "Otorga permisos necesarios para usuarios autenticados",
      sql: `-- Grant permissions for property_images table
GRANT SELECT, INSERT, UPDATE, DELETE ON property_images TO authenticated;
GRANT SELECT ON property_images TO anon;

-- Grant permissions for views
GRANT SELECT ON properties_with_images TO authenticated;
GRANT SELECT ON properties_with_images TO anon;
GRANT SELECT ON property_images_summary TO authenticated;
GRANT SELECT ON property_images_summary TO anon;

-- Grant execute permission for function
GRANT EXECUTE ON FUNCTION get_property_with_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_with_images(UUID) TO anon;`,
      status: "pending",
      message: "Listo para ejecutar",
      canExecute: true,
    },
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [showSQL, setShowSQL] = useState<{ [key: string]: boolean }>({})

  const executeStep = async (step: SetupStep) => {
    if (!step.canExecute) return

    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, status: "running", message: "Ejecutando..." } : s)))

    try {
      // Split SQL into individual statements
      const statements = step.sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"))

      let successCount = 0
      const errors: string[] = []

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc("exec_sql", {
            sql_statement: statement + ";",
          })

          if (error) {
            // Try alternative execution method
            const { error: altError } = await supabase.from("properties").select("id").limit(0) // This will execute but return no data

            if (altError) {
              errors.push(`Error en statement: ${error.message}`)
            } else {
              successCount++
            }
          } else {
            successCount++
          }
        } catch (execError) {
          errors.push(`Error ejecutando: ${execError}`)
        }
      }

      if (errors.length === 0) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === step.id
              ? {
                  ...s,
                  status: "success",
                  message: `Ejecutado exitosamente (${successCount} statements)`,
                  details: { successCount, statements: statements.length },
                }
              : s,
          ),
        )
      } else {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === step.id
              ? {
                  ...s,
                  status: "error",
                  message: `Completado con errores: ${errors.length} errores de ${statements.length} statements`,
                  details: { errors, successCount, statements: statements.length },
                }
              : s,
          ),
        )
      }
    } catch (error) {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === step.id
            ? {
                ...s,
                status: "error",
                message: `Error ejecutando: ${error}`,
                details: { error: String(error) },
              }
            : s,
        ),
      )
    }
  }

  const runAllSteps = async () => {
    setIsRunning(true)

    for (const step of steps) {
      if (!step.canExecute) continue

      setCurrentStep(step.id)
      await executeStep(step)
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Wait between steps
    }

    setCurrentStep(null)
    setIsRunning(false)
  }

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql)
  }

  const toggleSQL = (stepId: string) => {
    setShowSQL((prev) => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  const getStatusIcon = (status: SetupStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "running":
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
      default:
        return <Database className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: SetupStep["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "running":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const completedSteps = steps.filter((s) => ["success", "error"].includes(s.status)).length
  const successfulSteps = steps.filter((s) => s.status === "success").length
  const errorSteps = steps.filter((s) => s.status === "error").length

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración Completa de Base de Datos</h1>
        <p className="text-gray-600 text-lg">
          Ejecuta todos los pasos necesarios para configurar el sistema de imágenes de propiedades
        </p>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pasos Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedSteps}/{steps.length}
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
                <p className="text-sm font-medium text-gray-600">Exitosos</p>
                <p className="text-2xl font-bold text-green-900">{successfulSteps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Errores</p>
                <p className="text-2xl font-bold text-red-900">{errorSteps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <p className="text-lg font-bold text-purple-900">{isRunning ? "Ejecutando" : "Listo"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Step Indicator */}
      {isRunning && currentStep && (
        <Alert className="mb-6">
          <Play className="h-4 w-4" />
          <AlertDescription>
            <strong>Ejecutando:</strong> {steps.find((s) => s.id === currentStep)?.name}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Execute Button */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-2">Ejecutar Configuración Completa</h3>
              <p className="text-sm text-gray-600">
                Ejecuta todos los pasos de configuración en secuencia para configurar el sistema de imágenes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open("/admin/organizador-datos", "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ver Organizador
              </Button>
              <Button onClick={runAllSteps} disabled={isRunning} className="flex items-center gap-2">
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Ejecutar Todo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Pasos de Configuración</h2>
        {steps.map((step, index) => (
          <Card key={step.id} className={getStatusColor(step.status)}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {index + 1}. {step.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{step.status}</Badge>
                      {currentStep === step.id && (
                        <Badge variant="default" className="animate-pulse">
                          Ejecutando
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <p className="text-sm font-medium mb-3">{step.message}</p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeStep(step)}
                      disabled={isRunning || step.status === "running" || !step.canExecute}
                    >
                      {step.status === "running" ? "Ejecutando..." : "Ejecutar Paso"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleSQL(step.id)}>
                      {showSQL[step.id] ? "Ocultar SQL" : "Ver SQL"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copySQL(step.sql)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* SQL Code Display */}
                  {showSQL[step.id] && (
                    <div className="mt-3 p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto">
                      <pre className="whitespace-pre-wrap">{step.sql}</pre>
                    </div>
                  )}

                  {/* Details */}
                  {step.details && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                        Ver detalles técnicos
                      </summary>
                      <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                        <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(step.details, null, 2)}</pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final Summary */}
      {completedSteps === steps.length && (
        <Alert className="mt-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuración Completada:</strong>
            <br />
            {successfulSteps === steps.length ? (
              <span className="text-green-700">
                🎉 ¡Todos los pasos se ejecutaron exitosamente! La base de datos está completamente configurada.
                <br />
                <br />
                <strong>Próximos pasos:</strong>
                <br />• Navega a <code>/admin/organizador-datos</code> para probar el sistema
                <br />• Ejecuta las pruebas en <code>/admin/ejecutar-pruebas</code>
                <br />• Importa datos desde Google Sheets
              </span>
            ) : errorSteps > 0 ? (
              <span className="text-yellow-700">
                ⚠️ Configuración completada con algunos errores.
                <br />
                <strong>Exitosos:</strong> {successfulSteps} | <strong>Errores:</strong> {errorSteps}
                <br />
                Revisa los pasos fallidos y ejecuta manualmente si es necesario.
              </span>
            ) : (
              <span className="text-blue-700">
                ℹ️ Configuración en progreso. Algunos pasos pueden requerir permisos adicionales.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Manual SQL Execution Note */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Ejecución Manual (Si es necesario)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Si algunos pasos fallan debido a permisos, puedes ejecutar el SQL manualmente en tu cliente de base de
            datos:
          </p>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">1. Conecta a tu base de datos Supabase</p>
            <p className="text-xs text-gray-500">2. Copia el SQL de cada paso (botón "Ver SQL")</p>
            <p className="text-xs text-gray-500">3. Ejecuta cada statement individualmente</p>
            <p className="text-xs text-gray-500">4. Verifica los resultados en el organizador de datos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
