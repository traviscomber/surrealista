import { ValuationEngine } from '@/components/features/valuation-engine/valuation-engine'

export const metadata = {
  title: 'Tasaciones | Sur Realista',
  description: 'Motor de tasaciones automáticas'
}

export default function ValuationsPage() {
  return (
    <div className="min-h-screen">
      <ValuationEngine />
    </div>
  )
}
