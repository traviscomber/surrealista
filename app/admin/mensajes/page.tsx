import { Suspense } from "react"
import type { Metadata } from "next"
import { MessagesTable } from "@/components/admin/messages/messages-table"
import { MessagesStats } from "@/components/admin/messages/messages-stats"
import { MessagesFilters } from "@/components/admin/messages/messages-filters"
import { MessagesTableSkeleton } from "@/components/admin/messages/messages-table-skeleton"

export const metadata: Metadata = {
  title: "Gestión de Mensajes | Sur-Realista Admin",
  description: "Administra todos los mensajes y consultas de usuarios de Sur-Realista",
}

export default async function MessagesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensajes y Consultas</h1>
          <p className="text-muted-foreground">Gestiona todas las comunicaciones con los usuarios de la plataforma</p>
        </div>
      </div>

      <MessagesStats />

      <MessagesFilters />

      <Suspense fallback={<MessagesTableSkeleton />}>
        <MessagesTable />
      </Suspense>
    </div>
  )
}
