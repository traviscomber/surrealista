"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useAuth } from "@/lib/hooks/use-auth"
import { Building2, Menu, Plus, ListTodo } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AppHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Sur-Realista</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Inicio
            </Link>
            <Link
              href="/busqueda"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <ListTodo className="h-4 w-4" />
              Tareas
            </Link>
            <Link
              href="/nueva-tarea"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Link>
            <Link href="/admin/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/admin/propiedades" className="text-sm font-medium transition-colors hover:text-primary">
              Propiedades
            </Link>
            <Link href="/admin/usuarios" className="text-sm font-medium transition-colors hover:text-primary">
              Usuarios
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && <NotificationBell />}

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                  Inicio
                </Link>
                <Link
                  href="/busqueda"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
                >
                  <ListTodo className="h-4 w-4" />
                  Tareas
                </Link>
                <Link
                  href="/nueva-tarea"
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Tarea
                </Link>
                <Link href="/admin/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/admin/propiedades" className="text-sm font-medium transition-colors hover:text-primary">
                  Propiedades
                </Link>
                <Link href="/admin/usuarios" className="text-sm font-medium transition-colors hover:text-primary">
                  Usuarios
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
