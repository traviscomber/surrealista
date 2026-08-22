import { AppHeader } from "@/components/layout/app-header"
import { TerritorialCoverageSummary } from "@/components/admin/territorial-coverage-summary"
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
          outcome="El equipo puede medir la cobertura del inventario completo, comparar profundidad de mercado y bajar desde una comuna a sus KMZ concretos."
        />
        <TerritorialCoverageSummary />
        <TerritorialIntelligencePanel />
      </main>
    </>
  )
}
