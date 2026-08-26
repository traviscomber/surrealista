import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Calculator,
  MapPinned,
  Radar,
  Search,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"

const domains = [
  {
    title: "Inicio",
    description: "Excepciones, actividad y próximas decisiones.",
    href: "/admin/dashboard",
    icon: BarChart3,
    links: ["Atención", "Estado de datos", "Herramientas"],
  },
  {
    title: "Campos",
    description: "Inventario propio, mapa, vecinos y propietarios.",
    href: "/campos",
    icon: Building2,
    links: ["Explorador", "Inventario SR", "Propietarios"],
  },
  {
    title: "Mercado",
    description: "Inventario externo, búsqueda, fuentes y comparables.",
    href: "/busqueda",
    icon: Search,
    links: ["Buscar", "Comparables", "Fuentes"],
  },
  {
    title: "Inteligencia",
    description: "KMZ, capas, geocoding y lectura territorial.",
    href: "/kmz-analisis",
    icon: MapPinned,
    links: ["KMZ", "Territorio", "Geocoding"],
  },
  {
    title: "Oportunidades",
    description: "Spotter, pipeline, guardados y seguimiento.",
    href: "/home-spotter",
    icon: Radar,
    links: ["Spotter", "Pipeline", "Guardados"],
  },
  {
    title: "Comercial",
    description: "Clientes, tareas, comunicaciones y operación diaria.",
    href: "/admin/operaciones-comerciales",
    icon: Users,
    links: ["Clientes", "Tareas", "Comunicaciones"],
  },
  {
    title: "Valorización",
    description: "Cotizador, análisis de terreno e informes.",
    href: "/cotizador",
    icon: Calculator,
    links: ["Cotizar", "Analizar", "Informe"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        <section className="border-b bg-card">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 lg:py-14">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="secondary">Uso interno</Badge>
                <span className="text-sm text-muted-foreground">Sur Realista Intelligence</span>
              </div>
              <p className="sr-meta mb-3">Centro de operación</p>
              <h1 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.025em] sm:text-4xl lg:text-5xl">
                Todo Sur Realista, organizado por función.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Accede a campos, mercado, inteligencia territorial, oportunidades, operación comercial y valorización desde una sola portada.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild>
                <Link href="/admin/dashboard">Ver qué requiere atención <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/cotizador">Valorizar terreno</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-6 py-10 lg:px-12 lg:py-12">
          <div className="mb-7 flex flex-col gap-2 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="sr-meta">Módulos del producto</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Qué puedes hacer</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
              Siete áreas principales. Las funciones específicas viven dentro de cada una para evitar un menú interminable.
            </p>
          </div>

          <div className="grid gap-x-8 border-b border-border md:grid-cols-2 xl:grid-cols-3">
            {domains.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group border-t border-border py-6 transition-colors hover:bg-card/60 md:px-3"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {item.links.map((link) => <span key={link}>{link}</span>)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t bg-secondary/35">
          <div className="mx-auto grid w-full max-w-[1280px] gap-5 px-6 py-8 md:grid-cols-[1fr_auto] md:items-center lg:px-12">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium"><BriefcaseBusiness className="h-4 w-4" /> Operación diaria</div>
              <p className="mt-1 text-sm text-muted-foreground">Si solo quieres saber qué hacer ahora, entra al Centro Operativo.</p>
            </div>
            <Button asChild variant="outline"><Link href="/admin/dashboard">Abrir Centro Operativo</Link></Button>
          </div>
        </section>
      </main>
    </div>
  )
}
