"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, CheckSquare, ChevronRight, FolderOpen, MapPinned, Users } from "lucide-react"
import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { SUR_REALISTA_MODULES } from "@/components/os/navigation-config"

type Metric = { label: string; value: number | null; href: string; note: string }
type Props = { metrics: Metric[] }

const actions = [
  { label: "Mis tareas", detail: "Revisar lo pendiente", href: "/gestion-tareas", icon: CheckSquare },
  { label: "Mis campos", detail: "Mapa y Ficha 360", href: "/campos", icon: MapPinned },
  { label: "Registrar visita", detail: "Abrir campo y agregar evidencia", href: "/campos", icon: FolderOpen },
  { label: "Clientes", detail: "Contactos y seguimiento", href: "/clientes", icon: Users },
]

export function OperatingSystemDashboard({ metrics }: Props) {
  const getMetric = (label: string) => metrics.find((metric) => metric.label === label)
  const tasks = getMetric("Tareas")
  const fields = getMetric("Campos activos")
  const clients = getMetric("Clientes")
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-border/70 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Sur Realista / Operación</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Nave de comandos</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Elige qué necesitas hacer.</p>
      </header>

      <section aria-labelledby="acciones-heading" className="space-y-4">
        <h2 id="acciones-heading" className="text-lg font-semibold">¿Qué hacemos hoy?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map(({ label, detail, href, icon: Icon }, index) => (
            <Link key={label} href={href} className={`group flex min-h-28 items-center gap-4 rounded-lg border border-border/75 bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${index === 0 ? "sm:border-primary/40" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-semibold">{label}</span><span className="mt-1 block text-sm text-muted-foreground">{detail}</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Resumen operativo" className="grid grid-cols-3 divide-x divide-border/70 rounded-lg border border-border/75">
        {[
          { label: "Campos", metric: fields, href: "/campos" },
          { label: "Clientes", metric: clients, href: "/clientes" },
          { label: "Tareas", metric: tasks, href: "/gestion-tareas" },
        ].map(({ label, metric, href }) => (
          <Link key={label} href={href} className="min-w-0 p-4 hover:bg-muted/40 sm:p-5">
            <span className="block text-xs text-muted-foreground">{label}</span>
            <span className="mt-2 block text-2xl font-semibold tabular-nums sm:text-3xl">{metric?.value == null ? "—" : new Intl.NumberFormat("es-CL").format(metric.value)}</span>
          </Link>
        ))}
      </section>

      <details className="group rounded-lg border border-border/75 bg-card">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3"><BookOpen className="h-5 w-5" aria-hidden="true" /> Más herramientas</span>
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
        </summary>
        <div className="grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2">
          {SUR_REALISTA_MODULES.filter((module) => !["Campos", "Clientes"].includes(module.label)).map((module) => (
            <Link key={module.href} href={module.href} className="flex items-center justify-between rounded-md p-3 text-sm hover:bg-muted">
              <span>{module.label}</span><ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))}
          <Link href="/documentacion" className="flex items-center justify-between rounded-md p-3 text-sm hover:bg-muted">Documentos <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/asistente" className="flex items-center justify-between rounded-md p-3 text-sm hover:bg-muted">Asistente <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </details>

      <details className="group rounded-lg border border-border/75">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between p-5 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
          Consultar al asistente <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
        </summary>
        <div className="border-t border-border/70"><AIAssistantChat /></div>
      </details>
    </main>
  )
}
