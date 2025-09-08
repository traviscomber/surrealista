"use client"

import { useState } from "react"
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
  Download,
  Upload,
  FileText,
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
  MessageSquare,
  Activity,
  Filter,
  RefreshCw,
  ExternalLink,
  Plus,
  MapPin,
  DollarSign,
  Target,
  Zap,
} from "lucide-react"

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: "hot" | "warm" | "cold" | "inactive"
  industry: string
  location: string
  lastContact: string
  nextFollowUp: string
  projectValue: number
  probability: number
  documents: number
  driveFolder: string
  notes: string
  score: number
  interactions: number
  source: string
  assignedTo: string
  tags: string[]
  createdAt: string
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Carlos Mendoza",
    company: "Inversiones del Sur",
    email: "carlos@inversionesdelsur.cl",
    phone: "+56 9 8765 4321",
    status: "hot",
    industry: "Inmobiliaria",
    location: "Puerto Varas, Los Lagos",
    lastContact: "2024-01-15",
    nextFollowUp: "2024-01-20",
    projectValue: 850000000,
    probability: 85,
    documents: 12,
    driveFolder: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
    notes:
      "Cliente VIP interesado en propiedades de lujo con vista al lago. Ha mostrado gran interés en el proyecto de Puerto Varas.",
    score: 92,
    interactions: 24,
    source: "Referido",
    assignedTo: "María González",
    tags: ["VIP", "Lujo", "Vista Lago"],
    createdAt: "2023-11-15",
  },
  {
    id: "2",
    name: "Ana Silva",
    company: "Turismo Patagonia",
    email: "ana@turismopatagonia.cl",
    phone: "+56 9 7654 3210",
    status: "warm",
    industry: "Turismo",
    location: "Pucón, La Araucanía",
    lastContact: "2024-01-10",
    nextFollowUp: "2024-01-25",
    projectValue: 450000000,
    probability: 65,
    documents: 8,
    driveFolder: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
    notes: "Busca cabañas para proyecto turístico. Necesita financiamiento adicional.",
    score: 78,
    interactions: 15,
    source: "Web",
    assignedTo: "Roberto Silva",
    tags: ["Turismo", "Cabañas", "Financiamiento"],
    createdAt: "2023-12-01",
  },
  {
    id: "3",
    name: "Roberto Fernández",
    company: "Forestal Los Andes",
    email: "roberto@forestallosandes.cl",
    phone: "+56 9 6543 2109",
    status: "cold",
    industry: "Forestal",
    location: "Valdivia, Los Ríos",
    lastContact: "2023-12-20",
    nextFollowUp: "2024-02-01",
    projectValue: 1200000000,
    probability: 35,
    documents: 15,
    driveFolder: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
    notes: "Proyecto de conservación forestal en evaluación. Esperando aprobación de directorio.",
    score: 45,
    interactions: 8,
    source: "LinkedIn",
    assignedTo: "Carlos Mendoza",
    tags: ["Forestal", "Conservación", "Directorio"],
    createdAt: "2023-10-10",
  },
  {
    id: "4",
    name: "Valentina Torres",
    company: "Constructora Austral",
    email: "valentina@constructoraaustral.cl",
    phone: "+56 9 5432 1098",
    status: "hot",
    industry: "Construcción",
    location: "Osorno, Los Lagos",
    lastContact: "2024-01-18",
    nextFollowUp: "2024-01-22",
    projectValue: 680000000,
    probability: 90,
    documents: 18,
    driveFolder: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
    notes: "Lista para firmar contrato. Solo esperando últimos detalles legales.",
    score: 95,
    interactions: 32,
    source: "Referido",
    assignedTo: "María González",
    tags: ["Construcción", "Contrato", "Legal"],
    createdAt: "2023-09-20",
  },
  {
    id: "5",
    name: "Diego Morales",
    company: "Agrícola Chiloe",
    email: "diego@agricolachiloe.cl",
    phone: "+56 9 4321 0987",
    status: "inactive",
    industry: "Agricultura",
    location: "Castro, Los Lagos",
    lastContact: "2023-11-30",
    nextFollowUp: "2024-03-01",
    projectValue: 320000000,
    probability: 15,
    documents: 5,
    driveFolder: "https://drive.google.com/drive/folders/1wJRhFJNpIqoJ_O9FPIhpPglmypnwgt5F",
    notes: "Proyecto pausado por temporada. Retomar en marzo 2024.",
    score: 25,
    interactions: 4,
    source: "Feria",
    assignedTo: "Roberto Silva",
    tags: ["Agricultura", "Pausado", "Temporada"],
    createdAt: "2023-08-15",
  },
]

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
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    const matchesIndustry = industryFilter === "all" || client.industry === industryFilter

    return matchesSearch && matchesStatus && matchesIndustry
  })

  const stats = {
    total: clients.length,
    hot: clients.filter((c) => c.status === "hot").length,
    warm: clients.filter((c) => c.status === "warm").length,
    cold: clients.filter((c) => c.status === "cold").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
    totalValue: clients.reduce((sum, c) => sum + c.projectValue, 0),
    totalDocuments: clients.reduce((sum, c) => sum + c.documents, 0),
    avgProbability: Math.round(clients.reduce((sum, c) => sum + c.probability, 0) / clients.length),
    totalInteractions: clients.reduce((sum, c) => sum + c.interactions, 0),
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repositorio de Clientes</h1>
          <p className="text-gray-600">Sistema Neuralia - Gestión Inteligente con Google Drive</p>
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
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Traffic Light Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.totalInteractions} interacciones totales</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Clientes Calientes</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.hot}</div>
            <p className="text-xs text-red-600">Alta probabilidad de cierre</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Clientes Tibios</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warm}</div>
            <p className="text-xs text-yellow-600">Seguimiento activo</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Clientes Fríos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.cold}</div>
            <p className="text-xs text-blue-600">Seguimiento espaciado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalValue / 1000000000).toFixed(1)}B</div>
            <p className="text-xs text-muted-foreground">Prob. promedio: {stats.avgProbability}%</p>
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
            <span>Lista de Clientes ({filteredClients.length})</span>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Button>
          </CardTitle>
          <CardDescription>Sistema de semáforo: 🔥 Caliente | 🎯 Tibio | ❄️ Frío | ⚫ Inactivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Probabilidad</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Próximo Seguimiento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.company}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {client.location}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[client.status].bgColor} ${statusConfig[client.status].textColor}`}
                      >
                        {statusConfig[client.status].icon}
                        {statusConfig[client.status].label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {client.email}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {formatCurrency(client.projectValue)}
                        </div>
                        <div className="text-xs text-gray-500">{client.industry}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              client.probability >= 80
                                ? "bg-green-500"
                                : client.probability >= 60
                                  ? "bg-yellow-500"
                                  : client.probability >= 40
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                            }`}
                            style={{ width: `${client.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{client.probability}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${getScoreColor(client.score)}`} />
                        <span className={`font-medium ${getScoreColor(client.score)}`}>{client.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{client.documents}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(client.driveFolder, "_blank")}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{client.nextFollowUp}</span>
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
                          <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(client.driveFolder, "_blank")}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Abrir Drive
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar mensaje
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
                    <div className="text-xl">{selectedClient.name}</div>
                    <div className="text-sm text-gray-500 font-normal">{selectedClient.company}</div>
                  </div>
                  <div
                    className={`ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedClient.status].bgColor} ${statusConfig[selectedClient.status].textColor}`}
                  >
                    {statusConfig[selectedClient.status].icon}
                    {statusConfig[selectedClient.status].label}
                  </div>
                </DialogTitle>
                <DialogDescription>{statusConfig[selectedClient.status].description}</DialogDescription>
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
                        <span>{selectedClient.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.industry}</span>
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
                          <Star className={`w-4 h-4 ${getScoreColor(selectedClient.score)}`} />
                          <span className={`font-bold ${getScoreColor(selectedClient.score)}`}>
                            {selectedClient.score}/100
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Probabilidad de Cierre</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                selectedClient.probability >= 80
                                  ? "bg-green-500"
                                  : selectedClient.probability >= 60
                                    ? "bg-yellow-500"
                                    : selectedClient.probability >= 40
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                              }`}
                              style={{ width: `${selectedClient.probability}%` }}
                            />
                          </div>
                          <span className="font-bold">{selectedClient.probability}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Interacciones</span>
                        <span className="font-bold">{selectedClient.interactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Fuente</span>
                        <Badge variant="outline">{selectedClient.source}</Badge>
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
                        <span className="font-bold text-green-600">{formatCurrency(selectedClient.projectValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Asignado a</span>
                        <Badge>{selectedClient.assignedTo}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Último Contacto</span>
                        <span>{selectedClient.lastContact}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Próximo Seguimiento</span>
                        <span className="font-medium text-blue-600">{selectedClient.nextFollowUp}</span>
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
                        <span className="font-bold">{selectedClient.documents}</span>
                      </div>
                      <Button className="w-full" onClick={() => window.open(selectedClient.driveFolder, "_blank")}>
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
                        {selectedClient.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
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
                  <p className="text-gray-700">{selectedClient.notes}</p>
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
