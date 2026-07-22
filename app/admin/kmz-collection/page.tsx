import { KMZCollectionManager } from "@/components/kmz/kmz-collection-manager"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export const metadata = {
  title: "Colección KMZ",
  description: "Administración interna de archivos territoriales, roles y procesos de indexación.",
}

export default function KMZCollectionPage() {
  return (
    <main className="kmz-workspace container mx-auto space-y-6 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Información territorial"
        title="Colección KMZ"
        description="Administra archivos geográficos, regiones, roles, polígonos y antecedentes de contacto asociados a la colección interna."
        outcome="Podrás revisar la cobertura disponible, localizar archivos, corregir asignaciones y ejecutar procesos técnicos con resultados verificables."
      />

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong>Operación:</strong> las acciones de procesamiento, corrección regional y reindexación pueden afectar toda la colección. Revisa el alcance y el resultado informado antes de ejecutar otra acción masiva.
          </p>
        </CardContent>
      </Card>

      <style>{`
        .kmz-workspace > .min-h-screen {
          min-height: auto;
          background: transparent;
        }

        .kmz-workspace > .min-h-screen > .container {
          max-width: none;
          padding: 0;
        }

        .kmz-workspace > .min-h-screen > .container > .space-y-3:first-child,
        .kmz-workspace > .min-h-screen > .container > .relative.overflow-hidden.bg-gradient-to-r {
          display: none;
        }

        .kmz-workspace button {
          box-shadow: none;
        }
      `}</style>

      <KMZCollectionManager />
    </main>
  )
}
