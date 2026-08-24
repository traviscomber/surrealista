"use client"

import type { LucideIcon } from "lucide-react"
import { Bot, Cloud, Database, Globe2, ServerCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

 type IntegrationState = "runtime" | "optional" | "external"

type Integration = {
  id: string
  name: string
  description: string
  state: IntegrationState
  icon: LucideIcon
  details: Array<{ label: string; value: string }>
}

const integrations: Integration[] = [
  {
    id: "supabase",
    name: "Supabase",
    description: "Base canónica, storage y operaciones server-side de CAMPOS.",
    state: "runtime",
    icon: Database,
    details: [
      { label: "Credenciales", value: "Variables de entorno del servidor" },
      { label: "Acceso privilegiado", value: "Service role sólo en backend" },
      { label: "Estado", value: "Se valida por consultas reales, no por un switch local" },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Fuente documental opcional mediante OAuth del lado servidor.",
    state: "optional",
    icon: Cloud,
    details: [
      { label: "Autenticación", value: "OAuth servidor" },
      { label: "Cliente", value: "Sin API keys embebidas" },
      { label: "Sin conexión", value: "La UI muestra estado no disponible; no simula archivos" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI / AI SDK",
    description: "Copiloto CAMPOS para consultas sobre contexto y datos reales del sistema.",
    state: "runtime",
    icon: Bot,
    details: [
      { label: "Uso", value: "CAMPOS Agent" },
      { label: "Datos", value: "Herramientas consultan Supabase en servidor" },
      { label: "Métricas", value: "No se muestran consumos inventados en esta pantalla" },
    ],
  },
  {
    id: "ciren",
    name: "CIREN / IDE Minagri",
    description: "Contexto territorial de propiedades rurales y suelos agrológicos.",
    state: "external",
    icon: Globe2,
    details: [
      { label: "Modo", value: "Catálogo público en vivo con fallback verificado" },
      { label: "Persistencia", value: "Snapshots sanitizados para continuidad" },
      { label: "Alcance", value: "Referencia territorial; no acredita dominio" },
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Build, despliegue, funciones y cron del producto.",
    state: "runtime",
    icon: ServerCog,
    details: [
      { label: "Build", value: "Next.js con TypeScript y lint obligatorios" },
      { label: "Crons", value: "Rutas protegidas por CRON_SECRET" },
      { label: "Producción", value: "El estado se verifica en deployment/runtime, no se hardcodea" },
    ],
  },
]

function stateLabel(state: IntegrationState) {
  if (state === "runtime") return "Runtime"
  if (state === "optional") return "Opcional"
  return "Fuente externa"
}

export function IntegrationsManagement() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Arquitectura operacional</p>
        <h1 className="mt-1 text-3xl font-bold">Integraciones</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Esta vista documenta conexiones reales del producto. No permite cambiar estados localmente y no muestra cuotas, cuentas ni sincronizaciones inventadas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <Card key={integration.id} className="shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="mt-1 leading-5">{integration.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{stateLabel(integration.state)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  {integration.details.map((detail) => (
                    <div key={detail.label} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                      <dt className="text-muted-foreground">{detail.label}</dt>
                      <dd className="font-medium text-foreground">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
