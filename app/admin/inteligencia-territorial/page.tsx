import { AppHeader } from "@/components/layout/app-header"
import { TerritorialIntelligencePanel } from "@/components/admin/territorial-intelligence-panel"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export default function TerritorialIntelligencePage() {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
        <WorkspaceHeading
          eyebrow="Uso interno · Sur Realista"
          title="Inteligencia territorial"
          description="Prioriza comunas para investigación comercial usando señales públicas estructuradas del Data Hub de Inciti y métricas operacionales de Sur Realista."
          outcome="El equipo puede comparar profundidad de mercado y cobertura antes de abrir una investigación de terreno, KMZ o propietario."
        />
        <TerritorialIntelligencePanel />
      </main>
    </>
  )
}
