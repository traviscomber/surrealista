"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, TestTube, CheckCircle, XCircle } from "lucide-react"

interface TestResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  testInfo?: {
    agentInitialized: boolean
    extractionMethod: string
    timestamp: string
  }
}

export function SIIAgentTester() {
  const [comuna, setComuna] = useState("PUERTO OCTAY")
  const [manzana, setManzana] = useState("162")
  const [predio, setPredio] = useState("51")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/v1/sii/test-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comuna, manzana, predio }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            SII Browser Agent Tester
          </CardTitle>
          <CardDescription>
            Test the real SII browser agent that handles the accept button and extracts actual property data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="comuna">Comuna</Label>
              <Input
                id="comuna"
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="PUERTO OCTAY"
              />
            </div>
            <div>
              <Label htmlFor="manzana">Manzana</Label>
              <Input id="manzana" value={manzana} onChange={(e) => setManzana(e.target.value)} placeholder="162" />
            </div>
            <div>
              <Label htmlFor="predio">Predio</Label>
              <Input id="predio" value={predio} onChange={(e) => setPredio(e.target.value)} placeholder="51" />
            </div>
          </div>

          <Button onClick={runTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Browser Agent...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test SII Browser Agent
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "SUCCESS" : "FAILED"}
              </Badge>
              {testResult.testInfo && (
                <Badge variant="outline">
                  Agent: {testResult.testInfo.agentInitialized ? "Initialized" : "Failed"}
                </Badge>
              )}
            </div>

            {testResult.message && <p className="text-sm text-muted-foreground">{testResult.message}</p>}

            {testResult.error && <p className="text-sm text-red-500">Error: {testResult.error}</p>}

            {testResult.data && (
              <div className="space-y-3">
                <h4 className="font-semibold">Extracted Property Data:</h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ROL Predial:</strong> {testResult.data.rolPredial}
                  </div>
                  <div>
                    <strong>Coordinates:</strong> {testResult.data.coordinates.lat}, {testResult.data.coordinates.lng}
                  </div>
                  <div>
                    <strong>Address:</strong> {testResult.data.address}
                  </div>
                  <div>
                    <strong>Region:</strong> {testResult.data.region}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Catastro Legal:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-3 rounded">
                    <div>
                      <strong>Dirección:</strong> {testResult.data.catastroLegal.direccionPropiedad}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {testResult.data.catastroLegal.ubicacion}
                    </div>
                    <div>
                      <strong>Destino:</strong> {testResult.data.catastroLegal.destino}
                    </div>
                    <div>
                      <strong>Reavalúo:</strong> {testResult.data.catastroLegal.reavaluo}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">Catastro Valorizado:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-3 rounded">
                    <div>
                      <strong>Avalúo Total:</strong> ${testResult.data.catastroValorizado.avaluoTotal.toLocaleString()}
                    </div>
                    <div>
                      <strong>Avalúo Afecto:</strong> $
                      {testResult.data.catastroValorizado.avaluoAfecto.toLocaleString()}
                    </div>
                    <div>
                      <strong>Avalúo Exento:</strong> $
                      {testResult.data.catastroValorizado.avaluoExento.toLocaleString()}
                    </div>
                    <div>
                      <strong>Período:</strong> {testResult.data.catastroValorizado.periodoAvaluo}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {testResult.testInfo && (
              <div className="text-xs text-muted-foreground">
                Test completed at: {new Date(testResult.testInfo.timestamp).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
