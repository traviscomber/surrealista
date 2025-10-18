"use client"

import { useGoogleDrive } from "@/lib/contexts/google-drive-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react"

export function DriveStatusIndicator() {
  const { isConnected, isLoading, error, reconnect } = useGoogleDrive()

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Conectando...
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="gap-2">
          <CloudOff className="h-3 w-3" />
          Error
        </Badge>
        <Button size="sm" variant="ghost" onClick={reconnect}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="gap-2 bg-green-600">
        <Cloud className="h-3 w-3" />
        Drive Conectado
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-2">
        <CloudOff className="h-3 w-3" />
        Desconectado
      </Badge>
      <Button size="sm" variant="ghost" onClick={reconnect}>
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  )
}
