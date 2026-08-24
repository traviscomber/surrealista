import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExtraccionRolPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Extracción de números de ROL retirada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            El flujo anterior utilizaba datos de demostración y no representa una extracción documental verificable.
          </p>
          <p>
            Para contexto catastral usa CAMPOS con CIREN. La extracción desde documentos se habilitará sólo cuando el
            archivo real, la fuente y la evidencia extraída puedan verificarse de extremo a extremo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
