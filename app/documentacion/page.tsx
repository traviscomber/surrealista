import DocumentsManager from "@/components/communications/documents-manager"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export default function DocumentosPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Evidencia y entregables"
        title="Documentos e informes"
        description="Centraliza antecedentes, evidencia documental y preparación de informes sin separar la trazabilidad del trabajo pendiente."
        outcome="Cada informe debe poder remontarse a fuentes verificables y cada pendiente documental debe tener responsable."
      />
      <DocumentsManager />
      <ModuleTasksDock module="documentos" />
    </main>
  )
}
