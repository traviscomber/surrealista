"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Loader2, ExternalLink, Save, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CoordinateResult {
  rollNumber: string
  coordinates: {
    lat: number
    lng: number
  }
  address?: string
  city?: string
  region?: string
  source: string
  extractedAt: string
}

export function SIICoordinateExtractor() {
  const [rollNumber, setRollNumber] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [result, setResult] = useState<CoordinateResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleExtractCoordinates = async () => {
    if (!rollNumber.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese un número de rol válido",
        variant: "destructive",
      })
      return
    }

    setIsExtracting(true)
    try {
      const response = await fetch("/api/v1/sii/extract-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rollNumber: rollNumber.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
        toast({
          title: "Coordenadas extraídas",
          description: `Lat: ${data.data.coordinates.lat}, Lng: ${data.data.coordinates.lng}`,
        })
      } else {
        toast({
          title: "Error en extracción",
          description: data.error || "No se pudieron extraer las coordenadas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con el servicio de extracción",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/v1/properties/save-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Guardado exitoso",
          description: "Las coordenadas han sido guardadas en la base de datos",
        })
      } else {
        toast({
          title: "Error al guardar",
          description: data.error || "No se pudieron guardar las coordenadas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar en la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyCoordinates = () => {
    if (result) {
      const coordText = `${result.coordinates.lat}, ${result.coordinates.lng}`
      navigator.clipboard.writeText(coordText)
      toast({
        title: "Copiado",
        description: "Coordenadas copiadas al portapapeles",
      })
    }
  }

  const openSIIWebsite = () => {
    window.open("https://www4.sii.cl/mapasui/internet/#/contenido/index.html", "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Extractor Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Extractor de Coordenadas SII
          </CardTitle>
          <CardDescription>
            Extrae coordenadas (lat/lng) desde el sitio oficial del SII usando el número de rol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="rollNumber">Número de Rol</Label>
              <Input
                id="rollNumber"
                placeholder="Ej: 12345-67 o 123-45-6"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleExtractCoordinates()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleExtractCoordinates} disabled={isExtracting}>
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Extraer
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={openSIIWebsite}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir SII
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• El sistema accederá automáticamente al sitio del SII</p>
            <p>• Extraerá las coordenadas de latitud y longitud</p>
            <p>• Guardará los datos en la base de datos para uso futuro</p>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <MapPin className="h-5 w-5" />
              Coordenadas Extraídas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número de Rol</Label>
                <p className="text-lg font-mono">{result.rollNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fuente</Label>
                <Badge variant="secondary">{result.source}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Latitud</Label>
                <p className="text-lg font-mono text-blue-600">{result.coordinates.lat}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Longitud</Label>
                <p className="text-lg font-mono text-blue-600">{result.coordinates.lng}</p>
              </div>
            </div>

            {result.address && (
              <div>
                <Label className="text-sm font-medium">Dirección</Label>
                <p className="text-sm">{result.address}</p>
                {result.city && result.region && (
                  <p className="text-sm text-muted-foreground">
                    {result.city}, {result.region}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={copyCoordinates} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Coordenadas
              </Button>
              <Button onClick={handleSaveToDatabase} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar en BD
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Extraído el: {new Date(result.extractedAt).toLocaleString("es-CL")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. <strong>Ingrese el número de rol</strong> en el formato estándar (ej: 12345-67)
          </p>
          <p>
            2. <strong>El sistema accede automáticamente</strong> al sitio oficial del SII
          </p>
          <p>
            3. <strong>Extrae las coordenadas</strong> de latitud y longitud de la propiedad
          </p>
          <p>
            4. <strong>Guarda los datos</strong> en la base de datos para consultas futuras
          </p>
          <p>
            5. <strong>Proporciona las coordenadas</strong> para uso en mapas y análisis
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
