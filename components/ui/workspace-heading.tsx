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
            <h1 className="max-w-4xl text-[2rem] font-medium leading-[1.08] tracking-[-0.035em] text-foreground md:text-[2.4rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-[13px] leading-6 text-muted-foreground md:text-sm">
              {description}
            </p>
          </div>
          {outcome ? (
            <div className="max-w-2xl border-l border-border pl-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Objetivo operativo</p>
              <p className="mt-1 text-sm leading-6 text-foreground">{outcome}</p>
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}
