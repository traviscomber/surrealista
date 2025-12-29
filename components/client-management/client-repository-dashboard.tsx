"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Upload,
  Users,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  Calendar,
  Building,
  Phone,
  Mail,
  Settings,
  AlertCircle,
  Clock,
  Star,
  Activity,
  Filter,
  RefreshCw,
  ExternalLink,
  Plus,
  MapPin,
  DollarSign,
  Target,
  Zap,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { getClientsPaginated, getClientStatistics, deleteClient } from "@/app/actions/clients"
import { useRouter } from "next/navigation"
import { ClientEmailDialog } from "@/components/email/client-email-dialog"

interface Client {
  id: string
  first_name?: string
  last_name?: string
  second_last_name?: string
  email?: string
  phone?: string
  mobile?: string
  company_name?: string
  industry?: string
  city?: string
  region?: string
  status?: string
  budget_min?: number
  budget_max?: number
  last_contact_date?: string
  notes?: string
  created_at?: string
  properties_bought?: number
  properties_sold?: number
  properties_quoted?: number
}

const statusConfig = {
  hot: {
    label: "Caliente",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: <Zap className="w-4 h-4" />,
    description: "Alta probabilidad de cierre",
  },
  warm: {
    label: "Tibio",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: <Target className="w-4 h-4" />,
    description: "Interés moderado, seguimiento activo",
  },
  cold: {
    label: "Frío",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: <Clock className="w-4 h-4" />,
    description: "Interés bajo, seguimiento espaciado",
  },
  inactive: {
    label: "Inactivo",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    icon: <AlertCircle className="w-4 h-4" />,
    description: "Sin actividad reciente",
  },
}

export function ClientRepositoryDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"completeness" | "created_at">("completeness")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedClientForEmail, setSelectedClientForEmail] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [pageSize] = useState(50)

  const [statistics, setStatistics] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    loadClients()
  }, [currentPage, statusFilter, industryFilter, sortBy])

  useEffect(() => {
    loadStatistics()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        setCurrentPage(1)
        loadClients()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadClients = async () => {
    console.log("[v0] Loading clients page", currentPage)
    setIsLoading(true)

    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== "all") filters.status = statusFilter
    if (industryFilter !== "all") filters.industry = industryFilter
    filters.sortBy = sortBy

    const result = await getClientsPaginated(currentPage, pageSize, filters)

    if (result.success) {
      console.log("[v0] Loaded", result.data.length, "clients of", result.total, "total")
      setClients(result.data)
      setTotalPages(result.totalPages || 0)
      setTotalClients(result.total || 0)
    }

    setIsLoading(false)
  }

  const loadStatistics = async () => {
    const result = await getClientStatistics()
    if (result.success) {
      setStatistics(result)
    }
  }

  const filteredClients = clients

  const stats = {
    total: totalClients || statistics?.total || 0,
    hot: statistics?.byStatus?.hot || 0,
    warm: statistics?.byStatus?.warm || 0,
    cold: statistics?.byStatus?.cold || 0,
    inactive: statistics?.byStatus?.inactive || 0,
    totalValue: clients.reduce((sum, c) => sum + (c.budget_max || 0), 0),
    totalDocuments: clients.reduce(
      (sum, c) => sum + ((c.properties_bought || 0) + (c.properties_sold || 0) + (c.properties_quoted || 0)),
      0,
    ),
    avgBudget:
      totalClients > 0 ? Math.round(clients.reduce((sum, c) => sum + (c.budget_max || 0), 0) / clients.length) : 0,
  }

  const handleRefresh = async () => {
    await Promise.all([loadClients(), loadStatistics()])
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      const result = await deleteClient(id)
      if (result.success) {
        await loadClients()
        await loadStatistics()
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repositorio de Clientes</h1>
          <p className="text-gray-600">Gestión Inteligente de Clientes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            onClick={() => router.push("/admin/clientes")}
          >
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          <Button className="flex items-center gap-2" onClick={() => router.push("/admin/clientes/nuevo")}>
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Traffic Light Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-sage/30 bg-sage/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sage-dark">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-dark">{stats.total}</div>
            <p className="text-xs text-sage">{stats.totalDocuments} propiedades gestionadas</p>
          </CardContent>
        </Card>

        <Card className="border-sage/30 bg-sage/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sage-dark">Clientes Calientes</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-dark">{stats.hot}</div>
            <p className="text-xs text-sage">Alta probabilidad de cierre</p>
          </CardContent>
        </Card>

        <Card className="border-sage/30 bg-sage/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sage-dark">Clientes Tibios</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-dark">{stats.warm}</div>
            <p className="text-xs text-sage">Seguimiento activo</p>
          </CardContent>
        </Card>

        <Card className="border-sage/30 bg-sage/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sage-dark">Clientes Fríos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-dark">{stats.cold}</div>
            <p className="text-xs text-sage">Seguimiento espaciado</p>
          </CardContent>
        </Card>

        <Card className="border-sage/30 bg-sage/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sage-dark">Presupuesto Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-sage" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-dark">{formatCurrency(stats.avgBudget)}</div>
            <p className="text-xs text-sage">Valor total: {formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda Avanzada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, empresa o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={(value: "completeness" | "created_at") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completeness">⭐ Más Completos</SelectItem>
                <SelectItem value="created_at">📅 Más Recientes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Estado del cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="hot">🔥 Calientes</SelectItem>
                <SelectItem value="warm">🎯 Tibios</SelectItem>
                <SelectItem value="cold">❄️ Fríos</SelectItem>
                <SelectItem value="inactive">⚫ Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las industrias</SelectItem>
                <SelectItem value="Inmobiliaria">Inmobiliaria</SelectItem>
                <SelectItem value="Turismo">Turismo</SelectItem>
                <SelectItem value="Forestal">Forestal</SelectItem>
                <SelectItem value="Construcción">Construcción</SelectItem>
                <SelectItem value="Agricultura">Agricultura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Lista de Clientes ({totalClients.toLocaleString()} total, mostrando {filteredClients.length})
            </span>
          </CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages} - Sistema con paginación optimizada para grandes volúmenes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Propiedades</TableHead>
                  <TableHead>Último Contacto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron clientes. Importa datos desde Excel para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{`${client.first_name || ""} ${client.last_name || ""}`}</div>
                            <div className="text-sm text-gray-500">{client.company_name || "-"}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {client.city || client.region || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.status && statusConfig[client.status as keyof typeof statusConfig] ? (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[client.status as keyof typeof statusConfig].bgColor} ${statusConfig[client.status as keyof typeof statusConfig].textColor}`}
                          >
                            {statusConfig[client.status as keyof typeof statusConfig].icon}
                            {statusConfig[client.status as keyof typeof statusConfig].label}
                          </div>
                        ) : (
                          <Badge variant="outline">Sin estado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {client.email || "-"}
                          </div>
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {client.phone || client.mobile || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {client.budget_max ? (
                            <>
                              <div className="font-medium flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                {formatCurrency(client.budget_max)}
                              </div>
                              {client.budget_min && (
                                <div className="text-xs text-gray-500">Min: {formatCurrency(client.budget_min)}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Compradas: {client.properties_bought || 0}</div>
                          <div>Vendidas: {client.properties_sold || 0}</div>
                          <div>Cotizadas: {client.properties_quoted || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {client.last_contact_date
                              ? new Date(client.last_contact_date).toLocaleDateString("es-CL")
                              : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            {client.email && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClientForEmail(client)
                                    setEmailDialogOpen(true)
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Enviar Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(client.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, totalClients)} de{" "}
                {totalClients.toLocaleString()} clientes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <div className="text-sm font-medium px-3">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Integración con Google Drive - API Key Disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">API Key Recibida - Lista para Configurar</span>
              </div>
              <div className="text-sm text-blue-700 mb-2">
                <strong>API Key:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded text-xs">AIzaSyB6AVo8HT0RyEmiu8YRKj3skR3ujXyjHTU</code>
              </div>
              <p className="text-sm text-blue-700">
                La API key de Google Drive ha sido proporcionada por Sur-Realista. Se han identificado 5 carpetas de
                casos de éxito reales que pueden ser procesadas ahora.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Casos de Éxito Disponibles</span>
              </div>
              <p className="text-sm text-green-700">
                Cada carpeta contiene documentos con números de rol que pueden ser extraídos automáticamente una vez
                configurada la integración.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Estado de conexión API</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                <Settings className="w-3 h-3 mr-1" />
                API Disponible - Lista para Configurar
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">5</div>
                <div className="text-sm text-green-600">Casos de Éxito</div>
                <div className="text-xs text-green-500 mt-1">Identificados</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">0/5</div>
                <div className="text-sm text-orange-600">Números de Rol</div>
                <div className="text-xs text-orange-500 mt-1">Por extraer</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">Disponible</div>
                <div className="text-sm text-blue-600">API Google Drive</div>
                <div className="text-xs text-blue-500 mt-1">Lista para configurar</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">Etapa 1</div>
                <div className="text-sm text-purple-600">Fase Actual</div>
                <div className="text-xs text-purple-500 mt-1">Configuración</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Documentos por Procesar:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Inscripciones de propiedades</li>
                <li>• Mandatos de venta</li>
                <li>• Tasaciones oficiales</li>
                <li>• Documentos legales complementarios</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                Con la API key disponible, los números de rol pueden ser extraídos automáticamente de cada documento.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                <Settings className="w-4 h-4 mr-2" />
                Configurar API
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Probar Conexión
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Ver Casos de Éxito
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Detail Modal */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl">{`${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`}</div>
                    <div className="text-sm text-gray-500 font-normal">{selectedClient.company_name || "-"}</div>
                  </div>
                  {selectedClient.status && statusConfig[selectedClient.status as keyof typeof statusConfig] && (
                    <div
                      className={`ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedClient.status as keyof typeof statusConfig].bgColor} ${statusConfig[selectedClient.status as keyof typeof statusConfig].textColor}`}
                    >
                      {statusConfig[selectedClient.status as keyof typeof statusConfig].icon}
                      {statusConfig[selectedClient.status as keyof typeof statusConfig].label}
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedClient.status && statusConfig[selectedClient.status as keyof typeof statusConfig]
                    ? statusConfig[selectedClient.status as keyof typeof statusConfig].description
                    : "Información no disponible"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.email || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.phone || selectedClient.mobile || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.city || selectedClient.region || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.industry || "-"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Métricas del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Score del Cliente</span>
                        <div className="flex items-center gap-2">
                          {/* Assuming a score field exists or using a placeholder */}
                          <Star className={`w-4 h-4 ${getScoreColor(selectedClient.score || 0)}`} />
                          <span className={`font-bold ${getScoreColor(selectedClient.score || 0)}`}>
                            {selectedClient.score || 0}/100
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Probabilidad de Cierre</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (selectedClient.properties_quoted || 0) >= 80 // Placeholder for probability logic
                                  ? "bg-green-500"
                                  : (selectedClient.properties_quoted || 0) >= 60
                                    ? "bg-yellow-500"
                                    : (selectedClient.properties_quoted || 0) >= 40
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                              style={{ width: `${selectedClient.properties_quoted || 0}%` }} // Placeholder for probability logic
                            />
                          </div>
                          <span className="font-bold">{selectedClient.properties_quoted || 0}%</span>{" "}
                          {/* Placeholder for probability logic */}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Interacciones</span>
                        <span className="font-bold">{selectedClient.properties_bought || 0}</span>{" "}
                        {/* Placeholder for interactions */}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Fuente</span>
                        <Badge variant="outline">{selectedClient.created_at ? "Sistema" : "-"}</Badge>{" "}
                        {/* Placeholder for source */}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Valor del Proyecto</span>
                        <span className="font-bold text-green-600">
                          {selectedClient.budget_max ? formatCurrency(selectedClient.budget_max) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Asignado a</span>
                        <Badge>{selectedClient.industry || "-"}</Badge> {/* Placeholder for assignedTo */}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Último Contacto</span>
                        <span>
                          {selectedClient.last_contact_date
                            ? new Date(selectedClient.last_contact_date).toLocaleDateString("es-CL")
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Próximo Seguimiento</span>
                        <span className="font-medium text-blue-600">
                          {selectedClient.created_at
                            ? new Date(selectedClient.created_at).toLocaleDateString("es-CL")
                            : "-"}
                        </span>{" "}
                        {/* Placeholder for nextFollowUp */}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        Documentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Total de Documentos</span>
                        <span className="font-bold">
                          {selectedClient.properties_bought ||
                            0 + (selectedClient.properties_sold || 0) + (selectedClient.properties_quoted || 0)}
                        </span>
                      </div>
                      <Button className="w-full" onClick={() => window.open(selectedClient.notes || "#", "_blank")}>
                        {" "}
                        {/* Placeholder for driveFolder */}
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Carpeta en Google Drive
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {/* Placeholder for tags, assuming industry can be used as a tag */}
                        <Badge variant="secondary">{selectedClient.industry || "Sin categoría"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedClient.notes || "No hay notas adicionales."}</p>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog Component */}
      {selectedClientForEmail && (
        <ClientEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          clientName={`${selectedClientForEmail.first_name || ""} ${selectedClientForEmail.last_name || ""}`}
          clientEmail={selectedClientForEmail.email}
          clientId={selectedClientForEmail.id}
        />
      )}
    </div>
  )
}
