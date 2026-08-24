"use client"

import { AlertTriangle, ExternalLink, FolderLock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FileExplorer() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Google Drive</p>
        <h2 className="mt-1 text-2xl font-bold">Explorador de archivos</h2>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
            <FolderLock className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Acceso directo deshabilitado</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              El explorador anterior dependía de una credencial expuesta en el cliente y no podía autenticar de forma segura un Drive privado. La navegación de Drive debe realizarse mediante una integración OAuth del lado servidor.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No se muestran archivos simulados ni estados de sincronización no verificados.
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold">Estado</h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Autenticación</dt>
            <dd className="mt-1 font-medium">OAuth servidor requerido</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Archivos visibles</dt>
            <dd className="mt-1 font-medium">0 sin conexión verificada</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Datos simulados</dt>
            <dd className="mt-1 font-medium">Deshabilitados</dd>
          </div>
        </dl>
      </Card>

      <Button asChild variant="outline">
        <a href="https://drive.google.com" target="_blank" rel="noreferrer">
          Abrir Google Drive
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  )
}
