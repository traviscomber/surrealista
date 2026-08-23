import RealDriveConnector from "@/components/google-drive/real-drive-connector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Info } from "lucide-react"

export const dynamic = "force-dynamic"

export default function GoogleDrivePage() {
  const configured = Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim(),
  )

  return (
    <main className="container mx-auto space-y-6 px-4 py-8 md:py-10">
      <section className="space-y-2 border-b border-border/70 pb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Cloud className="h-4 w-4" />
          Integración opcional
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Google Drive</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          Conecta Google Drive cuando el equipo necesite navegar la carpeta documental original. El resto de
          Sur-Realista funciona normalmente aunque esta integración no esté configurada o conectada.
        </p>
      </section>

      {!configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Google Drive no configurado</CardTitle>
            <CardDescription>Estado esperado y no bloqueante.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Integración desactivada</AlertTitle>
              <AlertDescription className="leading-6">
                Para habilitarla se configuran GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET y
                GOOGLE_DRIVE_ROOT_FOLDER_ID en el entorno de servidor. No se requiere Google Drive para usar los
                módulos principales del sistema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <RealDriveConnector />
      )}
    </main>
  )
}
