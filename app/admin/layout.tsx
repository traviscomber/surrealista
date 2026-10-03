import type React from "react"
import { ModuleOperatingShell } from "@/components/os/module-operating-shell"
import { AdminHeader } from "@/components/layout/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleOperatingShell>
      <div className="min-h-full bg-background">
        <AdminHeader />
        <main className="min-h-[calc(100dvh-100px)] bg-background">{children}</main>
      </div>
    </ModuleOperatingShell>
  )
}
