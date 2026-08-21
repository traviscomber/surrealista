import type { Metadata } from "next"
import { AppHeader } from "@/components/layout/app-header"
import { CommercialOperationsCenter } from "@/components/admin/commercial-operations-center"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Operaciones comerciales | Sur-Realista",
  description: "Centro interno para priorizar campos, oportunidades y seguimientos comerciales.",
}

export default function CommercialOperationsPage() {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto space-y-8 px-4 py-8 md:py-10">
        <WorkspaceHeading
          eyebrow="Centro de operaciones"
          title="Operaciones comerciales"
          description="Conecta campos detectados, calidad del dato, oportunidades y tareas para decidir qué gestionar primero."
          outcome="Juan obtiene una cola diaria única: qué registro completar, qué propietario investigar y qué seguimiento resolver."
        />
        <CommercialOperationsCenter />
      </main>
    </>
  )
}
