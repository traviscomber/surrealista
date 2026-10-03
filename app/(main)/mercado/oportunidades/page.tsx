'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const OpportunityIntelligenceFeed = dynamic(
  () => import('@/components/portal/home-spotter-feed').then(mod => ({ default: mod.HomeSpotterFeed })),
  { ssr: false, loading: () => <div className="py-8 text-center">Calculando oportunidades...</div> }
)

export default function OpportunityIntelligencePage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Mercado · Inteligencia de oportunidades</p>
        <h1 className="mt-2 text-3xl font-medium">Inteligencia de Oportunidades</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Detecta publicaciones con brechas relevantes frente a su benchmark de mercado y prioriza cuáles revisar primero con evidencia territorial.
        </p>
      </div>
      <Suspense fallback={<div className="py-8 text-center">Calculando oportunidades...</div>}>
        <OpportunityIntelligenceFeed />
      </Suspense>
    </div>
  )
}
