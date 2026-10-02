import type React from "react"
import { ModuleOperatingShell } from "@/components/os/module-operating-shell"

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ModuleOperatingShell>{children}</ModuleOperatingShell>
}
