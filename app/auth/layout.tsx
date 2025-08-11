import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Autenticación | Sur-Realista",
  description: "Inicia sesión o regístrate en Sur-Realista",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">{children}</div>
    </div>
  )
}
