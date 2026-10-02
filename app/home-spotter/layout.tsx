import type { Metadata } from "next"
import { OperatingWorkspace } from "@/components/os/operating-workspace"

export const metadata: Metadata = {
  title: "Home Spotter - Oportunidades de Inversión | Sur-Realista",
  description: "Portal de oportunidades inmobiliarias con análisis de inversión y scores UF",
}

export default function HomeSpotterLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatingWorkspace>
      <div className="h-full overflow-auto p-4 sm:p-6">{children}</div>
    </OperatingWorkspace>
  )
}
