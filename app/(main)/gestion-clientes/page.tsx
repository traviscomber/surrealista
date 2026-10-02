import { ClientRepositoryDashboard } from "@/components/client-management/client-repository-dashboard"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"

export default function ClientManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClientRepositoryDashboard />
      <ModuleTasksDock module="clientes" />
    </div>
  )
}
