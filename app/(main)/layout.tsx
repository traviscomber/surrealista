import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { VisitReminders } from "@/components/visits/visit-reminders"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-h-0">{children}</main>
      <Footer />
      <VisitReminders />
    </div>
  )
}
