import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
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
    title: "Campos",
    description: "La vista principal: inventario propio, mapa, regiones, tags, vecinos, propietarios y detalle operativo.",
    href: "/campos",
    icon: Building2,
    links: ["Mapa", "Inventario SR", "Regiones", "Tags", "Vecinos", "Propietarios"],
    primary: true,
  },
  {
    title: "Inteligencia",
    description: "Profundiza un campo con KMZ, capas, roles, geocoding y lectura territorial.",
    href: "/kmz-analisis",
    icon: MapPinned,
    links: ["KMZ", "Territorio", "Roles", "Geocoding"],
  },
  {
    title: "Mercado",
    description: "Contrasta el campo con inventario externo, búsqueda, fuentes y comparables.",
    href: "/busqueda",
    icon: Search,
    links: ["Buscar", "Inventario externo", "Comparables", "Fuentes"],
  },
  {
    title: "Oportunidades",
    description: "Convierte información territorial en oportunidades, guardados y seguimiento.",
    href: "/home-spotter",
    icon: Radar,
    links: ["Spotter", "Pipeline", "Guardados"],
  },
  {
    title: "Valorización",
    description: "Valoriza un terreno con mercado, comparables, contexto y análisis.",
    href: "/cotizador",
    icon: Calculator,
    links: ["Cotizar", "Analizar", "Informe"],
  },
  {
    title: "Comercial",
    description: "Clientes, tareas, comunicaciones y decisiones que nacen desde los campos.",
    href: "/admin/operaciones-comerciales",
    icon: Users,
    links: ["Clientes", "Tareas", "Comunicaciones"],
  },
  {
    title: "Centro operativo",
    description: "Excepciones, actividad, calidad de datos y herramientas administrativas.",
    href: "/admin/dashboard",
    icon: BarChart3,
    links: ["Atención", "Estado de datos", "Herramientas"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        <section className="border-b bg-card">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-6 py-9 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 lg:py-12">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="secondary">Uso interno</Badge>
                <span className="text-sm text-muted-foreground">Sur Realista Intelligence</span>
              </div>
              <p className="sr-meta mb-3">Vista principal</p>
              <h1 className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.025em] sm:text-4xl lg:text-5xl">
                Parte por Campos. Desde ahí se conecta el resto de la inteligencia.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                El mapa e inventario de campos concentran la mayor cantidad de información. Mercado, territorio, oportunidades, valorización y operación comercial funcionan como capas alrededor de esa vista.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild size="lg">
                <Link href="/campos">Abrir Campos <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin/dashboard">Ver atención</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:px-12 lg:py-10">
          <div className="mb-6 flex flex-col gap-2 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="sr-meta">Flujo de trabajo</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Campos primero, módulos alrededor</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
              La primera decisión es territorial. Después eliges la capa que necesitas para ese campo.
            </p>
          </div>

          <div className="grid gap-x-8 border-b border-border md:grid-cols-2 xl:grid-cols-3">
            {domains.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`group border-t border-border py-6 transition-colors md:px-3 ${item.primary ? "bg-primary/[0.045]" : "hover:bg-card/60"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${item.primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-primary"}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                        {item.primary ? <Badge variant="outline">Principal</Badge> : null}
                      </div>
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
      </main>
    </div>
  )
}
