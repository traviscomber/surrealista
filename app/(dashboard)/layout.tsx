import type React from "react"
import { ModuleOperatingShell } from "@/components/os/module-operating-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleOperatingShell>
      <div className="min-h-full bg-background p-4 sm:p-6">{children}</div>
    </ModuleOperatingShell>
  )
}
