import { Suspense } from 'react'
import { HomeSpotterFeed } from '@/components/portal/home-spotter-feed'

export const metadata = {
  title: 'Home Spotter - Oportunidades de Inversión',
  description: 'Descubre las mejores oportunidades inmobiliarias clasificadas por potencial de inversión',
}

export default function HomeSpotterFeedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Oportunidades de Inversión</h1>
        <p className="text-gray-600 mt-2">
          Descubre las mejores oportunidades inmobiliarias clasificadas por potencial de inversión
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Cargando oportunidades...</div>}>
        <HomeSpotterFeed />
      </Suspense>
    </div>
  )
}
