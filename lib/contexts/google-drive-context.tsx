"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { driveService } from "@/lib/google-drive/drive-service"
import type { DriveFile, DriveFolder } from "@/lib/google-drive/drive-service"

interface GoogleDriveContextType {
  driveService: typeof driveService
  isConnected: boolean
  isLoading: boolean
  error: string | null
  testConnection: () => Promise<boolean>
  reconnect: () => Promise<void>
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined)

export function GoogleDriveProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isProduction =
    process.env.NODE_ENV === "production" &&
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("preview")

  useEffect(() => {
    const initializeDrive = async () => {
      try {
        console.log("[v0] Initializing Google Drive connection...")
        setIsLoading(true)
        setError(null)

        const connected = await driveService.testConnection()
        setIsConnected(connected)

        if (connected) {
          console.log("[v0] Google Drive connected successfully")
          localStorage.setItem("gdrive_connected", "true")
          localStorage.setItem("gdrive_connected_at", new Date().toISOString())
        } else {
          console.error("[v0] Google Drive connection failed")
          if (isProduction) {
            setError("Google Drive no está disponible. Verifique la configuración de OAuth 2.0.")
          }
          localStorage.removeItem("gdrive_connected")
        }
      } catch (err) {
        console.error("[v0] Error initializing Google Drive:", err)
        if (isProduction) {
          setError("Error al conectar con Google Drive. Contacte al administrador.")
        }
        setIsConnected(false)
        localStorage.removeItem("gdrive_connected")
      } finally {
        setIsLoading(false)
      }
    }

    initializeDrive()
  }, [isProduction])

  const testConnection = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const connected = await driveService.testConnection()
      setIsConnected(connected)

      if (connected) {
        localStorage.setItem("gdrive_connected", "true")
        localStorage.setItem("gdrive_connected_at", new Date().toISOString())
      } else {
        if (isProduction) {
          setError("No se pudo conectar con Google Drive")
        }
        localStorage.removeItem("gdrive_connected")
      }

      return connected
    } catch (err) {
      console.error("[v0] Connection test failed:", err)
      if (isProduction) {
        setError(err instanceof Error ? err.message : "Error de conexión")
      }
      setIsConnected(false)
      localStorage.removeItem("gdrive_connected")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const reconnect = async (): Promise<void> => {
    console.log("[v0] Reconnecting to Google Drive...")
    await testConnection()
  }

  return (
    <GoogleDriveContext.Provider
      value={{
        driveService,
        isConnected,
        isLoading,
        error,
        testConnection,
        reconnect,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  )
}

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext)
  if (context === undefined) {
    throw new Error("useGoogleDrive must be used within a GoogleDriveProvider")
  }
  return context
}

export type { DriveFile, DriveFolder }
