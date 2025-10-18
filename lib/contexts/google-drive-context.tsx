"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { driveService, type DriveFile, type DriveFolder } from "@/lib/google-drive/drive-service"

interface GoogleDriveContextType {
  driveService: typeof driveService | null
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

  // Initialize Drive service
  useEffect(() => {
    const initializeDrive = async () => {
      try {
        console.log("[v0] Initializing Google Drive connection...")
        setIsLoading(true)
        setError(null)

        // Test connection using the singleton driveService
        const connected = await driveService.testConnection()
        setIsConnected(connected)

        if (connected) {
          console.log("[v0] Google Drive connected successfully")
          // Store connection state in localStorage
          localStorage.setItem("gdrive_connected", "true")
          localStorage.setItem("gdrive_connected_at", new Date().toISOString())
        } else {
          console.warn("[v0] Google Drive connection test failed")
          setError("Failed to connect to Google Drive")
          localStorage.removeItem("gdrive_connected")
        }
      } catch (err) {
        console.error("[v0] Error initializing Google Drive:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setIsConnected(false)
        localStorage.removeItem("gdrive_connected")
      } finally {
        setIsLoading(false)
      }
    }

    initializeDrive()
  }, [])

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
        localStorage.removeItem("gdrive_connected")
      }

      return connected
    } catch (err) {
      console.error("[v0] Connection test failed:", err)
      setError(err instanceof Error ? err.message : "Connection test failed")
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

// Export types for convenience
export type { DriveFile, DriveFolder }
