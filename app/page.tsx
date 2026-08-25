import Link from "next/link"
import { ArrowRight, BarChart3, Building2, Eye, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const quickLinks = [
  { title: "Operaciones comerciales", description: "Alertas, watchlist, tareas y próximas decisiones.", href: "/admin/operaciones-comerciales", icon: BarChart3 },
  { title: "Campos y vecinos", description: "Inventario, propietarios, relaciones y contexto de cada terreno.", href: "/campos", icon: Building2 },
  { title: "Inteligencia territorial", description: "KMZ, roles, capas, mapas y evidencia geográfica.", href: "/kmz-analisis", icon: MapPin },
  { title: "Valorización de terrenos", description: "Mercado, comparables, vecinos, noticias y recomendación SR.", href: "/cotizador", icon: Eye },
  { title: "Mercado", description: "Inventario externo, fuentes y búsqueda comercial.", href: "/busqueda", icon: Search },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-card">
        <div className="mx-auto grid min-h-[64vh] w-full max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:px-12 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <Badge variant="secondary">Uso interno</Badge>
              <span className="text-sm text-muted-foreground">Sur Realista Intelligence</span>
            </div>
            <p className="sr-meta mb-4">Inteligencia territorial y comercial</p>
            <h1 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Decisiones de terreno con mercado, territorio y evidencia en un solo lugar.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
              Plataforma interna de Sur Realista para analizar campos, valorizar terrenos, revisar vecinos, seguir oportunidades y priorizar acciones comerciales.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/admin/operaciones-comerciales">Abrir operaciones <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/cotizador">Valorizar terreno</Link>
              </Button>
            </div>
          </div>

          <div className="border-l border-border pl-6 lg:pl-10">
            <p className="sr-meta">Centro de decisión</p>
            <p className="mt-4 text-2xl font-medium leading-snug tracking-tight">
              Qué cambió, qué terreno revisar y qué acción tomar después.
            </p>
          </div>
        </div>
      </section>

      <section className="sr-section-secondary">
        <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="sr-meta">Sistema interno</p>
              <h2 className="sr-section-title mt-3">Capacidades principales</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:justify-self-end">
              Un mismo lenguaje para operar Sur Realista: inteligencia territorial, valorización de terrenos, mercado, campos y vecinos, y seguimiento comercial.
            </p>
          </div>

          <div className="divide-y divide-border">
            {quickLinks.map((item) => (
              <Link key={item.title} href={item.href} className="group grid gap-4 py-7 transition-colors hover:bg-card/55 md:grid-cols-[56px_1fr_auto] md:items-center md:px-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
