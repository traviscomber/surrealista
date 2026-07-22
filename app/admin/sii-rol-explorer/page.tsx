import SiiRolExplorer from "@/components/sii-rol-explorer"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Explorador de roles SII | Sur Realista",
  description: "Consulta asistida de roles territoriales para uso interno.",
}

export default function SiiPage() {
  return (
    <main className="space-y-6">
      <WorkspaceHeading
        eyebrow="Información territorial"
        title="Explorador de roles SII"
        description="Consulta roles asociados a propiedades y organiza los antecedentes obtenidos desde el servicio oficial cuando la consulta está disponible."
        outcome="Un punto de partida para relacionar un rol con los registros territoriales internos y detectar qué información aún requiere verificación."
      />

      <SiiRolExplorer />

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            La consulta se ejecuta bajo demanda, puede requerir validación manual del SII y no reemplaza certificados, avalúos, escrituras ni otros antecedentes oficiales. La plataforma no debe automatizar consultas masivas ni completar información ausente por inferencia.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
