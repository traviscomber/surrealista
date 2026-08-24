"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Database, FolderOpen, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KMZFile {
  id: string
  file_name: string
  region: string | null
  placemarks_count: number | null
  created_at: string
}

export function AgentDriveProcessor() {
  const { toast } = useToast()
  const [kmzFiles, setKmzFiles] = useState<KMZFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadKMZFiles = async () => {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from("kmz_collection")
          .select("id, file_name, region, placemarks_count, created_at")
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error
        setKmzFiles(data ?? [])
      } catch (error) {
        console.error("[agents] Error loading KMZ inventory:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el inventario KMZ",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadKMZFiles()
  }, [toast])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Inventario KMZ para agentes
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Archivos disponibles como contexto real. No se ejecuta procesamiento automático simulado.
            </p>
          </div>
          <Badge variant="outline">{kmzFiles.length} archivos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : kmzFiles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No hay archivos KMZ disponibles.</p>
            <p className="text-sm">Los KMZ reales se gestionan desde CAMPOS.</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {kmzFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-4 rounded border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.region || "Región no verificada"} · {file.placemarks_count ?? 0} placemarks
                  </p>
                </div>
                <Badge variant="secondary">Contexto</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
