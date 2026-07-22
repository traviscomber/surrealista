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
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .kmz-workspace > .min-h-screen > .container > .space-y-3:first-child,
        .kmz-workspace > .min-h-screen > .container > .relative.overflow-hidden.bg-gradient-to-r {
          display: none;
        }

        .kmz-workspace .shadow-xl,
        .kmz-workspace .shadow-lg,
        .kmz-workspace .shadow-sm,
        .kmz-workspace button {
          box-shadow: none !important;
        }

        .kmz-workspace .backdrop-blur-sm {
          backdrop-filter: none !important;
        }

        .kmz-workspace .hover\\:scale-\\[1\\.02\\]:hover,
        .kmz-workspace .hover\\:-translate-y-1:hover {
          transform: none !important;
        }

        .kmz-workspace .border-0 {
          border-width: 1px !important;
          border-color: hsl(var(--border)) !important;
        }

        .kmz-workspace .bg-purple-100,
        .kmz-workspace .bg-green-100,
        .kmz-workspace .bg-blue-100,
        .kmz-workspace .bg-orange-100,
        .kmz-workspace .bg-slate-100,
        .kmz-workspace .bg-blue-50,
        .kmz-workspace .bg-orange-50,
        .kmz-workspace .bg-slate-50 {
          background: hsl(var(--muted) / 0.55) !important;
        }

        .kmz-workspace .text-purple-600,
        .kmz-workspace .text-purple-700,
        .kmz-workspace .text-green-600,
        .kmz-workspace .text-green-700,
        .kmz-workspace .text-blue-600,
        .kmz-workspace .text-blue-700,
        .kmz-workspace .text-orange-600,
        .kmz-workspace .text-orange-700,
        .kmz-workspace .text-slate-600,
        .kmz-workspace .text-slate-700,
        .kmz-workspace .text-slate-500,
        .kmz-workspace .text-slate-400 {
          color: hsl(var(--muted-foreground)) !important;
        }

        .kmz-workspace .bg-yellow-50,
        .kmz-workspace .bg-red-50 {
          background: hsl(var(--muted) / 0.45) !important;
        }

        .kmz-workspace .border-yellow-400,
        .kmz-workspace .border-yellow-200,
        .kmz-workspace .border-red-200,
        .kmz-workspace .border-blue-200,
        .kmz-workspace .border-slate-200 {
          border-color: hsl(var(--border)) !important;
        }

        .kmz-workspace .text-yellow-600,
        .kmz-workspace .text-yellow-700,
        .kmz-workspace .text-yellow-800,
        .kmz-workspace .text-red-600,
        .kmz-workspace .text-red-700 {
          color: hsl(var(--foreground)) !important;
        }

        .kmz-workspace .bg-gradient-to-r {
          background-image: none !important;
          background-color: hsl(var(--primary)) !important;
        }

        .kmz-workspace .rounded-2xl,
        .kmz-workspace .rounded-xl {
          border-radius: var(--radius) !important;
        }

        .kmz-workspace [class*="bg-green-500"],
        .kmz-workspace [class*="bg-purple-600"],
        .kmz-workspace [class*="bg-orange-600"] {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        .kmz-workspace [class*="hover:bg-green"],
        .kmz-workspace [class*="hover:bg-purple"],
        .kmz-workspace [class*="hover:bg-orange"] {
          transition: background-color 150ms ease;
        }

        .kmz-workspace input::placeholder {
          color: hsl(var(--muted-foreground));
        }
      `}</style>

      <KMZCollectionManager />
    </main>
  )
}
