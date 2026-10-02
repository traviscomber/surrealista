"use client"

import { ModuleOperatingShell } from "@/components/os/module-operating-shell"

export function OperatingWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh min-h-0 bg-background">
      <ModuleOperatingShell>{children}</ModuleOperatingShell>
    </div>
  )
}
