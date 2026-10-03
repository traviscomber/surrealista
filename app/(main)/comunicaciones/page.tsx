import { CommunicationsManager } from "@/components/communications/communications-manager"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"

export default function CommunicationsPage() {
  return (
    <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <CommunicationsManager />
      <ModuleTasksDock module="multimedia" />
    </main>
  )
}
