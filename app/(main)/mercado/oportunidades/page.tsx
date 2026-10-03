'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

import { ModuleTasksDock } from '@/components/tasks/module-tasks-dock'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'

function OpportunityLoading() {
  return (
    <section className="border-y border-border/70 py-6" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Calculando oportunidades</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Cruzando publicaciones, benchmark y evidencia territorial disponible.
          </p>
        </div>
      </div>
    </section>
  )
}

const OpportunityIntelligenceFeed = dynamic(
  () => import('@/components/portal/home-spotter-feed').then(mod => ({ default: mod.HomeSpotterFeed })),
  { ssr: false, loading: () => <OpportunityLoading /> }
)

export default function OpportunityIntelligencePage() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Mercado · Inteligencia de oportunidades"
        title="Inteligencia de Oportunidades"
        description="Detecta publicaciones con brechas relevantes frente a su benchmark de mercado y prioriza cuáles revisar primero con evidencia territorial."
        outcome="Entregar una cola corta de oportunidades con evidencia suficiente para decidir qué investigar primero."
      />
      <Suspense fallback={<OpportunityLoading />}>
        <OpportunityIntelligenceFeed />
      </Suspense>
      <ModuleTasksDock module="mercado" />
    </main>
  )
}
