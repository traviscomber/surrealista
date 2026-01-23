"use client"

import { TagsSelector } from "@/components/tags/tags-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tag } from "lucide-react"

interface CommunicationTagsManagerProps {
  communicationId: string
  communicationSubject: string
}

export function CommunicationTagsManager({ communicationId, communicationSubject }: CommunicationTagsManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiquetas de Comunicación
        </CardTitle>
        <CardDescription>Organiza esta comunicación con etiquetas para búsquedas rápidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Etiquetas para: <span className="font-bold text-amber-600">{communicationSubject}</span>
            </Label>
            <TagsSelector entityType="communication" entityId={communicationId} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Ejemplo de etiquetas: "urgente", "proyecto", "contrato", "solicitud", etc.</p>
            <p>• Las etiquetas aparecerán en la búsqueda universal</p>
            <p>• Puedes crear nuevas etiquetas escribiéndolas directamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
