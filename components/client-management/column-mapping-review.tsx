"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, AlertTriangle, HelpCircle } from "lucide-react"
import type { ColumnMapping } from "@/lib/excel/excel-parser"

interface ColumnMappingReviewProps {
  mappings: ColumnMapping[]
  onConfirm: (confirmedMappings: Record<string, string>) => void
  onCancel: () => void
}

const fieldOptions = [
  { value: "first_name", label: "Nombre" },
  { value: "last_name", label: "Apellido" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "rut", label: "RUT" },
  { value: "company_name", label: "Empresa" },
  { value: "notes", label: "Notas" },
  { value: "ignore", label: "Ignorar columna" },
]

export function ColumnMappingReview({ mappings, onConfirm, onCancel }: ColumnMappingReviewProps) {
  const [editedMappings, setEditedMappings] = useState<Record<string, string>>(
    Object.fromEntries(mappings.map((m) => [m.excelColumn, m.detectedType || "ignore"])),
  )

  const handleConfirm = () => {
    onConfirm(editedMappings)
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Check className="w-4 h-4 text-green-600" />
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "low":
        return <HelpCircle className="w-4 h-4 text-gray-400" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisar Mapeo de Columnas</CardTitle>
        <CardDescription>
          Confirma que las columnas del Excel se detectaron correctamente. Puedes ajustar el mapeo antes de importar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {mappings.map((mapping, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0 mt-1">{getConfidenceIcon(mapping.confidence)}</div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-1">{mapping.excelColumn}</div>
                <div className="text-xs text-gray-500 mb-2">
                  Ejemplos: {mapping.sampleValues.join(", ") || "Sin datos"}
                </div>
                <Badge
                  variant={
                    mapping.confidence === "high"
                      ? "default"
                      : mapping.confidence === "medium"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {mapping.confidence === "high"
                    ? "Alta confianza"
                    : mapping.confidence === "medium"
                      ? "Media confianza"
                      : "Revisar"}
                </Badge>
              </div>

              <Select
                value={editedMappings[mapping.excelColumn]}
                onValueChange={(value) => {
                  setEditedMappings((prev) => ({
                    ...prev,
                    [mapping.excelColumn]: value,
                  }))
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar y Continuar</Button>
        </div>
      </CardContent>
    </Card>
  )
}
