import Link from "next/link"
import {
  AlertCircle,
  BookOpen,
  Database,
  ExternalLink,
  GitBranch,
  Layers,
  Server,
  ShieldCheck,
} from "lucide-react"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const architecture = [
  {
    icon: Layers,
    title: "Aplicación web",
    description: "Interfaz construida con Next.js, React y TypeScript, organizada mediante rutas, componentes reutilizables y módulos internos.",
  },
  {
    icon: Server,
    title: "Servicios de aplicación",
    description: "Rutas de servidor y servicios internos procesan consultas, sincronizaciones, cargas y operaciones administrativas.",
  },
  {
    icon: Database,
    title: "Persistencia",
    description: "Supabase se utiliza para autenticación, almacenamiento estructurado y acceso a registros operativos cuando la conexión está disponible.",
  },
  {
    icon: GitBranch,
    title: "Entrega",
    description: "El código se mantiene en GitHub y los cambios en la rama principal activan el proceso de despliegue asociado en Vercel.",
  },
]

const verifiedDomains = [
  {
    title: "Propiedades e inventario externo",
    records: "properties y properties_external",
    purpose: "Mantener propiedades internas y registros obtenidos desde fuentes externas habilitadas.",
  },
  {
    title: "Información territorial",
    records: "kmz_collection",
    purpose: "Guardar archivos KMZ, regiones, roles, límites y metadatos geográficos procesados.",
  },
  {
    title: "Operación comercial",
    records: "clientes, tareas y comunicaciones",
    purpose: "Apoyar seguimiento interno cuando los módulos y permisos correspondientes estén disponibles.",
  },
  {
    title: "Fuentes y sincronización",
    records: "registro compartido de scrapers",
    purpose: "Definir qué fuentes están activas, deshabilitadas o pendientes de validación.",
  },
]

const operatingPrinciples = [
  "No presentar una integración como activa solo porque exista código para ella.",
  "No exponer credenciales, tokens de acceso ni secretos en componentes del navegador.",
  "Distinguir registros confirmados, candidatos, datos externos y estados pendientes.",
  "Mostrar estados de carga, vacío y error sin reemplazarlos por datos de ejemplo.",
  "Validar cambios de esquema, sincronización y operaciones masivas antes de ejecutarlos en producción.",
  "No considerar un despliegue exitoso hasta que el check correspondiente finalice correctamente.",
]

const keyRoutes = [
  { route: "/", purpose: "Espacio de trabajo y acceso a módulos principales." },
  { route: "/cotizador", purpose: "Referencia interna de valor de una propiedad." },
  { route: "/asistente-ia", purpose: "Consultas sobre fuentes disponibles para la sesión." },
  { route: "/admin/dashboard", purpose: "Inventario, fuentes y control de sincronización." },
  { route: "/admin/surealista", purpose: "Inventario vigente obtenido desde Sur Realista." },
  { route: "/admin/kmz-collection", purpose: "Administración de la colección territorial KMZ." },
  { route: "/admin/sii-rol-explorer", purpose: "Consulta individual de roles SII." },
  { route: "/admin/owner-discovery", purpose: "Investigación de candidatos y evidencia pública." },
]

export default function DocumentacionTecnicaPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Referencia del sistema"
        title="Documentación técnica"
        description="Resumen verificable de la arquitectura, dominios operativos y criterios de mantenimiento de la plataforma interna."
        outcome="Permite comprender qué componentes existen, cómo se relacionan y qué precauciones deben observarse antes de modificar datos, fuentes o despliegues."
      />

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex gap-3 p-4 text-sm leading-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p><strong>Alcance:</strong> esta página describe únicamente elementos observables en el repositorio actual. No certifica que una integración externa, tabla o proceso esté disponible en todos los entornos.</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Arquitectura general</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Capas principales identificadas en la aplicación.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {architecture.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex gap-3 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Dominios de información</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Nombres y propósitos de los grupos de datos visibles en el código actual.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {verifiedDomains.map((domain) => (
            <Card key={domain.title}>
              <CardHeader>
                <CardTitle className="text-lg">{domain.title}</CardTitle>
                <CardDescription>{domain.records}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{domain.purpose}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Rutas operativas</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Accesos principales documentados en la navegación actual.</p>
        </div>
        <Card>
          <CardContent className="divide-y p-0">
            {keyRoutes.map((item) => (
              <div key={item.route} className="grid gap-2 px-5 py-4 md:grid-cols-[220px_1fr]">
                <code className="text-sm font-semibold text-foreground">{item.route}</code>
                <p className="text-sm leading-6 text-muted-foreground">{item.purpose}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Criterios de mantenimiento</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Reglas mínimas para mantener consistencia y seguridad operativa.</p>
        </div>
        <Card>
          <CardContent className="space-y-3 p-5">
            {operatingPrinciples.map((principle) => (
              <div key={principle} className="flex gap-3 text-sm leading-6">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>{principle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Fuentes de verdad</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Para confirmar implementación, revisar el repositorio, las migraciones disponibles, la configuración del entorno y el estado del despliegue. Esta página no reemplaza esas fuentes.</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">
              Revisar estado operativo
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
