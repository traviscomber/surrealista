import { CommunicationsManager } from "@/components/communications/communications-manager"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"

export default function CommunicationsPage() {
  return (
    <div className="h-full overflow-auto">
      <CommunicationsManager />
      <ModuleTasksDock module="multimedia" />
    </div>
  )
}
