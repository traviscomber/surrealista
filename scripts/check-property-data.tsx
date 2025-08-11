"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CheckPropertyData() {
  const [jsonData, setJsonData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<any>(null)

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
      // Parse JSON to check if it's valid
      const parsedData = JSON.parse(jsonData)

      // Perform basic validation
      const results = {
        isValid: true,
        missingFields: [],
        warnings: [],
        suggestions: [],
      }

      // Check required fields
      const requiredFields = ["title", "description", "price", "location"]
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          results.isValid = false
          results.missingFields.push(field)
        }
      }

      // Check for images
      if (!parsedData.images || !Array.isArray(parsedData.images) || parsedData.images.length === 0) {
        results.warnings.push("No se encontraron imágenes para la propiedad")
      }

      // Check price format
      if (parsedData.price && typeof parsedData.price === "string") {
        if (!parsedData.price.match(/^\$?[\d.,]+$/)) {
          results.warnings.push("El formato del precio podría no ser válido")
        }
      }

      // Suggestions for improvement
      if (!parsedData.features || !Array.isArray(parsedData.features) || parsedData.features.length === 0) {
        results.suggestions.push("Agregar características de la propiedad mejorará la calidad del listado")
      }

      if (!parsedData.coordinates || !parsedData.coordinates.lat || !parsedData.coordinates.lng) {
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
    } catch (err) {
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
                      {validationResults.missingFields.map((field: string) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResults.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600">Advertencias:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validationResults.warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResults.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">Sugerencias:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validationResults.suggestions.map((suggestion: string, index: number) => (
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
