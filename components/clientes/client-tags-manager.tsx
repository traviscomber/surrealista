"use client"

import { TagsSelector } from "@/components/tags/tags-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tag } from "lucide-react"

interface ClientTagsManagerProps {
  clientId: string
  clientName: string
}

export function ClientTagsManager({ clientId, clientName }: ClientTagsManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiquetas del Cliente
        </CardTitle>
        <CardDescription>Organiza este cliente con etiquetas para búsquedas rápidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Etiquetas para: <span className="font-bold text-blue-600">{clientName}</span>
            </Label>
            <TagsSelector entityType="client" entityId={clientId} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Ejemplo de etiquetas: "distribuidor", "productor", "exportador", "mayorista", etc.</p>
            <p>• Las etiquetas aparecerán en la búsqueda universal</p>
            <p>• Puedes crear nuevas etiquetas escribiéndolas directamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
