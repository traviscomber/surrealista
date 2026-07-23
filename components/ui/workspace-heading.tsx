import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface WorkspaceHeadingProps {
  eyebrow?: string
  title: string
  description: string
  outcome?: string
  actions?: ReactNode
  className?: string
}

export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  outcome,
  actions,
  className,
}: WorkspaceHeadingProps) {
  return (
    <section className={cn("border-b border-border/70 pb-6", className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          {outcome ? (
            <p className="max-w-2xl border-l-2 border-primary/40 pl-3 text-sm leading-6 text-foreground">
              <span className="font-semibold">Resultado esperado:</span> {outcome}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}
