"use client"

import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function AccessForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const configurationError = searchParams.get("configurationError") === "1"
  const returnTo = searchParams.get("returnTo") || "/"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(payload.error || "No fue posible validar el acceso.")
        return
      }

      router.replace(returnTo.startsWith("/") ? returnTo : "/")
      router.refresh()
    } catch {
      setError("No fue posible conectar con el servicio de acceso.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-none">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
          <LockKeyhole className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="font-serif text-2xl">Acceso interno</CardTitle>
          <CardDescription>
            Ingresa la credencial autorizada para acceder al espacio operativo de Sur Realista.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {configurationError ? (
          <div className="mb-4 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p>La variable de entorno APP_PASSWORD no está configurada en el entorno actual.</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p>{error}</p>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={configurationError || isSubmitting}
              required
            />
          </div>

          <Button className="w-full" type="submit" disabled={configurationError || isSubmitting || !password}>
            {isSubmitting ? "Validando…" : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function AccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Preparando acceso…</p>}>
        <AccessForm />
      </Suspense>
    </main>
  )
}
