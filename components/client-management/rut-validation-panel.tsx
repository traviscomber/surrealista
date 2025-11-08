"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { validateClientRUT, updateClientFromRUT, validateAndCorrectAllClients } from "@/app/actions/rut-validation"

interface RUTValidationPanelProps {
  clientId?: string
  rut?: string
  currentName?: string
}

export function RUTValidationPanel({ clientId, rut, currentName }: RUTValidationPanelProps) {
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

  const handleValidateSingle = async () => {
    if (!clientId) return

    setValidating(true)
    setValidationResult(null)

    try {
      const result = await validateClientRUT(clientId)
      setValidationResult(result)
    } catch (error) {
      console.error("[v0] Error validating RUT:", error)
    } finally {
      setValidating(false)
    }
  }

  const handleUpdateClient = async () => {
    if (!clientId || !validationResult?.officialData) return

    setUpdating(true)

    try {
      const result = await updateClientFromRUT(clientId, validationResult.officialData)

      if (result.success) {
        setValidationResult({
          ...validationResult,
          success: true,
          data: {
            ...validationResult.data,
            match: true,
            needsUpdate: false,
            currentName: validationResult.data.officialName,
          },
        })
      }
    } catch (error) {
      console.error("[v0] Error updating client:", error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Validación de RUT
        </CardTitle>
        <CardDescription>
          Compara el nombre del cliente con los datos oficiales del SII y corrige automáticamente si no coinciden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current client info */}
        {rut && currentName && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-1">
            <div className="text-sm text-gray-600">Cliente actual:</div>
            <div className="font-semibold text-gray-900">{currentName}</div>
            <div className="text-sm text-blue-600">RUT: {rut}</div>
          </div>
        )}

        {/* Validate button */}
        <Button onClick={handleValidateSingle} disabled={validating || !clientId} className="w-full gap-2">
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando SII...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Validar con SII
            </>
          )}
        </Button>

        {/* Validation result */}
        {validationResult && validationResult.success && validationResult.data && (
          <div className="space-y-3">
            {/* Match status */}
            {validationResult.data.match ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✓ El nombre coincide con los datos del SII
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ El nombre NO coincide con los datos oficiales del SII
                </AlertDescription>
              </Alert>
            )}

            {/* Official name comparison */}
            <div className="p-4 border rounded-lg space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Nombre en base de datos:</div>
                <div className="font-medium text-gray-900">{validationResult.data.currentName}</div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm text-gray-600 mb-1">Nombre oficial SII:</div>
                <div className="font-semibold text-blue-700">{validationResult.data.officialName}</div>
              </div>

              {validationResult.officialData?.direccion && (
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-1">Dirección SII:</div>
                  <div className="text-sm text-gray-700">{validationResult.officialData.direccion}</div>
                </div>
              )}

              {validationResult.officialData?.actividades && validationResult.officialData.actividades.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-2">Actividades económicas:</div>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.officialData.actividades.slice(0, 3).map((act: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {act}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Update button if mismatch */}
            {validationResult.data.needsUpdate && (
              <Button onClick={handleUpdateClient} disabled={updating} className="w-full gap-2" variant="default">
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Corregir con Datos Oficiales
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Error state */}
        {validationResult && !validationResult.success && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error: {validationResult.error || "No se pudo validar el RUT"}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export function RUTBulkValidationPanel() {
  const [validating, setValidating] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleValidateAll = async () => {
    if (!confirm("¿Validar y corregir automáticamente TODOS los clientes con RUT? Esto puede tardar varios minutos.")) {
      return
    }

    setValidating(true)
    setResults(null)

    try {
      const result = await validateAndCorrectAllClients()
      setResults(result.results)
    } catch (error) {
      console.error("[v0] Error in bulk validation:", error)
    } finally {
      setValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Validación Masiva de RUTs
        </CardTitle>
        <CardDescription>
          Valida y corrige automáticamente TODOS los clientes con RUT consultando el SII
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta operación consultará el SII para cada cliente con RUT y actualizará automáticamente los nombres que no
            coincidan.
          </AlertDescription>
        </Alert>

        <Button onClick={handleValidateAll} disabled={validating} className="w-full gap-2" size="lg">
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando todos los clientes...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Validar y Corregir Todos
            </>
          )}
        </Button>

        {/* Results summary */}
        {results && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{results.total}</div>
                <div className="text-sm text-blue-600">Total clientes</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{results.corrected}</div>
                <div className="text-sm text-green-600">Corregidos</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{results.matches}</div>
                <div className="text-sm text-yellow-600">Ya correctos</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{results.failed}</div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
            </div>

            {/* Details */}
            {results.details && results.details.length > 0 && (
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <div className="text-sm font-semibold mb-2">Detalles de correcciones:</div>
                <div className="space-y-2">
                  {results.details.map((detail: any, idx: number) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium text-gray-900">RUT: {detail.rut}</div>
                      {detail.status === "corrected" && (
                        <>
                          <div className="text-gray-600">
                            Antes: <span className="line-through">{detail.before}</span>
                          </div>
                          <div className="text-green-700">Después: {detail.after}</div>
                        </>
                      )}
                      {detail.status === "failed" && <div className="text-red-600">Error: {detail.error}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
