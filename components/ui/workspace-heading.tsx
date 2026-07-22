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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
            <div className="inline-flex max-w-2xl items-start rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-sm leading-5 text-foreground">
              <span className="mr-2 font-semibold">Resultado:</span>
              <span>{outcome}</span>
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}
