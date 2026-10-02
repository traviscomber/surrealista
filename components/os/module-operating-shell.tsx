"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  SUR_REALISTA_HOME,
  SUR_REALISTA_MODULES,
  SUR_REALISTA_UTILITIES,
  getSurRealistaSection,
  isSurRealistaNavActive,
} from "@/components/os/navigation-config"

const NAV_ITEMS = [SUR_REALISTA_HOME, ...SUR_REALISTA_MODULES]

function moduleLabel(pathname: string) {
  return getSurRealistaSection(pathname)?.label || "Operación"
}

export function ModuleOperatingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentModule = useMemo(() => moduleLabel(pathname), [pathname])

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/80 bg-card transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[68px]" : "w-[244px]",
        )}
      >
        <div className="flex h-[60px] items-center border-b border-border/80 px-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Sur Realista · Inicio">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-border bg-background">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Sur Realista</p>
                <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Operating System</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Módulos de Sur Realista">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isSurRealistaNavActive(pathname, item)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden="true" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-border/80 p-3">
          {SUR_REALISTA_UTILITIES.filter((item) => item.label === "Administración").map((item) => {
            const Icon = item.icon
            const active = isSurRealistaNavActive(pathname, item)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm",
                  active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden="true" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expandir navegación" : "Colapsar navegación"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
            {!collapsed ? <span>Colapsar</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" aria-label="Abrir navegación">
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] p-0">
                <div className="flex h-16 items-center border-b border-border/80 px-4">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center border border-border bg-background">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Sur Realista</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Operating System</p>
                    </div>
                  </Link>
                </div>
                <nav className="space-y-1 p-3" aria-label="Módulos de Sur Realista">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const active = isSurRealistaNavActive(pathname, item)
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                          active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="border-t border-border/80 p-3">
                  {SUR_REALISTA_UTILITIES.map((item) => {
                    const Icon = item.icon
                    const active = isSurRealistaNavActive(pathname, item)
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                          active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sur Realista OS</p>
            <h1 className="truncate text-base font-semibold tracking-tight">{currentModule}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-1 sm:flex">
            {SUR_REALISTA_UTILITIES.filter((item) => item.label === "Tareas" || item.label === "Asistente").map((item) => {
              const Icon = item.icon
              const active = isSurRealistaNavActive(pathname, item)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-medium",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label === "Asistente" ? "Asistente IA" : item.label}</span>
                </Link>
              )
            })}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
