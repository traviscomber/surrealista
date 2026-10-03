import { cn } from "@/lib/utils"

type ModuleRuntimeStripProps = {
  code: string
  agent: string
  scope: string
  taskLabel?: string
  className?: string
}

export function ModuleRuntimeStrip({
  code,
  agent,
  scope,
  taskLabel = "Tareas integradas",
  className,
}: ModuleRuntimeStripProps) {
  const items = [
    ["Módulo", code],
    ["Agente", agent],
    ["Ámbito", scope],
    ["Operación", taskLabel],
  ] as const

  return (
    <section
      aria-label={`Contexto operativo ${code}`}
      className={cn("grid border-y border-border/70 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {items.map(([label, value], index) => (
        <div
          key={label}
          className={cn(
            "min-w-0 px-4 py-3",
            index > 0 && "border-t border-border/70 sm:border-l sm:border-t-0",
            index === 2 && "sm:border-t xl:border-t-0",
          )}
        >
          <p className="font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-foreground">{value}</p>
        </div>
      ))}
    </section>
  )
}
