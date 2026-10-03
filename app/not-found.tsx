import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">404 · Sur Realista</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Esta ruta ya no está disponible.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Puede ser una URL antigua. Vuelve al sistema operativo para continuar desde la navegación canónica.
        </p>
        <Button asChild className="mt-6">
          <Link href="/"><Home className="h-4 w-4" aria-hidden="true" />Volver a Inicio</Link>
        </Button>
      </div>
    </main>
  )
}
