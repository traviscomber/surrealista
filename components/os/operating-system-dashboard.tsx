"use client"

import Link from "next/link"
import { Bot, ChevronRight, Sparkles } from "lucide-react"

import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { SUR_REALISTA_MODULES } from "@/components/os/navigation-config"
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

export function OperatingSystemDashboard({ metrics }: OperatingSystemDashboardProps) {
  const availableMetrics = metrics.filter((metric) => metric.value !== null)

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-10 px-4 py-7 sm:px-6 lg:px-8">
      <section className="grid gap-8 border-b border-border/70 pb-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)] xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Sistema operativo</span>
          </div>
          <h2 className="max-w-4xl text-[2rem] font-medium leading-[1.08] tracking-[-0.04em] sm:text-[2.6rem]">
            Todo Sur Realista desde una sola operación.
          </h2>
          <p className="mt-4 max-w-2xl text-[13px] leading-6 text-muted-foreground">
            Navega por cinco módulos estables. Tareas y Asistente permanecen disponibles en cualquier sección sin romper el contexto de trabajo.
          </p>
        </div>

        <div className="border-l border-border/70 pl-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flujo operativo</p>
          <div className="mt-3 space-y-2 text-sm leading-6">
            <p><span className="mr-2 font-mono text-[10px] text-muted-foreground">01</span>Entra al módulo donde vive la información.</p>
            <p><span className="mr-2 font-mono text-[10px] text-muted-foreground">02</span>Trabaja sin perder la navegación global.</p>
            <p><span className="mr-2 font-mono text-[10px] text-muted-foreground">03</span>Convierte el resultado en tarea, evidencia o decisión.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="modulos-heading">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 · Navegación</p>
          <h2 id="modulos-heading" className="mt-1 text-xl font-semibold">Cinco módulos operativos</h2>
        </div>

        <div className="border-y border-border/70">
          {SUR_REALISTA_MODULES.map((module, index) => {
            const Icon = module.icon
            return (
              <Link
                href={module.href}
                key={module.label}
                className={cn(
                  "group grid min-h-[92px] items-center gap-4 py-4 transition-colors hover:bg-secondary/45 sm:grid-cols-[40px_150px_minmax(0,1fr)_140px_24px] sm:px-3",
                  index < SUR_REALISTA_MODULES.length - 1 && "border-b border-border/70",
                )}
              >
                <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-[15px] font-semibold">{module.label}</h3>
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground">{module.description}</p>
                <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">{module.agent}</p>
                <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
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

        <div className="grid overflow-hidden border-y border-border/70 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric, index) => (
            <Link
              key={metric.label}
              href={metric.href}
              className={cn(
                "min-h-[128px] px-4 py-5 transition-colors hover:bg-muted/50",
                index < metrics.length - 1 && "border-b border-border/70 sm:border-r xl:border-b-0",
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
          <p className="mt-3 text-xs text-muted-foreground">
            Las métricas no disponibles se dejan vacías; el dashboard no completa datos faltantes con estimaciones.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="assistant-heading" className="overflow-hidden border border-border/70 bg-card">
        <div className="grid xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="border-b border-border/70 p-5 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">03 · IA transversal</p>
            </div>
            <h2 id="assistant-heading" className="mt-4 text-xl font-semibold">Asistente Sur Realista</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Una consulta puede partir en un cliente, encontrar sus campos, recuperar documentos, revisar mercado y terminar en un informe con evidencia.
            </p>
            <Link href="/asistente" className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline">
              Abrir workspace completo
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="min-w-0">
            <AIAssistantChat />
          </div>
        </div>
      </section>
    </div>
  )
}
