"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { GlobalCommandPalette } from "@/components/search/global-command-palette"
import {
  SUR_REALISTA_HOME,
  SUR_REALISTA_MODULES,
  SUR_REALISTA_UTILITIES,
  SUR_REALISTA_MARKET_SUBNAV,
  getSurRealistaSection,
  isSurRealistaNavActive,
} from "@/components/os/navigation-config"

const NAV_ITEMS = [SUR_REALISTA_HOME, ...SUR_REALISTA_MODULES]

function moduleLabel(pathname: string) {
  return getSurRealistaSection(pathname)?.label || "Operación"
}

function isMarketSubnavActive(pathname: string, href: string) {
  if (href === "/mercado") return pathname === "/mercado" || pathname.startsWith("/quick-wins")
  if (href === "/mercado/oportunidades") {
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith("/home-spotter") || pathname.startsWith("/opportunities")
  }
  if (href === "/propiedades") return pathname.startsWith("/propiedades") || pathname.startsWith("/properties")
  return pathname === href || pathname.startsWith(href + "/")
}

export function ModuleOperatingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("sr-os-nav-collapsed") === "1")
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem("sr-os-nav-collapsed", next ? "1" : "0")
      return next
    })
  }
  const currentModule = useMemo(() => moduleLabel(pathname), [pathname])

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <a href="#sr-main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[200] focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg">
        Saltar al contenido
      </a>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/70 bg-card/95 transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-[72px]" : "w-[232px]",
        )}
      >
        <div className="flex h-[64px] items-center border-b border-border/70 px-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Sur Realista · Inicio">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-border/80 bg-background">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold tracking-[-0.01em]">Sur Realista</p>
                <p className="truncate text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Operating System</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4" aria-label="Módulos de Sur Realista">
          {!collapsed ? (
            <p className="mb-2 px-2.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Operación
            </p>
          ) : null}
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon
              const active = isSurRealistaNavActive(pathname, item)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex min-h-10 items-center gap-3 px-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-secondary/80 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-2 left-0 w-px bg-transparent",
                      active && "bg-primary",
                    )}
                    aria-hidden="true"
                  />
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                  {!collapsed ? (
                    <>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <span aria-hidden="true" className="font-mono text-[9px] tabular-nums text-muted-foreground/70">
                        {String(index).padStart(2, "0")}
                      </span>
                    </>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border/70 px-2.5 py-3">
          {!collapsed ? (
            <p className="mb-2 px-2.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Sistema
            </p>
          ) : null}
          {SUR_REALISTA_UTILITIES.filter((item) => item.label === "Administración").map((item) => {
            const Icon = item.icon
            const active = isSurRealistaNavActive(pathname, item)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex min-h-10 items-center gap-3 px-2.5 text-[13px]",
                  active ? "bg-secondary/80 font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <span className={cn("absolute inset-y-2 left-0 w-px bg-transparent", active && "bg-primary")} aria-hidden="true" />
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-1 flex min-h-10 w-full items-center gap-3 px-2.5 text-[13px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            aria-label={collapsed ? "Expandir navegación" : "Colapsar navegación"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
            {!collapsed ? <span>Colapsar</span> : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" aria-label="Abrir navegación">
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[286px] overflow-y-auto border-r border-border/70 p-0">
                <SheetTitle className="sr-only">Navegación Sur Realista</SheetTitle>
                <div className="flex h-16 items-center border-b border-border/70 px-4">
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
                <nav className="px-3 py-4" aria-label="Módulos de Sur Realista">
                  <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operación</p>
                  <div className="space-y-0.5">
                  {NAV_ITEMS.map((item, index) => {
                    const Icon = item.icon
                    const active = isSurRealistaNavActive(pathname, item)
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "relative flex min-h-10 items-center gap-3 px-2 text-[13px]",
                          active ? "bg-secondary/80 font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                        )}
                      >
                        <span className={cn("absolute inset-y-2 left-0 w-px bg-transparent", active && "bg-primary")} aria-hidden="true" />
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span aria-hidden="true" className="font-mono text-[9px] text-muted-foreground/70">{String(index).padStart(2, "0")}</span>
                      </Link>
                    )
                  })}
                  </div>
                </nav>
                <div className="border-t border-border/70 px-3 py-4">
                  <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sistema</p>
                  {SUR_REALISTA_UTILITIES.map((item) => {
                    const Icon = item.icon
                    const active = isSurRealistaNavActive(pathname, item)
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "relative flex min-h-10 items-center gap-3 px-2 text-[13px]",
                          active ? "bg-secondary/80 font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                        )}
                      >
                        <span className={cn("absolute inset-y-2 left-0 w-px bg-transparent", active && "bg-primary")} aria-hidden="true" />
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <Link
              href="/"
              aria-label="Volver a Inicio"
              title="Inicio"
              className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sur Realista / Módulo</p>
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.015em]">{currentModule}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-1 sm:flex">
            <GlobalCommandPalette />
            {SUR_REALISTA_UTILITIES.filter((item) => item.label === "Tareas" || item.label === "Asistente").map((item) => {
              const Icon = item.icon
              const active = isSurRealistaNavActive(pathname, item)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 items-center gap-2 border-l border-transparent px-3 text-[11px] font-medium transition-colors",
                    active ? "border-primary bg-secondary/70 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label === "Asistente" ? "Asistente IA" : item.label}</span>
                </Link>
              )
            })}
          </div>
        </header>

        {currentModule === "Mercado" ? (
          <nav className="flex h-11 shrink-0 items-center gap-5 overflow-x-auto border-b border-border/70 bg-card/60 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5" aria-label="Navegación de Mercado">
            {SUR_REALISTA_MARKET_SUBNAV.map((item) => {
              const active = isMarketSubnavActive(pathname, item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center whitespace-nowrap px-0 text-[11px] font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px",
                    active ? "text-foreground after:bg-primary" : "text-muted-foreground after:bg-transparent hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        ) : null}

        <main id="sr-main-content" className="min-h-0 flex-1 overflow-auto" tabIndex={-1}>{children}</main>
      </div>
    </div>
  )
}
