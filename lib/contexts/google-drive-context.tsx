"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { DriveFile, DriveFolder } from "@/lib/google-drive/drive-service"

interface GoogleDriveContextType {
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

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/drive/folders", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      })

      if (response.ok) {
        setIsConnected(true)
        return true
      }

      const payload = await response.json().catch(() => ({}))
      setIsConnected(false)

      if (response.status === 401) {
        return false
      }

      setError(payload.error || "No se pudo verificar la conexión con Google Drive.")
      return false
    } catch (connectionError) {
      console.error("[Google Drive] Connection verification failed", connectionError)
      setIsConnected(false)
      setError("No se pudo verificar la conexión con Google Drive.")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void testConnection()
  }, [testConnection])

  const reconnect = useCallback(async (): Promise<void> => {
    await testConnection()
  }, [testConnection])

  return (
    <GoogleDriveContext.Provider value={{ isConnected, isLoading, error, testConnection, reconnect }}>
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
