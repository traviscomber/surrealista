"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bot,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AIAssistantChat } from "@/components/ai-assistant/ai-assistant-chat"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
  const [assistantOpen, setAssistantOpen] = useState(false)

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
            onClick={toggleCollapsed}
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
              <SheetContent side="left" className="w-[290px] overflow-y-auto p-0">
                <SheetTitle className="sr-only">Navegación Sur Realista</SheetTitle>
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
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Volver a Inicio">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sur Realista OS</p>
              <h1 className="truncate text-base font-semibold tracking-tight">{currentModule}</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
              <SheetTrigger asChild>
                <button type="button" className="flex min-h-10 items-center gap-2 rounded-md border border-border/70 px-3 text-xs font-medium hover:bg-muted" aria-label="Abrir asistente contextual">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Asistente contextual</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-[480px]">
                <SheetTitle className="sr-only">Asistente contextual</SheetTitle>
                <div className="min-h-0 flex-1 pt-12"><AIAssistantChat /></div>
              </SheetContent>
            </Sheet>
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

        {currentModule === "Mercado" ? (
          <nav className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-border/80 bg-card/70 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5" aria-label="Navegación de Mercado">
            {SUR_REALISTA_MARKET_SUBNAV.map((item) => {
              const active = isMarketSubnavActive(pathname, item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
