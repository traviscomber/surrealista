import { CommunicationsManager } from "@/components/communications/communications-manager"
import { ModuleTasksDock } from "@/components/tasks/module-tasks-dock"

export default function CommunicationsPage() {
  return (
    <>
      <CommunicationsManager />
      <ModuleTasksDock module="multimedia" />
    </>
  )
}
