import { AppHeader } from "@/components/layout/app-header"
import { IncitiMarketPanel } from "@/components/admin/inciti-market-panel"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export default function IncitiMarketPage() {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
        <WorkspaceHeading
          eyebrow="Fuentes públicas"
          title="Inteligencia de mercado · Inciti"
          description="Prueba y opera la extracción de métricas inmobiliarias publicadas abiertamente por Inciti, sin usar su API comercial."
          outcome="Puedes validar un artículo en modo dry-run, persistir métricas estructuradas y revisar los registros guardados antes de automatizar la fuente."
        />
        <IncitiMarketPanel />
      </main>
    </>
  )
}
