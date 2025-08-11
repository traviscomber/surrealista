import { Suspense } from "react"
import DatabaseSchemaVerifier from "@/scripts/verify-database-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Loader2 } from "lucide-react"

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-96 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando verificador de esquema...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifySchemaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <DatabaseSchemaVerifier />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: "Verificar Esquema de Base de Datos - Sur Realista Admin",
  description: "Verifica que todas las tablas y columnas requeridas estén presentes en Supabase",
}
