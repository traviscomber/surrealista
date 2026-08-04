"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle } from "lucide-react"
import { captureMessage } from "@/lib/sentry-init"

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD?.trim() || "srmagica"
const STORAGE_KEY = "site_access_token"
const ATTEMPTS_KEY = "login_attempts"
const LOCKOUT_KEY = "login_lockout_time"
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000

const PUBLIC_ROUTES = ["/ayuda", "/docs"]

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  useEffect(() => {
    const token = sessionStorage.getItem(STORAGE_KEY)
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

    if (token === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, password)
      sessionStorage.removeItem(ATTEMPTS_KEY)
      sessionStorage.removeItem(LOCKOUT_KEY)
      setIsAuthenticated(true)
      setAttemptCount(0)
      setPassword("")
      setError("")
      captureMessage("Login exitoso", "info")
      router.replace("/campos")
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
  }

  if (isLoading) return null
  if (isPublicRoute) return <>{children}</>

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.03),_transparent)] p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="h-8 w-8 text-emerald-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold">Sur-Realista interno</CardTitle>
            <CardDescription className="text-base">Acceso seguro a la plataforma interna</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div
                  className={`flex gap-2 rounded-lg border p-3 ${
                    isLockedOut ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                  }`}
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
                  disabled={isLockedOut}
                  className={error ? "border-red-500" : ""}
                  autoComplete="current-password"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                disabled={isLockedOut || password.trim().length === 0}
              >
                {isLockedOut ? "Bloqueado" : "Ingresar"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Acceso restringido al equipo interno de Sur-Realista.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
