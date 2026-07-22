import { AlertTriangle, CheckCircle2, GitBranch, ShieldCheck, TerminalSquare } from "lucide-react"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Verificación del sistema",
  description: "Criterios seguros para validar la aplicación antes de producción.",
}

const checks = [
  {
    icon: GitBranch,
    title: "Integración continua",
    description: "Compilación, análisis estático y pruebas automatizadas deben ejecutarse en un entorno controlado y dejar resultados trazables.",
  },
  {
    icon: ShieldCheck,
    title: "Datos y permisos",
    description: "Las verificaciones de tablas, políticas y relaciones deben ejecutarse con credenciales de servicio autorizadas, nunca desde el navegador.",
  },
  {
    icon: TerminalSquare,
    title: "Pruebas operativas",
    description: "Scrapers, importaciones, procesos KMZ e integraciones deben validarse con registros reales y límites de ejecución definidos.",
  },
  {
    icon: CheckCircle2,
    title: "Aprobación de despliegue",
    description: "Solo se considera aprobada una versión cuando el despliegue termina correctamente y los flujos críticos han sido comprobados.",
  },
]

export default function SystemVerificationPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Preparación para producción"
        title="Verificación del sistema"
        description="Esta sección define cómo validar la aplicación sin exponer estructura de base de datos, errores internos ni credenciales en el cliente."
        outcome="Las pruebas técnicas quedan separadas de la interfaz operativa y deben ejecutarse mediante CI, scripts controlados o herramientas administrativas protegidas."
      />

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong>Protección aplicada:</strong> se deshabilitaron los diagnósticos de esquema y datos ejecutados directamente desde el navegador. La interfaz ya no consulta tablas internas para mostrar detalles técnicos de prueba.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <Card key={check.title}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                <check.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="pt-2 text-lg">{check.title}</CardTitle>
              <CardDescription className="leading-6">{check.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Condiciones mínimas de aprobación</CardTitle>
          <CardDescription>Estas condiciones requieren evidencia externa a esta pantalla.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>• Compilación de producción completada sin errores.</li>
            <li>• Rutas críticas comprobadas con autenticación y permisos reales.</li>
            <li>• Procesos de datos ejecutados sin registros de muestra ni respuestas simuladas.</li>
            <li>• Variables de entorno y credenciales verificadas fuera del repositorio.</li>
            <li>• Monitoreo, manejo de errores y procedimiento de reversión definidos.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
