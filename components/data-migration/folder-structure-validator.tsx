"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, FolderOpen, FileText, MapPin, ImageIcon } from "lucide-react"

interface ValidationResult {
  isValid: boolean
  score: number
  issues: ValidationIssue[]
  recommendations: string[]
}

interface ValidationIssue {
  type: "missing" | "incorrect" | "warning"
  element: string
  description: string
}

export default function FolderStructureValidator() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Estructura template basada en "Valdivia 142 has Teresa F..."
  const templateStructure = {
    requiredFolders: [
      { name: "fotos", icon: ImageIcon, description: "Carpeta principal de fotografías" },
      { name: "fotos cel", icon: ImageIcon, description: "Fotografías tomadas con celular" },
      { name: "Fotos enero 2024", icon: ImageIcon, description: "Fotografías organizadas por fecha" },
    ],
    requiredFiles: [
      {
        pattern: /.*\.kmz$/i,
        icon: MapPin,
        description: "Archivo de ubicación KMZ",
        example: "Campo Iñipulli 140_has.kmz",
      },
      {
        pattern: /.*fundo.*\.pdf$/i,
        icon: FileText,
        description: "Documento PDF del fundo",
        example: "Fundo Iñipulli_140_110124_compressed.pdf",
      },
      {
        pattern: /.*orden.*venta.*/i,
        icon: FileText,
        description: "Orden de venta (DOCX o PDF)",
        example: "Orden de Venta Iñipulli.docx",
      },
    ],
  }

  const validateStructure = async () => {
    setIsValidating(true)

    // Simula validación basada en la estructura real
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockValidation: ValidationResult = {
      isValid: true,
      score: 95,
      issues: [
        {
          type: "warning",
          element: "Fotos enero 2024",
          description: "Considerar usar formato YYYY-MM para mejor organización temporal",
        },
      ],
      recommendations: [
        'Estructura coincide con el caso de éxito "Valdivia 142"',
        "Todos los elementos críticos están presentes",
        "Considerar estandarizar nombres de archivos KMZ",
        "Verificar que los PDFs no estén corruptos",
      ],
    }

    setValidationResult(mockValidation)
    setIsValidating(false)
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "missing":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "incorrect":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validador de Estructura</h2>
          <p className="text-muted-foreground">Valida carpetas contra el template "Valdivia 142 has Teresa F..."</p>
        </div>
        <Button onClick={validateStructure} disabled={isValidating}>
          {isValidating ? "Validando..." : "Validar Estructura"}
        </Button>
      </div>

      {/* Template de Referencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Template de Referencia
          </CardTitle>
          <CardDescription>Estructura basada en el caso de éxito real "Valdivia 142 has Teresa F..."</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Carpetas Requeridas */}
            <div>
              <h4 className="font-medium mb-2">Carpetas Requeridas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {templateStructure.requiredFolders.map((folder, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <folder.icon className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{folder.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archivos Requeridos */}
            <div>
              <h4 className="font-medium mb-2">Tipos de Archivos Requeridos</h4>
              <div className="space-y-2">
                {templateStructure.requiredFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded">
                    <file.icon className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.description}</p>
                      <p className="text-xs text-muted-foreground">Ejemplo: {file.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de Validación */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado de Validación
            </CardTitle>
            <CardDescription>Puntuación: {validationResult.score}/100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Estado General */}
              <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  {validationResult.isValid
                    ? "✅ La estructura cumple con los requisitos del template de referencia"
                    : "❌ La estructura no cumple con los requisitos mínimos"}
                </AlertDescription>
              </Alert>

              {/* Issues */}
              {validationResult.issues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Observaciones</h4>
                  <div className="space-y-2">
                    {validationResult.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded">
                        {getIssueIcon(issue.type)}
                        <div>
                          <p className="font-medium text-sm">{issue.element}</p>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              <div>
                <h4 className="font-medium mb-2">Recomendaciones</h4>
                <ul className="space-y-1">
                  {validationResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
