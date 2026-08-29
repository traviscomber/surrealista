"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Lock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { captureMessage } from "@/lib/sentry-init"

const STORAGE_KEY = "site_access_token"
const ATTEMPTS_KEY = "login_attempts"
const LOCKOUT_KEY = "login_lockout_time"
const SESSION_MARKER = "granted"
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000
const PUBLIC_ROUTES = ["/ayuda", "/docs"]

async function hasValidServerSession() {
  const response = await fetch("/api/internal-access", { method: "GET", cache: "no-store" })
  return response.ok
}

async function createServerSession(password: string) {
  return fetch("/api/internal-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
}

function getServerRetryAfterMs(response: Response) {
  const retryAfterSeconds = Number.parseInt(response.headers.get("Retry-After") || "", 10)
  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : LOCKOUT_TIME
}

function getSafeRedirect(redirect: string | null, pathname: string) {
  if (redirect?.startsWith("/") && !redirect.startsWith("//")) return redirect
  return pathname === "/" ? "/campos" : pathname
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const lockoutTime = sessionStorage.getItem(LOCKOUT_KEY)
      const storedAttempts = Number.parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || "0", 10)
      setAttemptCount(Number.isFinite(storedAttempts) ? storedAttempts : 0)

      if (lockoutTime) {
        const now = Date.now()
        if (now < Number.parseInt(lockoutTime, 10)) {
          setIsLockedOut(true)
          captureMessage("Usuario intentó acceso durante lockout", "warning")
        } else {
          sessionStorage.removeItem(LOCKOUT_KEY)
          sessionStorage.removeItem(ATTEMPTS_KEY)
          setAttemptCount(0)
        }
      }

      if (isPublicRoute) {
        if (!cancelled) setIsLoading(false)
        return
      }

      if (sessionStorage.getItem(STORAGE_KEY) === SESSION_MARKER) {
        try {
          const valid = await hasValidServerSession()
          if (cancelled) return
          if (valid) {
            setIsAuthenticated(true)
          } else {
            sessionStorage.removeItem(STORAGE_KEY)
          }
        } catch {
          if (!cancelled) sessionStorage.removeItem(STORAGE_KEY)
        }
      }

      if (!cancelled) setIsLoading(false)
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [isPublicRoute])

  useEffect(() => {
    if (!isLockedOut) return

    const lockoutExpires = Number.parseInt(sessionStorage.getItem(LOCKOUT_KEY) || "0", 10)
    const remainingMs = lockoutExpires - Date.now()

    if (!Number.isFinite(lockoutExpires) || remainingMs <= 0) {
      sessionStorage.removeItem(LOCKOUT_KEY)
      sessionStorage.removeItem(ATTEMPTS_KEY)
      setAttemptCount(0)
      setIsLockedOut(false)
      setError("")
      return
    }

    const timeout = window.setTimeout(() => {
      sessionStorage.removeItem(LOCKOUT_KEY)
      sessionStorage.removeItem(ATTEMPTS_KEY)
      setAttemptCount(0)
      setIsLockedOut(false)
      setError("")
    }, remainingMs)

    return () => window.clearTimeout(timeout)
  }, [isLockedOut])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!password.trim()) {
      setError("Ingresa la contraseña")
      return
    }

    if (isLockedOut) {
      setError("Demasiados intentos. Intenta más tarde.")
      captureMessage("Acceso denegado: cuenta bloqueada", "warning")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createServerSession(password)
      if (response.ok) {
        sessionStorage.setItem(STORAGE_KEY, SESSION_MARKER)
        sessionStorage.removeItem(ATTEMPTS_KEY)
        sessionStorage.removeItem(LOCKOUT_KEY)
        setIsAuthenticated(true)
        setAttemptCount(0)
        setPassword("")
        setError("")
        captureMessage("Login exitoso", "info")
        const redirect = new URLSearchParams(window.location.search).get("redirect")
        router.replace(getSafeRedirect(redirect, pathname))
        return
      }

      if (response.status === 429) {
        const lockoutDurationMs = getServerRetryAfterMs(response)
        const lockoutExpires = Date.now() + lockoutDurationMs
        const minutes = Math.max(1, Math.ceil(lockoutDurationMs / 60000))

        sessionStorage.setItem(ATTEMPTS_KEY, MAX_ATTEMPTS.toString())
        sessionStorage.setItem(LOCKOUT_KEY, lockoutExpires.toString())
        setAttemptCount(MAX_ATTEMPTS)
        setPassword("")
        setIsLockedOut(true)
        setError(`Acceso bloqueado temporalmente. Intenta nuevamente en ${minutes} minuto${minutes === 1 ? "" : "s"}.`)
        captureMessage("Acceso bloqueado por rate limit del servidor", "warning")
        return
      }

      if (response.status >= 500) {
        setError("El acceso interno no está disponible en este momento.")
        captureMessage("Acceso interno no disponible", "error")
        return
      }

      const newAttempts = attemptCount + 1
      setAttemptCount(newAttempts)
      setPassword("")
      sessionStorage.setItem(ATTEMPTS_KEY, newAttempts.toString())
      captureMessage(`Intento de login fallido (${newAttempts}/${MAX_ATTEMPTS})`, "warning")

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutExpires = Date.now() + LOCKOUT_TIME
        sessionStorage.setItem(LOCKOUT_KEY, lockoutExpires.toString())
        setIsLockedOut(true)
        setError(`Acceso bloqueado por ${LOCKOUT_TIME / 60000} minutos tras ${MAX_ATTEMPTS} intentos fallidos`)
        captureMessage(`Acceso bloqueado: ${MAX_ATTEMPTS} intentos fallidos`, "warning")
        return
      }

      const remaining = MAX_ATTEMPTS - newAttempts
      setError(`Contraseña incorrecta. ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`)
    } catch {
      setError("No se pudo validar el acceso interno.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null
  if (isPublicRoute) return <>{children}</>

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_0%,hsl(var(--sr-green-soft)/0.75),transparent_38%),linear-gradient(180deg,hsl(var(--sr-canvas)),hsl(var(--sr-surface-subtle)))] p-4 md:p-8">
        <Card className="grid w-full max-w-4xl overflow-hidden border-border/80 shadow-[var(--shadow-overlay)] md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
            <div>
              <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Sur Realista Intelligence</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight">El territorio, convertido en decisiones.</h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-primary-foreground/75">
                Inventario de campos, contexto territorial, mercado y operación comercial en un solo espacio de trabajo.
              </p>
            </div>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              {["Datos territoriales centralizados", "Acceso restringido y trazable", "Operación preparada para decisiones"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground/70" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex flex-col justify-center bg-card px-6 py-10 sm:px-10 md:min-h-[560px]">
            <CardHeader className="space-y-4 px-0 pt-0 text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground md:hidden">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/50">
                <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="font-serif text-3xl font-semibold tracking-tight">Acceso interno</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Ingresa tu contraseña para continuar a la plataforma de inteligencia territorial.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div
                  className={`flex gap-2 rounded-lg border p-3 ${isLockedOut ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}
                  role="alert"
                >
                  <AlertCircle
                    className={`h-5 w-5 flex-shrink-0 ${isLockedOut ? "text-red-600" : "text-orange-600"}`}
                    aria-hidden="true"
                  />
                  <p className={`text-sm ${isLockedOut ? "text-red-700" : "text-orange-700"}`}>{error}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa la contraseña interna"
                  disabled={isLockedOut || isSubmitting}
                  className={error ? "border-destructive" : ""}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLockedOut || isSubmitting || password.trim().length === 0}
              >
                {isLockedOut ? "Bloqueado" : isSubmitting ? "Validando..." : "Ingresar"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Acceso restringido al equipo interno de Sur Realista.
              </p>
            </form>
          </CardContent>
          </div>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
