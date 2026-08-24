"use client"

import Link from "next/link"
import { Database, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"

export function OwnerDiscoveryDashboard() {
  return (
    <div className="space-y-7 p-6 md:p-8">
      <WorkspaceHeading
        eyebrow="Evidencia territorial"
        title="Propietarios: investigación automática retirada"
        description="Sur-Realista ya no genera ni puntúa candidatos de propietario a partir de nombres de archivos, búsquedas web o análisis automático."
        outcome="Los datos de propietario sólo deben incorporarse cuando exista respaldo documental o catastral verificable."
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Política activa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>No se muestran scores de confianza, candidatos web ni inferencias de propietario.</p>
          <p>Un ROL, una geometría o un predio vecino no acreditan dominio por sí solos.</p>
          <p>Cuando exista evidencia válida, debe conservarse su fuente y trazabilidad documental.</p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Contexto territorial disponible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            CAMPOS mantiene el KMZ como geometría principal y puede complementar el expediente con referencias territoriales CIREN, incluyendo ROL/comuna publicados y clases de capacidad de uso de suelo cuando exista cobertura.
          </p>
          <Button asChild variant="outline">
            <Link href="/campos">
              Abrir CAMPOS
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
