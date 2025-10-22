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

const CONNECTION_PERSISTENCE_MS = 30 * 60 * 1000 // 30 minutes

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
        console.log("[v0] Environment:", {
          isProduction,
          hostname: typeof window !== "undefined" ? window.location.hostname : "server",
        })
        setIsLoading(true)
        setError(null)

        const storedConnection = localStorage.getItem("gdrive_connected")
        const storedTimestamp = localStorage.getItem("gdrive_connected_at")

        console.log("[v0] Cached connection status:", { storedConnection, storedTimestamp })

        if (storedConnection === "true" && storedTimestamp) {
          const connectionAge = Date.now() - new Date(storedTimestamp).getTime()
          const ageMinutes = Math.round(connectionAge / 1000 / 60)

          console.log("[v0] Connection age:", ageMinutes, "minutes")

          if (connectionAge < CONNECTION_PERSISTENCE_MS) {
            console.log("[v0] ✓ Using cached Google Drive connection (valid for", 30 - ageMinutes, "more minutes)")
            setIsConnected(true)
            setIsLoading(false)
            setError(null)
            return
          } else {
            console.log("[v0] Cached connection expired, will test connection...")
          }
        } else {
          console.log("[v0] No cached connection found, will test connection...")
        }

        console.log("[v0] Testing Google Drive connection...")
        const connected = await driveService.testConnection()
        console.log("[v0] Connection test result:", connected)

        setIsConnected(connected)

        if (connected) {
          console.log("[v0] ✓ Google Drive connected successfully")
          localStorage.setItem("gdrive_connected", "true")
          localStorage.setItem("gdrive_connected_at", new Date().toISOString())
          setError(null)
        } else {
          console.error("[v0] ✗ Google Drive connection test failed")
          // Only log the issue for debugging
          console.warn("[v0] Connection test failed, but API key may still work for operations")
          localStorage.removeItem("gdrive_connected")
          localStorage.removeItem("gdrive_connected_at")
        }
      } catch (err) {
        console.error("[v0] Error initializing Google Drive:", err)
        // The connection test might fail but actual operations might work
        console.warn("[v0] Connection initialization error, but will allow operations to proceed")
        setIsConnected(false)
        localStorage.removeItem("gdrive_connected")
        localStorage.removeItem("gdrive_connected_at")
      } finally {
        setIsLoading(false)
      }
    }

    initializeDrive()
  }, [isProduction])

  const testConnection = async (): Promise<boolean> => {
    try {
      console.log("[v0] Manual connection test initiated...")
      setIsLoading(true)
      setError(null)
      const connected = await driveService.testConnection()
      console.log("[v0] Manual test result:", connected)
      setIsConnected(connected)

      if (connected) {
        localStorage.setItem("gdrive_connected", "true")
        localStorage.setItem("gdrive_connected_at", new Date().toISOString())
        console.log("[v0] ✓ Connection cached")
        setError(null)
      } else {
        console.warn("[v0] Connection test failed")
        localStorage.removeItem("gdrive_connected")
        localStorage.removeItem("gdrive_connected_at")
      }

      return connected
    } catch (err) {
      console.error("[v0] Connection test failed:", err)
      setIsConnected(false)
      localStorage.removeItem("gdrive_connected")
      localStorage.removeItem("gdrive_connected_at")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const reconnect = async (): Promise<void> => {
    console.log("[v0] Reconnecting to Google Drive...")
    localStorage.removeItem("gdrive_connected")
    localStorage.removeItem("gdrive_connected_at")
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
