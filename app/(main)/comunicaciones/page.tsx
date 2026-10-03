import { CommunicationsManager } from "@/components/communications/communications-manager"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { ModuleRuntimeStrip } from "@/components/os/module-runtime-strip"

export default function CommunicationsPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Contenido y comunicación"
        title="Multimedia"
        description="Prepara packs de publicaciones, piezas de comunicación, seguimiento y presentaciones sin separar el contexto comercial."
        outcome="Cada contenido debe quedar asociado a una intención, responsable y próximo paso verificable."
      />
      <ModuleRuntimeStrip code="M03" agent="Agente Contenido" scope="Packs · seguimiento · presentaciones" />
      <CommunicationsManager />
      <ModuleTasksDock module="multimedia" />
    </main>
  )
}
