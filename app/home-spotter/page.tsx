'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const HomeSpotterFeed = dynamic(
  () => import('@/components/portal/home-spotter-feed').then(mod => ({ default: mod.HomeSpotterFeed })),
  { ssr: false, loading: () => <div className="py-8 text-center">Calculando oportunidades...</div> }
)

export default function HomeSpotterFeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Oportunidades · Inteligencia comercial</p>
        <h1 className="mt-2 text-3xl font-medium">Oportunidades reales de terrenos</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Detecta avisos publicados bajo su benchmark de mercado y prioriza dónde conviene revisar primero. El detalle cruza mercado, vecinos y KMZ.
        </p>
      </div>
      <Suspense fallback={<div className="py-8 text-center">Calculando oportunidades...</div>}>
        <HomeSpotterFeed />
      </Suspense>
    </div>
  )
}
