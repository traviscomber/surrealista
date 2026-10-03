import { ScrapedPropertiesDashboard } from "@/components/admin/scraped-properties-dashboard"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { ModuleRuntimeStrip } from "@/components/os/module-runtime-strip"

export const dynamic = "force-dynamic"

export default function MarketWorkspacePage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Inteligencia comercial"
        title="Mercado y comparables"
        description="Explora el inventario externo activo, filtra por fuente, ubicación y tipo de propiedad, y prepara comparables para una decisión comercial o valorización."
        outcome="Convierte señales de mercado reales en una lista corta de propiedades comparables y próximos pasos verificables."
      />
      <ModuleRuntimeStrip code="M05" agent="Agente Mercado" scope="Inventario · comparables · valorización" />

      <ScrapedPropertiesDashboard mode="full" />
      <ModuleTasksDock module="mercado" />
    </main>
  )
}
