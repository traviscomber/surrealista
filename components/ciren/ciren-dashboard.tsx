"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  MapPin,
  DollarSign,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import type { CIRENCompany } from "@/lib/ciren/types"

interface DashboardMetrics {
  totalCompanies: number
  averageScore: number
  totalCapital: number
  activeAlerts: number
  riskDistribution: {
    [key: string]: number
  }
  statusDistribution: {
    [key: string]: number
  }
}

export function CIRENDashboard() {
  const [companies, setCompanies] = useState<CIRENCompany[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedSector, setSelectedSector] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("year")

  // Mock data - En producción vendría de la API de CIREN
  const mockCompanies: CIRENCompany[] = [
    {
      rut: "76123456-7",
      razonSocial: "INMOBILIARIA PATAGONIA SPA",
      nombreFantasia: "Patagonia Properties",
      giro: "ACTIVIDADES INMOBILIARIAS",
      fechaConstitucion: "2020-01-15",
      capital: 100000000,
      estado: "ACTIVA",
      region: "Los Lagos",
      comuna: "Puerto Varas",
      direccion: "Costanera del Lago 500",
      scoring: 85,
      categoria: "A",
      sector: "INMOBILIARIO",
      fechaActualizacion: "2024-01-15",
    },
    {
      rut: "96234567-8",
      razonSocial: "DESARROLLOS DEL SUR LTDA",
      nombreFantasia: "Sur Desarrollos",
      giro: "CONSTRUCCION DE EDIFICIOS",
      fechaConstitucion: "2015-06-20",
      capital: 200000000,
      estado: "ACTIVA",
      region: "Los Lagos",
      comuna: "Puerto Varas",
      direccion: "Avenida Philippi 1850",
      scoring: 78,
      categoria: "B+",
      sector: "CONSTRUCCION",
      fechaActualizacion: "2024-01-10",
    },
    {
      rut: "87345678-9",
      razonSocial: "CONSTRUCTORA AUSTRAL LTDA",
      nombreFantasia: "Austral Construcciones",
      giro: "CONSTRUCCION DE OBRAS DE INGENIERIA CIVIL",
      fechaConstitucion: "2018-03-10",
      capital: 150000000,
      estado: "ACTIVA",
      region: "Los Ríos",
      comuna: "Valdivia",
      direccion: "Avenida Francia 1234",
      scoring: 72,
      categoria: "B",
      sector: "CONSTRUCCION",
      fechaActualizacion: "2024-01-12",
    },
    {
      rut: "78456789-0",
      razonSocial: "PROPIEDADES LAGOS SA",
      nombreFantasia: "Lagos Properties",
      giro: "ACTIVIDADES INMOBILIARIAS",
      fechaConstitucion: "2019-09-05",
      capital: 80000000,
      estado: "ACTIVA",
      region: "La Araucanía",
      comuna: "Pucón",
      direccion: "Avenida Bernardo O'Higgins 567",
      scoring: 88,
      categoria: "A",
      sector: "INMOBILIARIO",
      fechaActualizacion: "2024-01-14",
    },
    {
      rut: "89567890-1",
      razonSocial: "INVERSIONES INMOBILIARIAS SUR SPA",
      nombreFantasia: "Sur Inversiones",
      giro: "ACTIVIDADES INMOBILIARIAS",
      fechaConstitucion: "2021-11-20",
      capital: 120000000,
      estado: "ACTIVA",
      region: "Los Lagos",
      comuna: "Osorno",
      direccion: "Calle Mackenna 890",
      scoring: 82,
      categoria: "A-",
      sector: "INMOBILIARIO",
      fechaActualizacion: "2024-01-13",
    },
    {
      rut: "90678901-2",
      razonSocial: "CONSTRUCTORA RIESGO ALTO LTDA",
      nombreFantasia: "Riesgo Alto",
      giro: "CONSTRUCCION DE EDIFICIOS",
      fechaConstitucion: "2010-05-15",
      capital: 30000000,
      estado: "EN_LIQUIDACION",
      region: "Los Ríos",
      comuna: "La Unión",
      direccion: "Calle Principal 123",
      scoring: 35,
      categoria: "D",
      sector: "CONSTRUCCION",
      fechaActualizacion: "2024-01-08",
    },
    {
      rut: "91789012-3",
      razonSocial: "INMOBILIARIA PREMIUM LTDA",
      nombreFantasia: "Premium Properties",
      giro: "ACTIVIDADES INMOBILIARIAS",
      fechaConstitucion: "2022-02-28",
      capital: 250000000,
      estado: "ACTIVA",
      region: "La Araucanía",
      comuna: "Villarrica",
      direccion: "Costanera 456",
      scoring: 92,
      categoria: "A+",
      sector: "INMOBILIARIO",
      fechaActualizacion: "2024-01-16",
    },
    {
      rut: "92890123-4",
      razonSocial: "DESARROLLOS TURISTICOS SPA",
      nombreFantasia: "Turismo Desarrollos",
      giro: "CONSTRUCCION DE EDIFICIOS",
      fechaConstitucion: "2017-08-12",
      capital: 180000000,
      estado: "ACTIVA",
      region: "Los Lagos",
      comuna: "Frutillar",
      direccion: "Avenida Costanera 789",
      scoring: 76,
      categoria: "B+",
      sector: "CONSTRUCCION",
      fechaActualizacion: "2024-01-11",
    },
  ]

  useEffect(() => {
    loadData()
  }, [selectedRegion, selectedSector, selectedPeriod])

  const loadData = async () => {
    setLoading(true)

    // Simular carga de datos
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Filtrar datos según selecciones
    let filteredCompanies = mockCompanies

    if (selectedRegion !== "all") {
      filteredCompanies = filteredCompanies.filter((c) => c.region === selectedRegion)
    }

    if (selectedSector !== "all") {
      filteredCompanies = filteredCompanies.filter((c) => c.sector === selectedSector)
    }

    setCompanies(filteredCompanies)

    // Calcular métricas
    const totalCompanies = filteredCompanies.length
    const averageScore = Math.round(filteredCompanies.reduce((sum, c) => sum + c.scoring, 0) / totalCompanies)
    const totalCapital = filteredCompanies.reduce((sum, c) => sum + c.capital, 0)
    const activeAlerts = filteredCompanies.filter((c) => c.scoring < 50).length

    const riskDistribution = filteredCompanies.reduce(
      (acc, c) => {
        acc[c.categoria] = (acc[c.categoria] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    const statusDistribution = filteredCompanies.reduce(
      (acc, c) => {
        acc[c.estado] = (acc[c.estado] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    setMetrics({
      totalCompanies,
      averageScore,
      totalCapital,
      activeAlerts,
      riskDistribution,
      statusDistribution,
    })

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryColor = (categoria: string) => {
    const colors = {
      "A+": "bg-green-100 text-green-800",
      A: "bg-green-100 text-green-700",
      "A-": "bg-yellow-100 text-yellow-700",
      "B+": "bg-yellow-100 text-yellow-600",
      B: "bg-orange-100 text-orange-600",
      "B-": "bg-orange-100 text-orange-700",
      C: "bg-red-100 text-red-600",
      D: "bg-red-100 text-red-800",
    }
    return colors[categoria as keyof typeof colors] || "bg-gray-100 text-gray-600"
  }

  const getStatusColor = (estado: string) => {
    const colors = {
      ACTIVA: "bg-green-100 text-green-800",
      INACTIVA: "bg-gray-100 text-gray-600",
      EN_LIQUIDACION: "bg-red-100 text-red-800",
      SUSPENDIDA: "bg-yellow-100 text-yellow-700",
    }
    return colors[estado as keyof typeof colors] || "bg-gray-100 text-gray-600"
  }

  const exportReport = () => {
    const report = {
      fecha: new Date().toISOString(),
      filtros: {
        region: selectedRegion,
        sector: selectedSector,
        periodo: selectedPeriod,
      },
      metricas: metrics,
      empresas: companies,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-ciren-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
          <span className="text-lg">Cargando datos de CIREN...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard CIREN</h1>
          <p className="text-gray-500">Análisis de riesgo empresarial en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Región</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Regiones</SelectItem>
                  <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                  <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                  <SelectItem value="La Araucanía">La Araucanía</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Sector</label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Sectores</SelectItem>
                  <SelectItem value="INMOBILIARIO">Inmobiliario</SelectItem>
                  <SelectItem value="CONSTRUCCION">Construcción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Último Mes</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principales */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                  <p className="text-3xl font-bold">{metrics.totalCompanies}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scoring Promedio</p>
                  <p className="text-3xl font-bold">{metrics.averageScore}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capital Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalCapital)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                  <p className="text-3xl font-bold text-red-600">{metrics.activeAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Análisis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Resumen General</TabsTrigger>
          <TabsTrigger value="regions">Análisis por Región</TabsTrigger>
          <TabsTrigger value="sectors">Análisis por Sector</TabsTrigger>
          <TabsTrigger value="risk">Análisis de Riesgo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribución por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics &&
                  Object.entries(metrics.riskDistribution).map(([categoria, count]) => (
                    <div key={categoria} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(categoria)}>{categoria}</Badge>
                        <span className="text-sm">{count} empresas</span>
                      </div>
                      <Progress value={(count / metrics.totalCompanies) * 100} className="w-20" />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Estado de Empresas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Estado de Empresas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics &&
                  Object.entries(metrics.statusDistribution).map(([estado, count]) => (
                    <div key={estado} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(estado)}>{estado.replace("_", " ")}</Badge>
                        <span className="text-sm">{count} empresas</span>
                      </div>
                      <Progress value={(count / metrics.totalCompanies) * 100} className="w-20" />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Empresas */}
          <Card>
            <CardHeader>
              <CardTitle>Empresas Analizadas</CardTitle>
              <CardDescription>{companies.length} empresas encontradas con los filtros actuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companies.map((company) => (
                  <div key={company.rut} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">{company.razonSocial}</h4>
                        <Badge className={getCategoryColor(company.categoria)}>{company.categoria}</Badge>
                        <Badge className={getStatusColor(company.estado)}>{company.estado.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{company.nombreFantasia}</p>
                      <p className="text-sm text-gray-500">
                        {company.comuna}, {company.region} • {company.sector}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">Score: {company.scoring}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(company.capital)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Los Lagos", "Los Ríos", "La Araucanía"].map((region) => {
              const regionCompanies = companies.filter((c) => c.region === region)
              const avgScore =
                regionCompanies.length > 0
                  ? Math.round(regionCompanies.reduce((sum, c) => sum + c.scoring, 0) / regionCompanies.length)
                  : 0
              const avgCapital =
                regionCompanies.length > 0
                  ? regionCompanies.reduce((sum, c) => sum + c.capital, 0) / regionCompanies.length
                  : 0
              const riskLevel = avgScore >= 80 ? "Bajo" : avgScore >= 60 ? "Medio" : "Alto"
              const riskColor = avgScore >= 80 ? "text-green-600" : avgScore >= 60 ? "text-yellow-600" : "text-red-600"

              return (
                <Card key={region}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      {region}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{regionCompanies.length}</p>
                        <p className="text-sm text-gray-600">Empresas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{avgScore}</p>
                        <p className="text-sm text-gray-600">Score Promedio</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{formatCurrency(avgCapital)}</p>
                      <p className="text-sm text-gray-600">Capital Promedio</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${riskColor}`}>Riesgo: {riskLevel}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["INMOBILIARIO", "CONSTRUCCION"].map((sector) => {
              const sectorCompanies = companies.filter((c) => c.sector === sector)
              const avgScore =
                sectorCompanies.length > 0
                  ? Math.round(sectorCompanies.reduce((sum, c) => sum + c.scoring, 0) / sectorCompanies.length)
                  : 0
              const totalCapital = sectorCompanies.reduce((sum, c) => sum + c.capital, 0)
              const growth = Math.random() * 20 - 10 // Simular crecimiento

              return (
                <Card key={sector}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Sector {sector}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{sectorCompanies.length}</p>
                        <p className="text-sm text-gray-600">Empresas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{avgScore}</p>
                        <p className="text-sm text-gray-600">Score Promedio</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold">{formatCurrency(totalCapital)}</p>
                      <p className="text-sm text-gray-600">Capital Total</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Crecimiento Anual: {growth >= 0 ? "+" : ""}
                        {growth.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Empresas de Alto Riesgo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Alto Riesgo (Score &lt; 50)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companies
                    .filter((c) => c.scoring < 50)
                    .slice(0, 5)
                    .map((company) => (
                      <div key={company.rut} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{company.razonSocial}</p>
                          <p className="text-xs text-gray-600">
                            {company.comuna}, {company.region}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{company.scoring}</p>
                          <Badge className="bg-red-100 text-red-800">{company.categoria}</Badge>
                        </div>
                      </div>
                    ))}
                  {companies.filter((c) => c.scoring < 50).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No hay empresas de alto riesgo</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Empresas Top Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Top Performance (Score ≥ 80)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companies
                    .filter((c) => c.scoring >= 80)
                    .sort((a, b) => b.scoring - a.scoring)
                    .slice(0, 5)
                    .map((company) => (
                      <div key={company.rut} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{company.razonSocial}</p>
                          <p className="text-xs text-gray-600">
                            {company.comuna}, {company.region}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{company.scoring}</p>
                          <Badge className="bg-green-100 text-green-800">{company.categoria}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución de Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Distribución de Scoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { range: "90-100", color: "bg-green-500", label: "Excelente" },
                  { range: "80-89", color: "bg-green-400", label: "Muy Bueno" },
                  { range: "70-79", color: "bg-yellow-400", label: "Bueno" },
                  { range: "60-69", color: "bg-orange-400", label: "Regular" },
                  { range: "50-59", color: "bg-red-400", label: "Malo" },
                  { range: "0-49", color: "bg-red-600", label: "Crítico" },
                ].map((item) => {
                  const [min, max] = item.range.split("-").map(Number)
                  const count = companies.filter((c) => c.scoring >= min && c.scoring <= max).length
                  const percentage = companies.length > 0 ? (count / companies.length) * 100 : 0

                  return (
                    <div key={item.range} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium">{item.range}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className={`h-4 rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm w-12">{count}</span>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-600">{item.label}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
