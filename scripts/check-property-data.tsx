"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ValidationResults = {
  isValid: boolean
  missingFields: string[]
  warnings: string[]
  suggestions: string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export default function CheckPropertyData() {
  const [jsonData, setJsonData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null)

  const validateData = async () => {
    if (!jsonData) {
      setError("Por favor, ingresa datos JSON válidos")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setValidationResults(null)

    try {
      const parsedData = asRecord(JSON.parse(jsonData))
      if (!parsedData) throw new Error("Property data must be a JSON object")

      const results: ValidationResults = {
        isValid: true,
        missingFields: [],
        warnings: [],
        suggestions: [],
      }

      const requiredFields = ["title", "description", "price", "location"] as const
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          results.isValid = false
          results.missingFields.push(field)
        }
      }

      const images = parsedData.images
      if (!Array.isArray(images) || images.length === 0) {
        results.warnings.push("No se encontraron imágenes para la propiedad")
      }

      const price = parsedData.price
      if (typeof price === "string" && !price.match(/^\$?[\d.,]+$/)) {
        results.warnings.push("El formato del precio podría no ser válido")
      }

      const features = parsedData.features
      if (!Array.isArray(features) || features.length === 0) {
        results.suggestions.push("Agregar características de la propiedad mejorará la calidad del listado")
      }

      const coordinates = asRecord(parsedData.coordinates)
      if (!coordinates || coordinates.lat == null || coordinates.lng == null) {
        results.suggestions.push("Agregar coordenadas permitirá mostrar la propiedad en el mapa")
      }

      setValidationResults(results)

      if (results.isValid && results.warnings.length === 0) {
        setSuccess("Los datos son válidos y están listos para ser importados")
      } else if (results.isValid) {
        setSuccess("Los datos son válidos pero hay algunas advertencias a considerar")
      } else {
        setError("Los datos no son válidos. Por favor, corrige los campos faltantes.")
      }
    } catch {
      setError("Error al analizar el JSON. Asegúrate de que el formato sea correcto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Pega aquí los datos JSON de la propiedad..."
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="font-mono text-sm h-64"
          />
          <Button onClick={validateData} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              "Validar Datos"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {validationResults && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Resultados de la Validación</h3>
                </div>

                {validationResults.missingFields.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Campos Requeridos Faltantes:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validationResults.missingFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResults.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">Advertencias:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validationResults.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResults.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">Sugerencias:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validationResults.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
