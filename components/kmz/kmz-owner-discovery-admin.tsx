"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  MessageSquare,
  Zap,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DiscoveryResult {
  kmz_id: string
  file_name: string
  status: "pending" | "success" | "error" | "skipped"
  confidence: number
  owners_found: number
  companies_found: number
  leads_found: number
  message?: string
}

interface DiscoveryStats {
  total: number
  processed: number
  successful: number
  errors: number
  average_confidence: number
}

export function KMZOwnerDiscoveryAdmin() {
  const [activeTab, setActiveTab] = useState<"extract" | "leads" | "neighbors" | "queue">("extract")
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<DiscoveryResult[]>([])
  const [stats, setStats] = useState<DiscoveryStats>({
    total: 0,
    processed: 0,
    successful: 0,
    errors: 0,
    average_confidence: 0,
  })
  const [loading, setLoading] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [selectedResult, setSelectedResult] = useState<DiscoveryResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpanded = (kmzId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(kmzId)) {
      newExpanded.delete(kmzId)
    } else {
      newExpanded.add(kmzId)
    }
    setExpandedRows(newExpanded)
  }

  const runExtractOwners = async (persist: boolean = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/kmz/owner-discovery/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dry_run: !persist,
          search_query: searchQuery || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to run extraction")

      const data = await response.json()
      setResults(data.results || [])
      setStats(data.stats || {})

      if (persist) {
        alert(`✅ Enriquecimiento completado: ${data.stats.successful} con dueños encontrados`)
      }
    } catch (error) {
      console.error("Error running extraction:", error)
      alert("Error al ejecutar extracción de dueños")
    } finally {
      setLoading(false)
    }
  }

  const runPublicLeads = async (persist: boolean = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/kmz/owner-discovery/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dry_run: !persist,
          search_query: searchQuery || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to run leads search")

      const data = await response.json()
      setResults(data.results || [])
      setStats(data.stats || {})

      if (persist) {
        alert(`✅ Búsqueda de leads completada: ${data.stats.successful} con contactos encontrados`)
      }
    } catch (error) {
      console.error("Error running leads search:", error)
      alert("Error al buscar leads públicos")
    } finally {
      setLoading(false)
    }
  }

  const runNeighborContacts = async (persist: boolean = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/kmz/owner-discovery/neighbors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dry_run: !persist,
          search_query: searchQuery || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to run neighbor search")

      const data = await response.json()
      setResults(data.results || [])
      setStats(data.stats || {})

      if (persist) {
        alert(`✅ Búsqueda de vecinos completada: ${data.stats.successful} contactos registrados`)
      }
    } catch (error) {
      console.error("Error running neighbor search:", error)
      alert("Error al buscar contactos de vecinos")
    } finally {
      setLoading(false)
    }
  }

  const runAutoQueue = async (persist: boolean = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/kmz/owner-discovery/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dry_run: !persist,
          batch_size: 50,
        }),
      })

      if (!response.ok) throw new Error("Failed to queue batch")

      const data = await response.json()
      setResults(data.results || [])
      setStats(data.stats || {})

      if (persist) {
        alert(`✅ Cola de procesamiento: ${data.stats.processed} KMZ encolados (${data.stats.successful} exitosos)`)
      }
    } catch (error) {
      console.error("Error running auto queue:", error)
      alert("Error al encolar batch automático")
    } finally {
      setLoading(false)
    }
  }

  const handlePersist = () => {
    if (!selectedResult) return

    const persistFn = {
      extract: () => runExtractOwners(true),
      leads: () => runPublicLeads(true),
      neighbors: () => runNeighborContacts(true),
      queue: () => runAutoQueue(true),
    }[activeTab]

    if (persistFn) {
      persistFn().then(() => setShowConfirmDialog(false))
    }
  }

  const renderTab = () => {
    const tabConfig = {
      extract: {
        title: "Extrae Dueños",
        description: "Extrae propietarios de nombres de archivos KMZ",
        icon: Building2,
        runFn: () => runExtractOwners(false),
      },
      leads: {
        title: "Leads Públicos",
        description: "Busca leads públicos en registros comerciales",
        icon: Users,
        runFn: () => runPublicLeads(false),
      },
      neighbors: {
        title: "Contactos Vecinos",
        description: "Busca contactos de propiedades vecinas registradas",
        icon: MessageSquare,
        runFn: () => runNeighborContacts(false),
      },
      queue: {
        title: "Cola Automática",
        description: "Procesa lotes de 50 KMZ en background",
        icon: Zap,
        runFn: () => runAutoQueue(false),
      },
    }

    const config = tabConfig[activeTab]
    const Icon = config.icon

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-5 w-5 text-blue-600" />
              <CardTitle>{config.title}</CardTitle>
            </div>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Filtrar por nombre de archivo o ROL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs font-medium text-slate-600">Total</div>
                <div className="text-lg font-bold text-slate-900">{stats.total}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-600">Procesados</div>
                <div className="text-lg font-bold text-blue-900">{stats.processed}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs font-medium text-green-600">Exitosos</div>
                <div className="text-lg font-bold text-green-900">{stats.successful}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-xs font-medium text-amber-600">Confianza</div>
                <div className="text-lg font-bold text-amber-900">{stats.average_confidence.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={config.runFn}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Dry Run (Preview)
                  </>
                )}
              </Button>

              {results.length > 0 && (
                <Button
                  onClick={() => {
                    setSelectedResult(results[0])
                    setShowConfirmDialog(true)
                  }}
                  variant="destructive"
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Persistir {results.length} Cambios
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div key={result.kmz_id} className="border rounded-lg">
                    <button
                      onClick={() => toggleRowExpanded(result.kmz_id)}
                      className="w-full p-3 hover:bg-slate-50 flex items-center gap-2 text-sm"
                    >
                      {expandedRows.has(result.kmz_id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}

                      <div className="flex-1 text-left">
                        <p className="font-medium truncate">{result.file_name}</p>
                        <p className="text-xs text-slate-500">
                          Confianza: {result.confidence.toFixed(2)} • Dueños: {result.owners_found} • Leads: {result.leads_found}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {result.status === "success" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✓ Éxito
                          </Badge>
                        )}
                        {result.status === "error" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            ✕ Error
                          </Badge>
                        )}
                        {result.status === "pending" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            ◯ Pendiente
                          </Badge>
                        )}
                      </div>
                    </button>

                    {expandedRows.has(result.kmz_id) && (
                      <div className="px-3 pb-3 border-t bg-slate-50 text-xs space-y-2">
                        <div>
                          <span className="font-medium">Mensaje:</span>
                          <p className="text-slate-600">{result.message || "Sin detalles"}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="font-medium block">Dueños</span>
                            <span className="text-slate-600">{result.owners_found}</span>
                          </div>
                          <div>
                            <span className="font-medium block">Empresas</span>
                            <span className="text-slate-600">{result.companies_found}</span>
                          </div>
                          <div>
                            <span className="font-medium block">Leads</span>
                            <span className="text-slate-600">{result.leads_found}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">KMZ Owner Intelligence</h1>
        <p className="text-slate-600">Pipeline de extracción de dueños y leads desde archivos KMZ</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["extract", "leads", "neighbors", "queue"] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab === "extract" && "📄 Extraer Dueños"}
            {tab === "leads" && "🔍 Leads Públicos"}
            {tab === "neighbors" && "👥 Vecinos"}
            {tab === "queue" && "⚡ Cola Auto"}
          </Button>
        ))}
      </div>

      {renderTab()}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Persistencia</DialogTitle>
            <DialogDescription>
              Estás a punto de persistir {results.length} cambios en la base de datos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> Se actualizarán {stats.successful} registros KMZ con nueva información
              de dueños, empresas y leads.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePersist} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Sí, Persistir Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
