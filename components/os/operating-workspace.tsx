import { ModuleOperatingShell } from "@/components/os/module-operating-shell"

export function OperatingWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <ModuleOperatingShell>{children}</ModuleOperatingShell>
    </div>
  )
}
