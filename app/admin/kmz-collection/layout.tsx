import type React from "react"
import { AdminHeader } from "@/components/layout/admin-header"

export default function KMZCollectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen dark bg-background flex flex-col h-screen">
      <AdminHeader />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
