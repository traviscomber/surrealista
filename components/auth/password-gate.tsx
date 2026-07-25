"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle } from "lucide-react"
import { captureMessage } from "@/lib/sentry-init"

const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD?.trim() ?? ""
const STORAGE_KEY = "site_access_token"
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000

const PUBLIC_ROUTES = ["/ayuda", "/docs"]

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [isConfigured, setIsConfigured] = useState(true)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  useEffect(() => {
    const token = sessionStorage.getItem(STORAGE_KEY)
    const lockoutTime = sessionStorage.getItem("login_lockout_time")

    if (!CORRECT_PASSWORD) {
      setIsConfigured(false)
      setIsLoading(false)
      return
    }

    if (lockoutTime) {
      const now = Date.now()
      if (now < Number.parseInt(lockoutTime, 10)) {
        setIsLockedOut(true)
        captureMessage("Usuario intentó acceso durante lockout", "warning")
      } else {
        sessionStorage.removeItem("login_lockout_time")
        sessionStorage.removeItem("login_attempts")
      }
    }

    if (token === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!CORRECT_PASSWORD) {
      setError("Acceso interno no configurado. Define NEXT_PUBLIC_APP_PASSWORD.")
      return
    }

    if (!password) {
      setError("Ingresa la contraseña")
      return
    }

    if (password.length < 4) {
      setError("Contraseña inválida")
      return
    }

    if (isLockedOut) {
      setError("Demasiados intentos. Intenta más tarde.")
      captureMessage("Acceso denegado: cuenta bloqueada", "warning")
      return
    }

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, password)
      sessionStorage.removeItem("login_attempts")
      sessionStorage.removeItem("login_lockout_time")
      setIsAuthenticated(true)
      setAttemptCount(0)
      captureMessage("Login exitoso", "info")
      setError("")
      return
    }

    const newAttempts = attemptCount + 1
    setAttemptCount(newAttempts)
    setPassword("")
    captureMessage(`Intento de login fallido (${newAttempts}/${MAX_ATTEMPTS})`, "warning")

    if (newAttempts >= MAX_ATTEMPTS) {
      setIsLockedOut(true)
      const lockoutExpires = Date.now() + LOCKOUT_TIME
      sessionStorage.setItem("login_lockout_time", lockoutExpires.toString())
      sessionStorage.setItem("login_attempts", newAttempts.toString())
      setError(`Cuenta bloqueada por ${LOCKOUT_TIME / 60000} minutos tras ${MAX_ATTEMPTS} intentos fallidos`)
      captureMessage(`Cuenta bloqueada: ${MAX_ATTEMPTS} intentos fallidos`, "warning")
    } else {
      const remaining = MAX_ATTEMPTS - newAttempts
      setError(`Contraseña incorrecta. ${remaining} intento${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"}`)
    }
  }

  if (isLoading) {
    return null
  }

  if (isPublicRoute) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,_rgba(2,6,23,0.03),_transparent)] p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Sur-Realista interno</CardTitle>
            <CardDescription className="text-base">
              {isConfigured ? "Acceso seguro a la plataforma interna" : "Acceso interno no configurado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div
                  className={`flex gap-2 rounded-lg border p-3 ${
                    isLockedOut ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 flex-shrink-0 ${isLockedOut ? "text-red-600" : "text-orange-600"}`}
                  />
                  <p className={`text-sm ${isLockedOut ? "text-red-700" : "text-orange-700"}`}>{error}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña interna"
                  disabled={isLockedOut || !isConfigured}
                  className={error ? "border-red-500" : ""}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50" disabled={isLockedOut || !isConfigured}>
                {isLockedOut ? "Bloqueado" : "Ingresar"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                La autenticación es interna. Si el entorno no tiene contraseña configurada, no se permite el acceso.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
