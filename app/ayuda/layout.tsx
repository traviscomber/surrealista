import type React from "react"
import { PublicSupportShell } from "@/components/os/public-support-shell"

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <PublicSupportShell>{children}</PublicSupportShell>
}
