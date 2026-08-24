import { AlertTriangle, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseCleanupPage() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Database className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Limpieza masiva deshabilitada</CardTitle>
          <CardDescription>
            Sur-Realista ya no permite borrar tablas completas desde la interfaz de administración.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            Las operaciones destructivas deben ejecutarse como cambios auditados, con alcance explícito, respaldo,
            evidencia previa y procedimiento de rollback. Esta pantalla se conserva sólo para dejar constancia del
            cambio de política operativa.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
