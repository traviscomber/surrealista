import { ClientRepositoryDashboard } from '@/components/client-management/client-repository-dashboard'
import { ModuleTasksDock } from '@/components/tasks/module-tasks-dock'
import { WorkspaceHeading } from '@/components/ui/workspace-heading'
import { ModuleRuntimeStrip } from '@/components/os/module-runtime-strip'

export default function ClientesPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHeading
        eyebrow="Relaciones comerciales"
        title="Clientes"
        description="Consulta personas, empresas, intereses, contacto y contexto comercial desde una vista operativa única."
        outcome="Cada cliente debe mostrar suficiente contexto para entender su relación, prioridad y próximo paso."
      />
      <ModuleRuntimeStrip code="M02" agent="Agente Clientes" scope="Relaciones · seguimiento · contexto" />
      <ClientRepositoryDashboard />
      <ModuleTasksDock module="clientes" />
    </main>
  )
}
