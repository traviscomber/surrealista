import { OperatingWorkspace } from "@/components/os/operating-workspace"
import { ClientRepositoryDashboard } from '@/components/client-management/client-repository-dashboard'

export default function ClientesPage() {
  return (
    <OperatingWorkspace>
      <div className="h-full overflow-auto bg-background p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <ClientRepositoryDashboard />
        </div>
      </div>
    </OperatingWorkspace>
  )
}
