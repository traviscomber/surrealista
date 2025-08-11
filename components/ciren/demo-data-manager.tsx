"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cirenService } from "@/lib/ciren/ciren-service"
import type { CirenCompany } from "@/lib/ciren/types"
import { Building, Plus, Download, Trash2, RefreshCw, Database } from "lucide-react"

export default function CirenDemoDataManager() {
  const [companies, setCompanies] = useState<CirenCompany[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, inmobiliarias: 0 })
  const [loading, setLoading] = useState(false)
  const [newCompany, setNewCompany] = useState({
    rut: "",
    razonSocial: "",
    nombreFantasia: "",
    actividadEconomica: "",
    fechaConstitucion: "",
    capital: "",
    estado: "Activa",
    region: "",
    comuna: "",
    direccion: "",
    telefono: "",
    email: "",
    scoring: "",
    categoria: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allCompanies = cirenService.getAllDemoCompanies()
    const currentStats = cirenService.getDemoStats()
    setCompanies(allCompanies)
    setStats(currentStats)
  }

  const handleLoadBaseData = () => {
    setLoading(true)
    cirenService.loadBaseDemoData()
    setTimeout(() => {
      loadData()
      setLoading(false)
    }, 500)
  }

  const handleGenerateRandom = async (count: number) => {
    setLoading(true)
    const newCompanies = cirenService.addRandomCompaniesToDemo(count)
    setTimeout(() => {
      loadData()
      setLoading(false)
    }, 1000)
  }

  const handleAddCompany = () => {
    if (!newCompany.rut || !newCompany.razonSocial) return

    const company = {
      ...newCompany,
      capital: Number.parseInt(newCompany.capital) || 0,
      scoring: Number.parseInt(newCompany.scoring) || 50,
    }

    cirenService.addCompanyToDemo(company)
    loadData()

    // Reset form
    setNewCompany({
      rut: "",
      razonSocial: "",
      nombreFantasia: "",
      actividadEconomica: "",
      fechaConstitucion: "",
      capital: "",
      estado: "Activa",
      region: "",
      comuna: "",
      direccion: "",
      telefono: "",
      email: "",
      scoring: "",
      categoria: "",
    })
  }

  const handleExportData = () => {
    const data = cirenService.exportDemoData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ciren-demo-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearData = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todos los datos demo?")) {
      cirenService.clearDemoData()
      loadData()
    }
  }

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Activa: "default",
      Inactiva: "secondary",
      "En Liquidación": "destructive",
    }
    return <Badge variant={variants[estado] || "secondary"}>{estado}</Badge>
  }

  const getCategoryBadge = (categoria: string) => {
    const colors: Record<string, string> = {
      "A+": "bg-green-100 text-green-800",
      A: "bg-green-100 text-green-700",
      "A-": "bg-yellow-100 text-yellow-800",
      "B+": "bg-yellow-100 text-yellow-700",
      B: "bg-orange-100 text-orange-700",
      "B-": "bg-orange-100 text-orange-800",
      C: "bg-red-100 text-red-700",
      D: "bg-red-100 text-red-800",
      E: "bg-red-200 text-red-900",
    }
    return <Badge className={colors[categoria] || "bg-gray-100 text-gray-800"}>{categoria}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inmobiliarias</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inmobiliarias}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Datos Demo</CardTitle>
          <CardDescription>Administra los datos de demostración para pruebas del sistema CIREN</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleLoadBaseData} disabled={loading} variant="outline">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Cargar Datos Demo
            </Button>
            <Button onClick={() => handleGenerateRandom(5)} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generar 5 Aleatorias
            </Button>
            <Button onClick={() => handleGenerateRandom(10)} disabled={loading} variant="secondary">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generar 10 Aleatorias
            </Button>
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
            <Button onClick={handleClearData} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Todo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Empresas</TabsTrigger>
          <TabsTrigger value="add">Agregar Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas Demo ({companies.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.map((company, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{company.razonSocial}</h3>
                        <p className="text-sm text-gray-600">{company.nombreFantasia}</p>
                        <p className="text-xs text-gray-500">RUT: {company.rut}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(company.estado)}
                        {getCategoryBadge(company.categoria)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Región:</span> {company.region}
                      </div>
                      <div>
                        <span className="font-medium">Comuna:</span> {company.comuna}
                      </div>
                      <div>
                        <span className="font-medium">Capital:</span> ${company.capital.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Scoring:</span> {company.scoring}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{company.actividadEconomica}</p>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay empresas demo cargadas. Usa los botones de arriba para cargar datos.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nueva Empresa</CardTitle>
              <CardDescription>Completa los datos para agregar una nueva empresa a los datos demo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rut">RUT *</Label>
                  <Input
                    id="rut"
                    value={newCompany.rut}
                    onChange={(e) => setNewCompany({ ...newCompany, rut: e.target.value })}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div>
                  <Label htmlFor="razonSocial">Razón Social *</Label>
                  <Input
                    id="razonSocial"
                    value={newCompany.razonSocial}
                    onChange={(e) => setNewCompany({ ...newCompany, razonSocial: e.target.value })}
                    placeholder="Inmobiliaria Ejemplo SpA"
                  />
                </div>
                <div>
                  <Label htmlFor="nombreFantasia">Nombre Fantasía</Label>
                  <Input
                    id="nombreFantasia"
                    value={newCompany.nombreFantasia}
                    onChange={(e) => setNewCompany({ ...newCompany, nombreFantasia: e.target.value })}
                    placeholder="Ejemplo Properties"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={newCompany.estado}
                    onValueChange={(value) => setNewCompany({ ...newCompany, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activa">Activa</SelectItem>
                      <SelectItem value="Inactiva">Inactiva</SelectItem>
                      <SelectItem value="En Liquidación">En Liquidación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="region">Región</Label>
                  <Select
                    value={newCompany.region}
                    onValueChange={(value) => setNewCompany({ ...newCompany, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                      <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                      <SelectItem value="La Araucanía">La Araucanía</SelectItem>
                      <SelectItem value="Biobío">Biobío</SelectItem>
                      <SelectItem value="Maule">Maule</SelectItem>
                      <SelectItem value="O'Higgins">O'Higgins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comuna">Comuna</Label>
                  <Input
                    id="comuna"
                    value={newCompany.comuna}
                    onChange={(e) => setNewCompany({ ...newCompany, comuna: e.target.value })}
                    placeholder="Puerto Varas"
                  />
                </div>
                <div>
                  <Label htmlFor="capital">Capital (CLP)</Label>
                  <Input
                    id="capital"
                    type="number"
                    value={newCompany.capital}
                    onChange={(e) => setNewCompany({ ...newCompany, capital: e.target.value })}
                    placeholder="500000000"
                  />
                </div>
                <div>
                  <Label htmlFor="scoring">Scoring (0-100)</Label>
                  <Input
                    id="scoring"
                    type="number"
                    min="0"
                    max="100"
                    value={newCompany.scoring}
                    onChange={(e) => setNewCompany({ ...newCompany, scoring: e.target.value })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={newCompany.telefono}
                    onChange={(e) => setNewCompany({ ...newCompany, telefono: e.target.value })}
                    placeholder="+56 65 2234567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="contacto@ejemplo.cl"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="actividadEconomica">Actividad Económica</Label>
                <Textarea
                  id="actividadEconomica"
                  value={newCompany.actividadEconomica}
                  onChange={(e) => setNewCompany({ ...newCompany, actividadEconomica: e.target.value })}
                  placeholder="Actividades inmobiliarias realizadas con bienes propios o arrendados"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={newCompany.direccion}
                  onChange={(e) => setNewCompany({ ...newCompany, direccion: e.target.value })}
                  placeholder="Av. Vicente Pérez Rosales 1234, Puerto Varas"
                />
              </div>
              <Button onClick={handleAddCompany} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Empresa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
