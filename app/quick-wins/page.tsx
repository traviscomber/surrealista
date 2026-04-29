import { QuickOpportunityForm } from '@/components/quick-wins/quick-opportunity-form'
import { DocumentChecklist } from '@/components/quick-wins/document-checklist'
import { OfferManager } from '@/components/quick-wins/offer-manager'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuickWinsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quick Wins</h1>
          <p className="text-gray-600 mt-1">Herramientas rápidas para capturar oportunidades y gestionar transacciones</p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <QuickOpportunityForm />
          </div>
          <div>
            <DocumentChecklist />
          </div>
          <div>
            <OfferManager />
          </div>
        </div>
      </div>
    </div>
  )
}
