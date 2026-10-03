import type React from "react"
import { OperatingWorkspace } from "@/components/os/operating-workspace"

export default function LegacyToolLayout({ children }: { children: React.ReactNode }) {
  return <OperatingWorkspace>{children}</OperatingWorkspace>
}
