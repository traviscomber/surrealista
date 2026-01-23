"use client"

import { TagsSelector } from "@/components/tags/tags-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag } from "lucide-react"

interface FieldTagsManagerProps {
  kmzId: string
  kmzName: string
}

export function FieldTagsManager({ kmzId, kmzName }: FieldTagsManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiquetas del Campo
        </CardTitle>
        <CardDescription>Organiza este campo con etiquetas para búsquedas rápidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Etiquetas para: <span className="font-bold text-emerald-600">{kmzName}</span>
            </Label>
            <TagsSelector entityType="kmz" entityId={kmzId} />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Ejemplo de etiquetas: "arándanos", "volcán", "cultivo", "viña", etc.</p>
            <p>• Las etiquetas aparecerán en la búsqueda universal</p>
            <p>• Puedes crear nuevas etiquetas escribiéndolas directamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
