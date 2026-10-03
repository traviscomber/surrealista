import type { Metadata } from "next"
import { OperatingWorkspace } from "@/components/os/operating-workspace"

export const metadata: Metadata = {
  title: "Inteligencia de Oportunidades | Sur Realista",
  description: "Ruta legacy redirigida a la inteligencia de oportunidades de Mercado.",
}

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return <OperatingWorkspace>{children}</OperatingWorkspace>
}
