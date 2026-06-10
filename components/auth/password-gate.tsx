"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle } from "lucide-react"
import { captureMessage } from "@/lib/sentry-init"

// Contraseña temporal (será reemplazada con Better Auth en próxima fase)
// Para cambiar: usar variable de entorno NEXT_PUBLIC_APP_PASSWORD
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "srmagica"
const STORAGE_KEY = "site_access_token"
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos

// Routes that don't require password
const PUBLIC_ROUTES = ["/ayuda", "/docs"]

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  useEffect(() => {
    // Check if user has already authenticated
    const token = sessionStorage.getItem(STORAGE_KEY)
    const lockoutTime = sessionStorage.getItem("login_lockout_time")
    
    if (lockoutTime) {
      const now = Date.now()
      if (now < parseInt(lockoutTime)) {
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

    // Validar input
    if (!password) {
      setError("Por favor ingresa la contraseña")
      return
    }

    if (password.length < 4) {
      setError("Contraseña inválida")
      return
    }

    // Verificar lockout
    if (isLockedOut) {
      setError("Demasiados intentos. Intenta más tarde.")
      captureMessage("Acceso denegado: cuenta bloqueada", "warning")
      return
    }

    // Comparar contraseña
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, password)
      sessionStorage.removeItem("login_attempts")
      sessionStorage.removeItem("login_lockout_time")
      setIsAuthenticated(true)
      setAttemptCount(0)
      captureMessage("Login exitoso", "info")
      setError("")
    } else {
      // Incrementar intentos
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
        setError(`Contraseña incorrecta. ${remaining} intento${remaining === 1 ? '' : 's'} restantes`)
      }
    }
  }

  // Show nothing while checking authentication
  if (isLoading) {
    return null
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-900">Sur-Realista</CardTitle>
            <CardDescription className="text-base">Acceso seguro a la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`rounded-lg p-3 flex gap-2 ${
                  isLockedOut ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                }`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                    isLockedOut ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <p className={`text-sm ${isLockedOut ? 'text-red-700' : 'text-orange-700'}`}>
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  disabled={isLockedOut}
                  className={error ? "border-red-500" : ""}
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                disabled={isLockedOut}
              >
                {isLockedOut ? "Bloqueado - Intenta más tarde" : "Ingresar"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Plataforma segura con monitoreo. Todos los intentos son registrados en Sentry.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show protected content if authenticated
  return <>{children}</>
}
