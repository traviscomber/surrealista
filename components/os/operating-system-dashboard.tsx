"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  Files,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  MapPinned,
  Search,
  Sparkles,
  Users,
} from "lucide-react"

import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { cn } from "@/lib/utils"

type Metric = {
  label: string
  value: number | null
  href: string
  note: string
}

type OperatingSystemDashboardProps = {
  metrics: Metric[]
}

const modules = [
  {
    name: "Campos",
    description: "Inventario territorial, ROL, mapas, inteligencia y análisis de cada campo.",
    href: "/campos",
    icon: MapPinned,
    agent: "Agente Campos",
  },
  {
    name: "Clientes",
    description: "Personas, empresas, intereses, relaciones, seguimiento y contexto comercial.",
    href: "/gestion-clientes",
    icon: Users,
    agent: "Agente Clientes",
  },
  {
    name: "Multimedia",
    description: "Contenido, redes sociales, packs de publicaciones y activos de comunicación.",
    href: "/comunicaciones",
    icon: ImageIcon,
    agent: "Agente Contenido",
  },
  {
    name: "Documentos",
    description: "Repositorio documental, preparación y generación de informes con evidencia.",
    href: "/documentacion",
    icon: Files,
    agent: "Agente Documental",
  },
  {
    name: "Mercado",
    description: "Propiedades, comparables, prospección y señales de oportunidad.",
    href: "/mercado",
    icon: BriefcaseBusiness,
    agent: "Agente Mercado",
  },
]

const quickActions = [
  { label: "Tareas", href: "/gestion-tareas", icon: CheckSquare2 },
  { label: "Prospección", href: "/prospeccion", icon: Search },
  { label: "Analíticas", href: "/admin/analytics", icon: BarChart3 },
  { label: "Asistente IA", href: "/asistente-ia", icon: Bot },
]

export function OperatingSystemDashboard({ metrics }: OperatingSystemDashboardProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  const availableMetrics = useMemo(() => metrics.filter((metric) => metric.value !== null), [metrics])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <aside
          className={cn(
            "hidden border-r border-border/80 bg-card lg:flex lg:flex-col transition-[width] duration-200",
            leftCollapsed ? "w-[72px]" : "w-[264px]",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border/80 px-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center border border-border bg-background">
                <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              {!leftCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Sur Realista</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Operating System</p>
                </div>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setLeftCollapsed((value) => !value)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={leftCollapsed ? "Expandir navegación" : "Colapsar navegación"}
            >
              {leftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Módulos principales">
            <Link
              href="/"
              className="mb-4 flex min-h-11 items-center gap-3 rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
              {!leftCollapsed ? <span>Inicio</span> : null}
            </Link>

            {!leftCollapsed ? (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Módulos</p>
            ) : null}

            <div className="space-y-1">
              {modules.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.name}
                    href={module.href}
                    className="group flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={leftCollapsed ? module.name : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 group-hover:text-primary" aria-hidden="true" />
                    {!leftCollapsed ? <span className="truncate">{module.name}</span> : null}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-border/80 p-3">
            <Link
              href="/admin/dashboard"
              className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              title={leftCollapsed ? "Administración" : undefined}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              {!leftCollapsed ? <span>Administración</span> : null}
            </Link>
          </div>
        </aside>

        <main className="min-w-0 bg-background">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inicio</p>
              <h1 className="text-lg font-semibold tracking-tight">Centro operativo</h1>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            <section className="grid gap-5 border-b border-border/80 pb-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)] xl:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Inteligencia transversal</span>
                </div>
                <h2 className="max-w-4xl text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-4xl">
                  Todo Sur Realista desde una sola operación.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Atajos, indicadores y tareas en la portada. El asistente cruza Campos, Clientes, Multimedia, Documentos y Mercado sin obligarte a navegar módulo por módulo.
                </p>
              </div>
              <div className="border-l border-border/80 pl-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Consultas ejemplo</p>
                <div className="mt-3 space-y-2 text-sm leading-6">
                  <p>“¿Qué campos tiene este cliente?”</p>
                  <p>“Prepárame un informe con la evidencia disponible.”</p>
                  <p>“¿Qué propiedades de mercado se parecen a este campo?”</p>
                </div>
              </div>
            </section>

            <section aria-labelledby="modulos-heading">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Navegación</p>
                  <h2 id="modulos-heading" className="mt-1 text-xl font-semibold">Cinco módulos operativos</h2>
                </div>
              </div>

              <div className="grid border border-border/80 bg-card md:grid-cols-2 xl:grid-cols-5">
                {modules.map((module, index) => {
                  const Icon = module.icon
                  return (
                    <Link
                      href={module.href}
                      key={module.name}
                      className={cn(
                        "group min-h-[210px] p-5 transition-colors hover:bg-muted/60",
                        index < modules.length - 1 && "border-b border-border/80 md:border-r xl:border-b-0",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                      </div>
                      <h3 className="mt-8 text-lg font-semibold">{module.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
                      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{module.agent}</p>
                    </Link>
                  )
                })}
              </div>
            </section>

            <section aria-labelledby="indicadores-heading">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">02 · Estado</p>
                <h2 id="indicadores-heading" className="mt-1 text-xl font-semibold">Indicadores canónicos</h2>
              </div>

              <div className="grid border-y border-border/80 sm:grid-cols-2 xl:grid-cols-5">
                {metrics.map((metric, index) => (
                  <Link
                    key={metric.label}
                    href={metric.href}
                    className={cn(
                      "min-h-[128px] px-4 py-5 transition-colors hover:bg-muted/50",
                      index < metrics.length - 1 && "border-b border-border/80 sm:border-r xl:border-b-0",
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 text-3xl font-medium tabular-nums">
                      {metric.value === null ? "—" : new Intl.NumberFormat("es-CL").format(metric.value)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.note}</p>
                  </Link>
                ))}
              </div>
              {availableMetrics.length !== metrics.length ? (
                <p className="mt-3 text-xs text-muted-foreground">Las métricas no disponibles se dejan vacías; el dashboard no inventa datos ni tendencias.</p>
              ) : null}
            </section>

            <section aria-labelledby="assistant-heading" className="border border-border/80 bg-card">
              <div className="grid xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="border-b border-border/80 p-5 xl:border-b-0 xl:border-r">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">03 · IA transversal</p>
                  </div>
                  <h2 id="assistant-heading" className="mt-4 text-xl font-semibold">Asistente Sur Realista</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Una consulta puede partir en un cliente, encontrar sus campos, recuperar documentos, revisar mercado y terminar en un informe con evidencia.
                  </p>
                  <div className="mt-6 border-t border-border/70 pt-4">
                    <p className="text-xs font-medium">Router de consultas</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">FastTrack para consultas directas. FullAgentic cuando la respuesta exige cruzar módulos, herramientas o fuentes.</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <AIAssistantChat />
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside
          className={cn(
            "hidden border-l border-border/80 bg-card xl:flex xl:flex-col transition-[width] duration-200",
            rightCollapsed ? "w-[56px]" : "w-[320px]",
          )}
        >
          <div className="flex h-16 items-center border-b border-border/80 px-3">
            <button
              type="button"
              onClick={() => setRightCollapsed((value) => !value)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={rightCollapsed ? "Expandir panel de inteligencia" : "Colapsar panel de inteligencia"}
            >
              {rightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {!rightCollapsed ? <span className="ml-2 text-xs font-medium">Contexto</span> : null}
          </div>

          {!rightCollapsed ? (
            <div className="flex-1 overflow-y-auto">
              <section className="border-b border-border/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Arquitectura IA</p>
                <h2 className="mt-2 text-base font-semibold">Orquestación por evidencia</h2>
                <div className="mt-4 space-y-4 text-xs leading-5 text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">1. Router</p>
                    <p>Clasifica intención, complejidad y fuentes requeridas.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2. Agente especialista</p>
                    <p>Campos, Clientes, Contenido, Documentos o Mercado.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">3. Evidencia</p>
                    <p>Cada respuesta compleja debe poder remontarse a registros y fuentes concretas.</p>
                  </div>
                </div>
              </section>

              <section className="border-b border-border/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trabajo</p>
                <div className="mt-4 space-y-2">
                  <Link href="/gestion-tareas" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <span>Tareas pendientes</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link href="/prospeccion" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <span>Prospección</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link href="/documentacion" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <span>Informes</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </section>

              <section className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Regla del sistema</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Si una fuente no existe o no responde, el sistema debe indicarlo. No completar vacíos con inferencias presentadas como hechos.
                </p>
              </section>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
