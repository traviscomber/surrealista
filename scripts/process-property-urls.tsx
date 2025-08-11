"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProcessPropertyUrls() {
  const [urls, setUrls] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processedUrls, setProcessedUrls] = useState<string[]>([])

  const processUrls = async () => {
    if (!urls) {
      setError("Por favor, ingresa al menos una URL")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setProcessedUrls([])

    try {
      // Split the input by newlines to get individual URLs
      const urlList = urls.split("\n").filter((url) => url.trim() !== "")

      if (urlList.length === 0) {
        throw new Error("No se encontraron URLs válidas")
      }

      // Process each URL (in a real app, you might want to validate or normalize them)
      const processed = urlList.map((url) => url.trim())

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProcessedUrls(processed)
      setSuccess(`Se procesaron ${processed.length} URLs correctamente`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Ingresa las URLs de las propiedades, una por línea, para procesarlas en lote.
          </p>
          <Textarea
            placeholder="https://ejemplo.com/propiedad/123
https://ejemplo.com/propiedad/456
https://ejemplo.com/propiedad/789"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="font-mono text-sm h-64"
          />
          <Button onClick={processUrls} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar URLs"
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

        {processedUrls.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">URLs Procesadas</h3>
                  <p className="text-sm text-gray-500">
                    Estas son las URLs que se procesarán. Puedes copiarlas o guardarlas para su uso posterior.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="space-y-2">
                    {processedUrls.map((url, index) => (
                      <li key={index} className="font-mono text-sm break-all">
                        {url}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
