import { ClientRepositoryDashboard } from '@/components/client-management/client-repository-dashboard'
import { ModuleTasksDock } from '@/components/tasks/module-tasks-dock'

export default function ClientesPage() {
  return (
    <div className="h-full overflow-auto bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <ClientRepositoryDashboard />
      </div>
      <ModuleTasksDock module="clientes" />
    </div>
  )
}
