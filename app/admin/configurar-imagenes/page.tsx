import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfigureImagesPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de imágenes</CardTitle>
          <CardDescription>La estructura de datos de imágenes se administra desde migraciones y scripts SQL controlados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Esta pantalla ya no ejecuta DDL ni migraciones desde el navegador. La tabla <code>property_images</code>, sus índices y políticas deben modificarse únicamente mediante un flujo server-side auditable.
          </p>
          <p>
            Para cambios de esquema usa las migraciones del proyecto o los scripts SQL versionados en el repositorio y valida RLS antes de desplegar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
