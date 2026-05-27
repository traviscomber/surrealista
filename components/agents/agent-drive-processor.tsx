"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2, FolderOpen, CheckCircle, XCircle, AlertCircle, Play, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KMZFile {
  id: string
  file_name: string
  region: string | null
  placemarks_count: number | null
  created_at: string
}

interface ProcessingResult {
  fileId: string
  fileName: string
  status: "pending" | "processing" | "completed" | "failed"
  result?: any
  error?: string
}

export function AgentDriveProcessor() {
  const { toast } = useToast()
  const [kmzFiles, setKmzFiles] = useState<KMZFile[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    loadKMZFiles()
  }, [])

  const loadKMZFiles = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading KMZ files from Supabase for agent processing...")
      const { data, error } = await supabase
        .from("kmz_collection")
        .select("id, file_name, region, placemarks_count, created_at")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setKmzFiles(data || [])
      console.log("[v0] Loaded", data?.length || 0, "KMZ files for processing")
    } catch (error) {
      console.error("[v0] Error loading KMZ files:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos KMZ",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processFiles = async () => {
    if (kmzFiles.length === 0) return

    setProcessing(true)
    const newResults: ProcessingResult[] = kmzFiles.map((file) => ({
      fileId: file.id,
      fileName: file.file_name,
      status: "pending" as const,
    }))
    setResults(newResults)

    for (let i = 0; i < newResults.length; i++) {
      newResults[i].status = "processing"
      setResults([...newResults])

      try {
        // Simulate processing - in production this would do actual analysis
        await new Promise((resolve) => setTimeout(resolve, 500))
        newResults[i].status = "completed"
        newResults[i].result = {
          analyzed: true,
          placemarks: kmzFiles[i].placemarks_count || 0,
          region: kmzFiles[i].region || "Sin región",
        }
      } catch (error: any) {
        newResults[i].status = "failed"
        newResults[i].error = error.message
      }

      setResults([...newResults])
    }

    setProcessing(false)
    toast({
      title: "Procesamiento completado",
      description: `Se procesaron ${kmzFiles.length} archivos KMZ`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const completedCount = results.filter((r) => r.status === "completed").length
  const progress = results.length > 0 ? (completedCount / results.length) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Procesador de Archivos KMZ
          </CardTitle>
          <Badge variant="outline">{kmzFiles.length} archivos</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : kmzFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay archivos KMZ disponibles</p>
            <p className="text-sm">Carga archivos KMZ en la sección CAMPOS</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {kmzFiles.length} archivos listos para procesar
              </p>
              <Button onClick={processFiles} disabled={processing} size="sm">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Procesar Archivos
                  </>
                )}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progreso</span>
                  <span>{completedCount}/{results.length}</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {(results.length > 0 ? results : kmzFiles.map((f) => ({ fileId: f.id, fileName: f.file_name, status: "pending" as const }))).map((item) => (
                <div
                  key={item.fileId}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm truncate max-w-[200px]">{item.fileName}</span>
                  </div>
                  <Badge variant={item.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {item.status === "completed" ? "Listo" : item.status === "processing" ? "Procesando" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
