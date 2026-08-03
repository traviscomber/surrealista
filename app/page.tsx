import Link from "next/link"
import { ArrowRight, BookOpen, Building2, MapPin, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const quickLinks = [
  {
    title: "CAMPOS",
    description: "Abrir el mapa territorial, expedientes, roles y trazabilidad predial.",
    href: "/campos",
    icon: MapPin,
    primary: true,
  },
  {
    title: "Centro operativo",
    description: "Acceder a clientes, tareas, comunicaciones y archivos.",
    href: "/busqueda?modulo=clientes",
    icon: Search,
  },
  {
    title: "Administración",
    description: "Gestionar KMZ, IA, usuarios y conexiones internas.",
    href: "/admin/dashboard",
    icon: Shield,
  },
  {
    title: "Documentación",
    description: "Consultar guías técnicas y operativas.",
    href: "/docs/usuario",
    icon: BookOpen,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_36%),linear-gradient(180deg,_rgba(2,6,23,0.04),_transparent)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Uso interno
          </Badge>
          <span className="text-sm text-muted-foreground">Plataforma territorial Sur-Realista</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border bg-background/80 px-4 py-2 shadow-sm backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Sur-Realista</p>
                <p className="text-xs text-muted-foreground">Inteligencia territorial y operación interna</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                CAMPOS es el centro de la operación territorial.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Explora predios, geometrías, roles, propietarios y documentos desde una vista principal diseñada para análisis diario y toma de decisiones.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/campos">
                  Abrir CAMPOS
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
                <Link href="/busqueda?modulo=clientes">
                  Ver otros módulos
                  <Search className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>

          <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {quickLinks.map((item) => (
              <Card
                key={item.title}
                className={item.primary
                  ? "border-primary/30 bg-primary/[0.06] shadow-sm"
                  : "border-border/60 bg-background/80 shadow-sm backdrop-blur"}
              >
                <CardHeader className="space-y-3">
                  <div className={item.primary
                    ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                    : "flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background"}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="ghost" className="w-full justify-between px-0 text-sm">
                    <Link href={item.href}>
                      Abrir
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </aside>
        </div>

        <div className="mt-10 grid gap-4 rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Mapa primero</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La exploración territorial y la selección de predios son el punto de entrada principal.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Expediente conectado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Roles, propietarios, documentos y geometrías se consultan en el mismo contexto.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Módulos de apoyo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clientes, tareas, comunicaciones y administración quedan disponibles sin competir con CAMPOS.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
