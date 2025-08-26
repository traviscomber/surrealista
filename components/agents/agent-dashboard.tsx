"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DocumentOrchestrator } from "@/lib/agents/orchestrator"

export function AgentDashboard() {
  const [orchestrator] = useState(() => new DocumentOrchestrator())
  const [isProcessing, setIsProcessing] = useState(false)
  const [taskStatus, setTaskStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })
  const [results, setResults] = useState<any>(null)

  const startProcessing = async () => {
    setIsProcessing(true)

    try {
      const result = await orchestrator.processGoogleDriveFolder("11JY7ME6h72wrjud9bYwduqYSbFRcH7i5")
      setResults(result)
    } catch (error) {
      console.error("[v0] Agent processing failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskStatus(orchestrator.getTaskStatus())
    }, 1000)

    return () => clearInterval(interval)
  }, [orchestrator])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema Agéntico Documental</h2>
        <Button onClick={startProcessing} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
          {isProcessing ? "Procesando..." : "Iniciar Procesamiento"}
        </Button>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{taskStatus.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskStatus.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStatus.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStatus.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Procesamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "Exitoso" : "Fallido"}
              </Badge>
              <span className="text-sm text-gray-600">Confianza: {Math.round(results.confidence * 100)}%</span>
            </div>

            <Progress value={results.confidence * 100} className="w-full" />

            {results.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Análisis de Carpetas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div>Score: {results.data.folderAnalysis?.compliance?.score || 0}%</div>
                      <div>Estándar: {results.data.folderAnalysis?.compliance?.followsStandard ? "✅" : "❌"}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Validación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div>Válido: {results.data.validation?.isValid ? "✅" : "❌"}</div>
                      <div>Issues: {results.data.validation?.issues?.length || 0}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Extracción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div>Roles: {results.data.extraction?.rolNumbers?.length || 0}</div>
                      <div>Fechas: {results.data.extraction?.dates?.length || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Arquitectura del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">📁</div>
              <h3 className="font-semibold">Folder Agent</h3>
              <p className="text-xs text-gray-600">Organización y estructura</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                🔍
              </div>
              <h3 className="font-semibold">Extraction Agent</h3>
              <p className="text-xs text-gray-600">OCR y extracción de datos</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                ✅
              </div>
              <h3 className="font-semibold">Validation Agent</h3>
              <p className="text-xs text-gray-600">Validación de estándares</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                📄
              </div>
              <h3 className="font-semibold">Document Agent</h3>
              <p className="text-xs text-gray-600">Clasificación inteligente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
