"use client"

import Link from "next/link"
import { Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sur Realista · Recuperación</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">No pudimos completar esta vista.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Puedes reintentar la operación o volver a Inicio sin quedar atrapado en esta pantalla.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
          <Button asChild>
            <Link href="/"><Home className="h-4 w-4" aria-hidden="true" />Volver a Inicio</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
