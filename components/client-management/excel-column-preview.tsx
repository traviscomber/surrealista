"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, CheckCircle2, ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ColumnPreviewData {
  columnName: string
  sampleValues: string[]
  suggestedType: string | null
  confidence: "high" | "medium" | "low"
}

interface ExcelColumnPreviewProps {
  columns: ColumnPreviewData[]
  onConfirm: (mappings: Record<string, string>) => void
  onCancel: () => void
}

const FIELD_OPTIONS = [
  { value: "first_name", label: "Nombre" },
  { value: "last_name", label: "Apellido" },
  { value: "rut", label: "RUT" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "mobile", label: "Celular" },
  { value: "company_name", label: "Empresa" },
  { value: "notes", label: "Notas" },
  { value: "ignore", label: "Ignorar" },
]

export function ExcelColumnPreview({ columns, onConfirm, onCancel }: ExcelColumnPreviewProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    columns.forEach((col) => {
      if (col.suggestedType && col.suggestedType !== "ignore") {
        initial[col.columnName] = col.suggestedType
      } else {
        initial[col.columnName] = "ignore"
      }
    })
    return initial
  })

  const handleMappingChange = (columnName: string, value: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  const handleConfirm = () => {
    const finalMappings: Record<string, string> = {}
    Object.entries(columnMappings).forEach(([col, type]) => {
      if (type !== "ignore") {
        finalMappings[col] = type
      }
    })
    onConfirm(finalMappings)
  }

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const variants: Record<string, { color: string; label: string }> = {
      high: { color: "bg-green-100 text-green-700 border-green-300", label: "Alta confianza" },
      medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Media confianza" },
      low: { color: "bg-red-100 text-red-700 border-red-300", label: "Baja confianza" },
    }
    const variant = variants[confidence]
    return (
      <Badge variant="outline" className={`${variant.color} text-xs`}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="bg-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-orange-600" />
          Vista Previa de Columnas del Excel
        </CardTitle>
        <CardDescription>
          Revisa las columnas detectadas y confirma o ajusta el tipo de dato para cada una. Los valores con @ se
          detectan automáticamente como emails, y los números como teléfonos.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {columns.map((col, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-lg mb-1">{col.columnName}</div>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(col.confidence)}
                      {col.suggestedType && col.suggestedType !== "ignore" && (
                        <Badge variant="secondary" className="text-xs">
                          Sugerencia:{" "}
                          {FIELD_OPTIONS.find((f) => f.value === col.suggestedType)?.label || col.suggestedType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Select
                    value={columnMappings[col.columnName]}
                    onValueChange={(value) => handleMappingChange(col.columnName, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 rounded p-3 text-sm">
                  <div className="font-medium text-gray-700 mb-2">Ejemplos de datos:</div>
                  <div className="space-y-1">
                    {col.sampleValues.slice(0, 3).map((value, vidx) => (
                      <div key={vidx} className="text-gray-600 flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="font-mono text-xs">{value}</span>
                        {value.includes("@") && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                            Email detectado
                          </Badge>
                        )}
                        {/^\+?[\d\s-]{7,}$/.test(value) && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">
                            Teléfono detectado
                          </Badge>
                        )}
                      </div>
                    ))}
                    {col.sampleValues.length === 0 && (
                      <div className="text-gray-400 italic">No hay datos de ejemplo</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Confirmar y Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
