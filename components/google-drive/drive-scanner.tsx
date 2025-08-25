"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Folder, Search, CheckCircle, AlertCircle, FileText } from "lucide-react"

interface ScanResult {
  name: string
  status: "success" | "incomplete" | "processing"
  files: number
  rolNumbers: number
  completeness: number
}

export default function DriveScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [totalCases, setTotalCases] = useState(5)

  const newCasesFound = [
    {
      name: "CASA_TEMUCO_FAMILIA_RODRIGUEZ",
      status: "success" as const,
      files: 23,
      rolNumbers: 2,
      completeness: 95,
    },
    {
      name: "TERRENO_VILLARRICA_INVERSION_SA",
      status: "success" as const,
      files: 18,
      rolNumbers: 3,
      completeness: 90,
    },
    {
      name: "DEPTO_VALDIVIA_CENTRO_COMERCIAL",
      status: "incomplete" as const,
      files: 12,
      rolNumbers: 1,
      completeness: 65,
    },
    {
      name: "PARCELA_PUCON_VISTA_LAGO",
      status: "success" as const,
      files: 31,
      rolNumbers: 4,
      completeness: 98,
    },
    {
      name: "OFICINA_OSORNO_EDIFICIO_NUEVO",
      status: "processing" as const,
      files: 15,
      rolNumbers: 2,
      completeness: 75,
    },
  ]

  const startScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    setScanResults([])

    // Simulate scanning process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setScanProgress(i)

      if (i === 60) {
        setScanResults(newCasesFound.slice(0, 2))
      } else if (i === 80) {
        setScanResults(newCasesFound.slice(0, 4))
      } else if (i === 100) {
        setScanResults(newCasesFound)
        setTotalCases(10) // 5 original + 5 new
      }
    }

    setIsScanning(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "incomplete":
        return "bg-yellow-500"
      case "processing":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Completo"
      case "incomplete":
        return "Incompleto"
      case "processing":
        return "Procesando"
      default:
        return "Desconocido"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Reescaneo de Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Casos de éxito identificados: <span className="font-semibold text-green-600">{totalCases}</span>
            </p>
            <p className="text-xs text-muted-foreground">Última actualización: {new Date().toLocaleString()}</p>
          </div>
          <Button onClick={startScan} disabled={isScanning} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {isScanning ? "Escaneando..." : "Reescanear Drive"}
          </Button>
        </div>

        {isScanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso del escaneo</span>
              <span>{scanProgress}%</span>
            </div>
            <Progress value={scanProgress} className="w-full" />
          </div>
        )}

        {scanResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Nuevos casos encontrados:</h4>
            {scanResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">{result.name}</span>
                  </div>
                  <Badge className={`${getStatusColor(result.status)} text-white`}>
                    {getStatusText(result.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {result.files} archivos
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {result.rolNumbers} números de rol
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {result.completeness}% completo
                  </div>
                </div>

                <Progress value={result.completeness} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {!isScanning && scanResults.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Reescaneo completado: {scanResults.length} nuevos casos de éxito encontrados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
