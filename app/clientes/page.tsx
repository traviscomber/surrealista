import { ClientRepositoryDashboard } from '@/components/client-management/client-repository-dashboard'

export default function ClientesPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <ClientRepositoryDashboard />
      </div>
    </div>
  )
}
