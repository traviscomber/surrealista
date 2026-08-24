import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalisisIntegralPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis integral retirado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            El flujo anterior combinaba resultados simulados de fuentes fiscales, legales, territoriales y financieras,
            por lo que no es apto para uso operativo.
          </p>
          <p>
            Usa CAMPOS para geometría KMZ y contexto CIREN verificable. Cualquier análisis legal, financiero o de
            propiedad deberá habilitarse sólo cuando cada dato pueda trazarse a una fuente real y vigente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
