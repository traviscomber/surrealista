import type { Metadata } from "next"
import { OperatingWorkspace } from "@/components/os/operating-workspace"

export const metadata: Metadata = {
  title: "Inteligencia de Oportunidades | Sur Realista",
  description: "Inteligencia comercial de oportunidades con benchmark, evidencia territorial y trazabilidad",
}

export default function HomeSpotterLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatingWorkspace>
      <div className="h-full overflow-auto p-4 sm:p-6">{children}</div>
    </OperatingWorkspace>
  )
}
