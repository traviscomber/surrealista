import { AlertCircle, KeyRound, ShieldCheck, Users } from "lucide-react"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Usuarios y accesos",
  description: "Estado de la administración interna de usuarios, roles y permisos.",
}

export default function UsersManagementPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Administración"
        title="Usuarios y accesos"
        description="Revisión del estado de autenticación, roles y permisos disponibles para el espacio interno."
        outcome="Esta sección mostrará únicamente usuarios y permisos obtenidos desde una fuente de autenticación real y verificable."
      />

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong>Estado actual:</strong> la administración visual de usuarios todavía no está conectada a una fuente autorizada de identidades. Por seguridad y trazabilidad, no se muestran registros de ejemplo ni se habilitan acciones simuladas.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="pt-2 text-lg">Directorio real</CardTitle>
            <CardDescription>
              Debe provenir del proveedor de autenticación o de una tabla administrativa validada, nunca de datos definidos en la interfaz.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="pt-2 text-lg">Roles y permisos</CardTitle>
            <CardDescription>
              Cada rol debe corresponder a reglas efectivas de acceso en servidor y base de datos, no solamente a una etiqueta visual.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="pt-2 text-lg">Trazabilidad</CardTitle>
            <CardDescription>
              Altas, bajas y cambios de permisos deben registrar quién realizó la acción, cuándo ocurrió y cuál fue el alcance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Requisitos para habilitar esta sección</CardTitle>
          <CardDescription>
            La interfaz podrá activarse cuando se verifique la fuente de usuarios y el modelo de autorización.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>• Lectura autorizada del directorio de usuarios.</li>
            <li>• Definición de roles y permisos efectivos.</li>
            <li>• Acciones de invitación, edición y desactivación implementadas en servidor.</li>
            <li>• Manejo de errores, confirmaciones y registro de auditoría.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
