import Link from "next/link"
import {
  Bot,
  Building2,
  Calculator,
  Database,
  FileText,
  HelpCircle,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react"
import { WorkspaceHeading } from "@/components/ui/workspace-heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const verifiedTools = [
  {
    icon: Search,
    title: "Explorador de Campos",
    description: "Accede desde un mismo espacio a campos, clientes, comunicaciones, tareas, documentos y antecedentes territoriales.",
    result: "Permite ubicar el módulo correcto y trabajar con la información disponible en cada fuente.",
    href: "/",
    action: "Abrir explorador",
  },
  {
    icon: Store,
    title: "Inventario Sur Realista",
    description: "Consulta las propiedades vigentes obtenidas desde la fuente oficial de Sur Realista.",
    result: "Entrega el inventario publicado, fecha de sincronización y acceso a la publicación original.",
    href: "/admin/surealista",
    action: "Revisar inventario",
  },
  {
    icon: Calculator,
    title: "Referencia de valor",
    description: "Organiza datos de una propiedad y calcula una referencia interna con los antecedentes disponibles.",
    result: "Entrega un rango estimado, valor unitario, confianza, metodología y fuentes declaradas por el cálculo.",
    href: "/cotizador",
    action: "Abrir cotizador",
  },
  {
    icon: Database,
    title: "Roles SII",
    description: "Apoya la consulta individual de roles mediante el servicio oficial correspondiente.",
    result: "Entrega antecedentes de consulta que deben contrastarse con documentación oficial.",
    href: "/admin/sii-rol-explorer",
    action: "Consultar roles",
  },
  {
    icon: Users,
    title: "Descubrimiento de propietarios",
    description: "Organiza candidatos y evidencia pública relacionada con archivos territoriales y roles.",
    result: "Entrega pistas de investigación; no acredita dominio ni reemplaza certificados o escrituras.",
    href: "/admin/owner-discovery",
    action: "Abrir investigación",
  },
  {
    icon: MapPin,
    title: "Colección KMZ",
    description: "Administra archivos territoriales, sus regiones, roles, polígonos y procesos de indexación.",
    result: "Permite mantener ordenada y consultable la colección geográfica interna.",
    href: "/admin/kmz-collection",
    action: "Administrar KMZ",
  },
  {
    icon: Bot,
    title: "Asistente de análisis",
    description: "Permite formular preguntas sobre las fuentes que estén disponibles para la sesión.",
    result: "Entrega una respuesta de apoyo que debe validarse contra los registros y documentos originales.",
    href: "/asistente-ia",
    action: "Abrir asistente",
  },
  {
    icon: Building2,
    title: "Panel de datos",
    description: "Reúne inventario externo, sincronización de fuentes y control operativo de propiedades.",
    result: "Permite revisar cobertura, estado de las fuentes y registros disponibles para análisis.",
    href: "/admin/dashboard",
    action: "Abrir panel",
  },
]

const operatingRules = [
  {
    title: "Trabajar solo con información disponible",
    description: "Cuando una fuente no entregue precio, superficie, ubicación, imagen o evidencia, la plataforma debe indicarlo explícitamente en vez de completar el dato.",
  },
  {
    title: "Validar antecedentes sensibles",
    description: "Los candidatos de propietario, referencias de valor y resultados de búsqueda no reemplazan certificados, escrituras, avalúos ni otros antecedentes oficiales.",
  },
  {
    title: "Revisar la fuente original",
    description: "Cuando exista un enlace de evidencia o publicación, úsalo para confirmar vigencia, contexto y exactitud antes de tomar una decisión.",
  },
  {
    title: "Interpretar estados operativos",
    description: "Pendiente, sin evidencia, no disponible o error de sincronización son estados reales del proceso y no deben interpretarse como datos confirmados.",
  },
]

export default function AyudaPage() {
  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <WorkspaceHeading
        eyebrow="Orientación interna"
        title="Centro de ayuda"
        description="Guía de acceso a las herramientas verificadas del espacio de trabajo Sur Realista y a los criterios necesarios para interpretar sus resultados."
        outcome="Podrás identificar qué módulo usar, qué resultado entrega y qué información requiere validación adicional."
      />

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Herramientas disponibles</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cada acceso describe únicamente capacidades presentes en la plataforma. La disponibilidad final depende de las conexiones, permisos y datos cargados.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {verifiedTools.map((tool) => (
            <Card key={tool.title} className="border-border/70">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                    <tool.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="mt-1 leading-5">{tool.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3 text-sm leading-5">
                  <span className="font-semibold">Resultado:</span> {tool.result}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={tool.href}>{tool.action}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Criterios de uso</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estas reglas ayudan a mantener la calidad y trazabilidad de la información interna.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {operatingRules.map((rule) => (
            <Card key={rule.title}>
              <CardContent className="flex gap-3 p-5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{rule.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">¿Una herramienta no entrega resultados?</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa primero el estado de la fuente en el Panel de datos. Un resultado vacío puede indicar que no existen registros, que faltan permisos o que la sincronización no está disponible.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/dashboard">
              <FileText className="mr-2 h-4 w-4" />
              Revisar fuentes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
