import { Suspense } from "react"
import type { Metadata } from "next"
import { OpportunitiesFeed } from "@/components/portal/opportunities-feed"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export const metadata: Metadata = {
  title: "Oportunidades | Sur Realista",
  description: "Revisión interna de oportunidades territoriales e inmobiliarias.",
}

export default function OpportunitiesPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
      <WorkspaceHeading
        eyebrow="Análisis interno"
        title="Oportunidades"
        description="Consulta oportunidades disponibles y revisa sus antecedentes antes de incorporarlas a un proceso comercial o territorial."
        outcome="Obtienes una vista ordenada para comparar registros y determinar cuáles requieren validación o seguimiento."
      />

      <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando oportunidades…</div>}>
        <OpportunitiesFeed />
      </Suspense>
    </main>
  )
}
