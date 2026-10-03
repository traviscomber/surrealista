import type React from "react"
import { ModuleOperatingShell } from "@/components/os/module-operating-shell"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ModuleOperatingShell>{children}</ModuleOperatingShell>
}
