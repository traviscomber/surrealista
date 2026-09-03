"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Mail, MoreHorizontal, RefreshCw, Search, Trash2, Upload } from "lucide-react"

import { deleteClient, getClientStatistics, getClientsPaginated } from "@/app/actions/clients"
import { ClientEmailDialog } from "@/components/email/client-email-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  created_at?: string
  properties_bought?: number
  properties_sold?: number
  properties_quoted?: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function optionalString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key]
  return typeof value === "string" ? value : undefined
}

function optionalNumber(row: Record<string, unknown>, key: string): number | undefined {
  const value = row[key]
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function normalizeClient(value: unknown): Client | null {
  const row = asRecord(value)
  const id = optionalString(row, "id")
  if (!id) return null

  return {
    id,
    first_name: optionalString(row, "first_name"),
    last_name: optionalString(row, "last_name"),
    second_last_name: optionalString(row, "second_last_name"),
    email: optionalString(row, "email"),
    phone: optionalString(row, "phone"),
    mobile: optionalString(row, "mobile"),
    company_name: optionalString(row, "company_name"),
    industry: optionalString(row, "industry"),
    city: optionalString(row, "city"),
    region: optionalString(row, "region"),
    status: optionalString(row, "status"),
    budget_min: optionalNumber(row, "budget_min"),
    budget_max: optionalNumber(row, "budget_max"),
    last_contact_date: optionalString(row, "last_contact_date"),
    created_at: optionalString(row, "created_at"),
    properties_bought: optionalNumber(row, "properties_bought"),
    properties_sold: optionalNumber(row, "properties_sold"),
    properties_quoted: optionalNumber(row, "properties_quoted"),
  }
}

const statusLabels: Record<string, string> = {
  hot: "Caliente",
  warm: "Tibio",
  cold: "Frío",
  inactive: "Inactivo",
}

function fullName(client: Client) {
  return [client.first_name, client.last_name, client.second_last_name].filter(Boolean).join(" ") || client.company_name || "Cliente sin nombre"
}

function formatCurrency(value?: number) {
  if (!value) return "Sin presupuesto"
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
}

export function ClientRepositoryDashboard() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"completeness" | "created_at">("completeness")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [emailClient, setEmailClient] = useState<Client | null>(null)

  const load = async () => {
    setLoading(true)
    const filters: Record<string, string> = { sortBy }
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== "all") filters.status = statusFilter
    if (industryFilter !== "all") filters.industry = industryFilter

    const [clientsResult, statsResult] = await Promise.all([
      getClientsPaginated(currentPage, 10, filters),
      getClientStatistics(),
    ])

    if (clientsResult.success) {
      const normalizedClients = (clientsResult.data || [])
        .map(normalizeClient)
        .filter((client): client is Client => client !== null)
      setClients(normalizedClients)
      setTotalPages(clientsResult.totalPages || 0)
      setTotalClients(clientsResult.total || 0)
    }
    if (statsResult.success) setStatistics(statsResult)
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), searchTerm ? 350 : 0)
    return () => window.clearTimeout(timer)
  }, [currentPage, statusFilter, industryFilter, sortBy, searchTerm])

  const managedProperties = useMemo(
    () => clients.reduce((sum, client) => sum + (client.properties_bought || 0) + (client.properties_sold || 0) + (client.properties_quoted || 0), 0),
    [clients],
  )

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`¿Eliminar a ${fullName(client)}?`)) return
    const result = await deleteClient(client.id)
    if (result.success) await load()
  }

  if (loading && clients.length === 0) {
    return <div className="flex min-h-[420px] items-center justify-center border-y border-border text-sm text-muted-foreground">Cargando clientes…</div>
  }

  return (
    <section className="space-y-6 py-2">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="sr-meta">Relaciones comerciales</p>
          <h2 className="sr-section-title mt-1">Clientes</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consulta contactos, estado comercial, presupuesto y actividad reciente desde una vista única.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/clientes/importar")}>
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>

      <div className="grid border-y border-border md:grid-cols-4">
        {[
          ["Total", totalClients || statistics?.total || 0],
          ["Calientes", statistics?.byStatus?.hot || 0],
          ["Seguimiento", (statistics?.byStatus?.warm || 0) + (statistics?.byStatus?.cold || 0)],
          ["Propiedades gestionadas", managedProperties],
        ].map(([label, value], index) => (
          <div key={String(label)} className={`px-4 py-4 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
            <p className="sr-meta">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1) }} placeholder="Buscar por nombre, empresa o email…" />
        </div>
        <Select value={sortBy} onValueChange={(value: "completeness" | "created_at") => setSortBy(value)}>
          <SelectTrigger className="w-full xl:w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="completeness">Más completos</SelectItem><SelectItem value="created_at">Más recientes</SelectItem></SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1) }}>
          <SelectTrigger className="w-full xl:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="hot">Calientes</SelectItem><SelectItem value="warm">Tibios</SelectItem><SelectItem value="cold">Fríos</SelectItem><SelectItem value="inactive">Inactivos</SelectItem></SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={(value) => { setIndustryFilter(value); setCurrentPage(1) }}>
          <SelectTrigger className="w-full xl:w-44"><SelectValue placeholder="Industria" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas las industrias</SelectItem><SelectItem value="Inmobiliaria">Inmobiliaria</SelectItem><SelectItem value="Turismo">Turismo</SelectItem><SelectItem value="Forestal">Forestal</SelectItem><SelectItem value="Agricultura">Agricultura</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden border-b border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Contacto</TableHead><TableHead>Ubicación</TableHead><TableHead>Estado</TableHead><TableHead>Presupuesto</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No hay clientes para los filtros seleccionados.</TableCell></TableRow>
            ) : clients.map((client) => (
              <TableRow key={client.id} className="cursor-pointer" onClick={() => router.push(`/clientes/${client.id}`)}>
                <TableCell><div className="font-medium">{fullName(client)}</div><div className="text-xs text-muted-foreground">{client.company_name || client.industry || "Sin empresa"}</div></TableCell>
                <TableCell><div className="text-sm">{client.email || "Sin email"}</div><div className="text-xs text-muted-foreground">{client.mobile || client.phone || "Sin teléfono"}</div></TableCell>
                <TableCell>{[client.city, client.region].filter(Boolean).join(", ") || "Sin ubicación"}</TableCell>
                <TableCell><Badge variant="outline">{statusLabels[client.status || ""] || "Sin estado"}</Badge></TableCell>
                <TableCell>{formatCurrency(client.budget_max)}</TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/clientes/${client.id}`)}>Abrir ficha</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEmailClient(client)}><Mail className="h-4 w-4" />Enviar correo</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(client)}><Trash2 className="h-4 w-4" />Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Página {currentPage} de {Math.max(totalPages, 1)}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}><ChevronLeft className="h-4 w-4" />Anterior</Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Siguiente<ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {emailClient ? <ClientEmailDialog open={Boolean(emailClient)} onOpenChange={(open) => !open && setEmailClient(null)} clientName={fullName(emailClient)} clientEmail={emailClient.email || ""} clientId={emailClient.id} /> : null}
    </section>
  )
}
