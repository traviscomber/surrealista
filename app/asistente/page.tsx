import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { OperatingWorkspace } from "@/components/os/operating-workspace"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export default function AssistantPage() {
  return (
    <OperatingWorkspace>
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <WorkspaceHeading
            eyebrow="Inteligencia transversal"
            title="Asistente Sur Realista"
            description="Consulta Campos, Clientes, Multimedia, Documentos y Mercado desde un solo punto de entrada."
            outcome="La respuesta debe indicar qué fuentes fueron usadas y qué información no está disponible."
          />
          <section className="min-h-0 flex-1 overflow-hidden border border-border/80 bg-card">
            <AIAssistantChat />
          </section>
      </div>
    </OperatingWorkspace>
  )
}
