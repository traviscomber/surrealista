import type { Metadata } from "next"
import RealDataMigrationDashboard from "@/components/data-migration/real-data-migration-dashboard"

export const metadata: Metadata = {
  title: "Migración Data Real | Sur-Realista Admin",
  description: "Sistema de migración preparado para recibir los 5 casos de éxito reales en 2 días",
}

export default function MigracionDataRealPage() {
  return (
    <div className="container mx-auto py-6">
      <RealDataMigrationDashboard />
    </div>
  )
}
