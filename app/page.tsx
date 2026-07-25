import Link from "next/link"
import { ArrowRight, BookOpen, Building2, MapPin, Search, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const quickLinks = [
  {
    title: "Operación diaria",
    description: "Abrir búsqueda, clientes, tareas y comunicaciones.",
    href: "/busqueda",
    icon: Search,
  },
  {
    title: "Administración",
    description: "Ir al panel interno, KMZ, IA y conexiones.",
    href: "/admin/dashboard",
    icon: Shield,
  },
  {
    title: "Documentación",
    description: "Consultar guías técnicas y de uso.",
    href: "/docs/usuario",
    icon: BookOpen,
  },
  {
    title: "Análisis KMZ",
    description: "Entrar a vecindario, roles y mapas.",
    href: "/kmz-analisis",
    icon: MapPin,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(180deg,_rgba(2,6,23,0.03),_transparent)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Uso interno
          </Badge>
          <span className="text-sm text-muted-foreground">Centro operativo de Sur-Realista</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border bg-background/80 px-4 py-2 shadow-sm backdrop-blur">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Sur-Realista</p>
                <p className="text-xs text-muted-foreground">Interfaz interna para operación y administración</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Entra al panel interno sin ruido.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Accede rápido a búsqueda, administración, documentación y análisis KMZ desde una sola pantalla.
                La interfaz está pensada para trabajo diario, no para presentación pública.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/busqueda">
                  Abrir operación
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
                <Link href="/admin/dashboard">
                  Ir a administración
                  <Shield className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {quickLinks.map((item) => (
              <Card key={item.title} className="border-border/60 bg-background/80 shadow-sm backdrop-blur">
                <CardHeader className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    <item.icon className="h-5 w-5" />
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
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </aside>
        </div>

        <div className="mt-10 grid gap-4 rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Acceso protegido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La entrada se resuelve por sesión interna, no por exposición pública.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Operación rápida</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Búsqueda, tareas, comunicaciones y campos en el mismo flujo.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">IA y datos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              KMZ, roles, documentos y conexiones quedan separadas por contexto.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
