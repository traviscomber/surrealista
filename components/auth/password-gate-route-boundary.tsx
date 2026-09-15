"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { PasswordGate } from "@/components/auth/password-gate"

export function PasswordGateRouteBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return <PasswordGate key={pathname}>{children}</PasswordGate>
}
