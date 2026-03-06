import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home Spotter - Oportunidades de Inversión | Sur-Realista',
  description: 'Portal de oportunidades inmobiliarias con análisis de inversión y scores UF',
}

export default function HomeSpotterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
