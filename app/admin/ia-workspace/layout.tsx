import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Espacio de Trabajo IA | Sur-Realista Admin",
  description: "Gestión de inteligencia artificial para Sur-Realista",
}

export default function IAWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  )
}
