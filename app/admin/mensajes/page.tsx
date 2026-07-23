import type { Metadata } from "next"
import { MessageSquareWarning } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export const metadata: Metadata = {
  title: "Mensajes | Sur Realista",
  description: "Estado del módulo interno de comunicaciones.",
}

export default function MessagesPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
      <WorkspaceHeading
        eyebrow="Operaciones internas"
        title="Mensajes y consultas"
        description="Este espacio centralizará las comunicaciones recibidas cuando exista una fuente de datos autorizada y un flujo operativo validado."
        outcome="El módulo permanece deshabilitado para evitar presentar mensajes, estados o acciones que todavía no han sido verificados en producción."
      />

      <Card className="max-w-3xl border-border/80 shadow-none">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40">
            <MessageSquareWarning className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="font-serif text-xl">Módulo no habilitado</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              La implementación heredada dependía de un cliente Supabase obsoleto y no existe evidencia suficiente del esquema, permisos ni trazabilidad requeridos.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Antes de activarlo se debe definir la tabla fuente, las políticas RLS, los responsables de respuesta, el historial de cambios y los estados operativos permitidos.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
