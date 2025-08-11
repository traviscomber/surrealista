"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SimplePropertyImporter() {
  const [jsonData, setJsonData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const importProperty = async () => {
    if (!jsonData) {
      setError("Por favor, ingresa datos JSON válidos")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Parse JSON to check if it's valid
      const parsedData = JSON.parse(jsonData)

      // Here you would typically send the data to your API to save it
      // For now, we'll just simulate a successful import

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("Propiedad importada correctamente")
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
          <p className="text-sm text-gray-500">
            Pega los datos JSON de la propiedad para importarla directamente a la base de datos.
          </p>
          <Textarea
            placeholder="Pega aquí los datos JSON de la propiedad..."
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="font-mono text-sm h-64"
          />
          <Button onClick={importProperty} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Importar Propiedad"
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
      </div>
    </div>
  )
}
