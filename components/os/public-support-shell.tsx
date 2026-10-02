import type React from "react"
import Link from "next/link"
import { BookOpen, CircleHelp, Home } from "lucide-react"

export function PublicSupportShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold" aria-label="Volver a Inicio">
            <Home className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="truncate">Sur Realista</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Soporte Sur Realista">
            <Link href="/ayuda" className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
              Ayuda
            </Link>
            <Link href="/docs/usuario" className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Guía
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
